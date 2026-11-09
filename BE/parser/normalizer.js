import crypto from 'crypto';

/**
 * Lược đồ Log chuẩn hóa (Standard Log Schema)
 * @typedef {Object} StandardLog
 * @property {string} timestamp - ISO8601 string
 * @property {string} service_name - Tên dịch vụ tạo log
 * @property {string} level - Log level (INFO, WARN, ERROR, FATAL, DEBUG)
 * @property {string} message - Nội dung chính của log
 * @property {Object} attributes - Các thông tin bổ sung (ip, http_method, status, user_agent, v.v.)
 * @property {string} hash_id - ID duy nhất tính bằng MD5 hash (dùng cho Idempotent Write)
 */

/**
 * Tạo Hash ID từ thông tin log để đảm bảo Idempotency (chống ghi trùng khi retry)
 */
export function generateLogHashId(timestamp, serviceName, message) {
  const rawStr = `${timestamp}_${serviceName}_${message}`;
  return crypto.createHash('md5').update(rawStr).digest('hex');
}

/**
 * Parse JSON Log Format
 */
export function parseJsonLog(payload) {
  let logObj = payload;
  if (typeof payload === 'string') {
    try {
      logObj = JSON.parse(payload);
    } catch (e) {
      return null;
    }
  }

  const timestamp = logObj.timestamp || logObj.time || logObj.datetime || new Date().toISOString();
  const serviceName = logObj.service || logObj.service_name || logObj.app || 'unknown-service';
  const level = (logObj.level || logObj.severity || 'INFO').toUpperCase();
  const message = logObj.message || logObj.msg || JSON.stringify(logObj);
  
  // Extract attributes
  const { timestamp: ts, time, datetime, service, service_name, app, level: lvl, severity, message: msg, ...attributes } = logObj;

  const hashId = generateLogHashId(timestamp, serviceName, message);

  return {
    timestamp: new Date(timestamp).toISOString(),
    service_name: serviceName,
    level,
    message,
    attributes,
    hash_id: hashId,
    raw_type: 'json'
  };
}

/**
 * Parse Nginx Access Log (Combined Log Format)
 * Example: 127.0.0.1 - - [14/Sep/2026:13:00:00 +0700] "GET /api/v1/logs HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
 */
export function parseNginxLog(rawLine, serviceName = 'nginx') {
  if (typeof rawLine !== 'string') return null;

  const regex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d{3}) (\d+|-)(?: "([^"]*)" "([^"]*)")?/;
  const match = rawLine.match(regex);

  if (!match) return null;

  const [_, clientIp, timeStr, method, url, httpVersion, statusStr, bytesStr, referrer, userAgent] = match;
  const status = parseInt(statusStr, 10);
  
  let level = 'INFO';
  if (status >= 500) level = 'ERROR';
  else if (status >= 400) level = 'WARN';

  // Parse time: 14/Sep/2026:13:00:00 +0700 -> Date object
  const timestamp = new Date(timeStr.replace(/:/, ' ')).toISOString();
  const message = `${method} ${url} ${statusStr} ${bytesStr}`;

  const attributes = {
    client_ip: clientIp,
    http_method: method,
    url,
    http_version: httpVersion,
    status_code: status,
    bytes_sent: bytesStr === '-' ? 0 : parseInt(bytesStr, 10),
    referrer: referrer || null,
    user_agent: userAgent || null
  };

  const hashId = generateLogHashId(timestamp, serviceName, message);

  return {
    timestamp,
    service_name: serviceName,
    level,
    message,
    attributes,
    hash_id: hashId,
    raw_type: 'nginx'
  };
}

/**
 * Parse Syslog RFC 3164 Format
 * Example: <34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8
 */
export function parseSyslog(rawLine, defaultService = 'syslog') {
  if (typeof rawLine !== 'string') return null;

  const regex = /^(?:<(\d+)>)?([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s+(.*)$/;
  const match = rawLine.match(regex);

  if (!match) return null;

  const [_, pri, timeStr, hostname, processName, msgContent] = match;

  let level = 'INFO';
  if (pri) {
    const severity = parseInt(pri, 10) % 8;
    if (severity <= 3) level = 'ERROR'; // Emergency, Alert, Critical, Error
    else if (severity === 4) level = 'WARN'; // Warning
  }

  const currentYear = new Date().getFullYear();
  const timestamp = new Date(`${timeStr} ${currentYear}`).toISOString();
  const serviceName = processName || defaultService;
  const hashId = generateLogHashId(timestamp, serviceName, msgContent);

  return {
    timestamp,
    service_name: serviceName,
    level,
    message: msgContent,
    attributes: {
      hostname,
      process: processName,
      priority: pri ? parseInt(pri, 10) : null
    },
    hash_id: hashId,
    raw_type: 'syslog'
  };
}

/**
 * Universal Log Parser Router
 */
export function parseLog(payload, defaultService = 'unknown') {
  if (!payload) return null;

  // Case 1: Payload là Object JSON
  if (typeof payload === 'object') {
    return parseJsonLog(payload);
  }

  // Case 2: Payload là String JSON
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsedJson = parseJsonLog(trimmed);
      if (parsedJson) return parsedJson;
    }

    // Try Nginx
    const parsedNginx = parseNginxLog(trimmed, defaultService);
    if (parsedNginx) return parsedNginx;

    // Try Syslog
    const parsedSyslog = parseSyslog(trimmed, defaultService);
    if (parsedSyslog) return parsedSyslog;

    // Fallback Unstructured Raw Log String
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      service_name: defaultService,
      level: 'INFO',
      message: trimmed,
      attributes: {},
      hash_id: generateLogHashId(timestamp, defaultService, trimmed),
      raw_type: 'raw'
    };
  }

  return null;
}
