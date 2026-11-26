/**
 * Anomaly Detection — Tầng 1: Rule-Based Detector
 * =================================================
 * Phát hiện bất thường dựa trên:
 *  1. Tần suất log ERROR/FATAL vượt ngưỡng trong một time window
 *  2. Xuất hiện từ khóa nghiêm trọng trong nội dung log message
 */

// Danh sách từ khóa nghiêm trọng mặc định cần phát hiện ngay lập tức
const CRITICAL_KEYWORDS = [
  'fatal error',
  'db connection failed',
  'database connection',
  'out of memory',
  'oom',
  'segfault',
  'segmentation fault',
  'kernel panic',
  'disk full',
  'no space left',
  'connection refused',
  'timeout exceeded',
  'service unavailable',
  'deadlock',
  'stack overflow'
];

let cachedDynamicKeywords = [];
let lastKeywordFetchAt = 0;

/**
 * Cập nhật bộ nhớ đệm từ khóa động từ SQLite (gọi bất đồng bộ từ Parser Worker để không chặn/lỗi benchmark thuần)
 */
export async function refreshDynamicKeywords() {
  const now = Date.now();
  if (now - lastKeywordFetchAt < 10_000) return cachedDynamicKeywords;
  lastKeywordFetchAt = now;
  try {
    const { default: db } = await import('../../database/sqlite.js');
    const row = db.prepare("SELECT gia_tri FROM cau_hinh_he_thong WHERE khoa = 'alertKeywords'").get();
    if (row?.gia_tri) {
      const parsed = JSON.parse(row.gia_tri);
      if (Array.isArray(parsed)) {
        cachedDynamicKeywords = parsed.map(k => String(k).trim().toLowerCase()).filter(Boolean);
      }
    }
  } catch {
    // Giữ cache cũ nếu DB chưa sẵn sàng hoặc đang chạy chế độ standalone
  }
  return cachedDynamicKeywords;
}

function getEffectiveKeywords() {
  return Array.from(new Set([...CRITICAL_KEYWORDS, ...cachedDynamicKeywords]));
}

// Mức log được coi là cần theo dõi tần suất
const ALERT_LEVELS = new Set(['ERROR', 'FATAL', 'CRITICAL']);

/**
 * Tính toán và phát hiện bất thường trong một cửa sổ thời gian (time window)
 *
 * @param {Array<Object>} logs           - Danh sách các log đã được chuẩn hóa (Standard Schema)
 * @param {Object} options
 * @param {number} options.errorThreshold  - Ngưỡng số log ERROR/FATAL trong window (mặc định 10)
 * @param {number} options.windowMs        - Kích thước time window (ms) cho việc đếm tần suất (mặc định 60000 = 1 phút)
 * @returns {Object} Kết quả phân tích: { isAnomaly, reasons, stats }
 */
export function detectRuleBased(logs, { errorThreshold = 10, windowMs = 60_000 } = {}) {
  const reasons = [];
  const stats = {
    total: logs.length,
    errorCount: 0,
    keywordMatches: []
  };

  const effectiveKeywords = getEffectiveKeywords();

  // --- Kiểm tra 1: Từ khóa nghiêm trọng (tĩnh + động từ Admin) ---
  for (const log of logs) {
    const msgLower = (log.message || '').toLowerCase();
    for (const kw of effectiveKeywords) {
      if (msgLower.includes(kw)) {
        stats.keywordMatches.push({ keyword: kw, message: log.message, timestamp: log.timestamp });
        reasons.push(`Từ khóa nghiêm trọng phát hiện: "${kw}" trong log lúc ${log.timestamp}`);
      }
    }
  }

  // --- Kiểm tra 2: Tần suất ERROR/FATAL vượt ngưỡng trong time window ---
  // Gom log theo từng time window và đếm số lượng ERROR/FATAL
  const alertLogs = logs.filter(l => ALERT_LEVELS.has(l.level));
  stats.errorCount = alertLogs.length;

  // Gom theo window (tổng thể trong tập logs đang xét)
  if (alertLogs.length > 0) {
    const firstTs = new Date(alertLogs[0].timestamp).getTime();
    const lastTs = new Date(alertLogs[alertLogs.length - 1].timestamp).getTime();
    const durationMs = Math.max(lastTs - firstTs, 1);
    const windowCount = Math.ceil(durationMs / windowMs);
    const avgErrorsPerWindow = alertLogs.length / windowCount;

    if (avgErrorsPerWindow >= errorThreshold) {
      reasons.push(
        `Tần suất log lỗi cao: ~${avgErrorsPerWindow.toFixed(1)} ERROR/FATAL mỗi ${windowMs / 1000}s (ngưỡng: ${errorThreshold})`
      );
    }
  }

  return {
    method: 'rule-based',
    is_anomaly: reasons.length > 0,
    reasons,
    stats
  };
}

/**
 * Kiểm tra nhanh một dòng log đơn lẻ theo từ khóa (dùng cho realtime stream)
 * @param {Object} log - Một log entry đã chuẩn hóa
 * @returns {{ isAnomaly: boolean, keyword?: string }}
 */
export function checkLogLineSingle(log) {
  const msgLower = (log.message || '').toLowerCase();
  for (const kw of getEffectiveKeywords()) {
    if (msgLower.includes(kw)) {
      return { is_anomaly: true, keyword: kw };
    }
  }
  if (ALERT_LEVELS.has(log.level)) {
    return { is_anomaly: false, level: log.level };
  }
  return { is_anomaly: false };
}
