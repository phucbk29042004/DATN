import fs from 'fs';
import readline from 'readline';

/**
 * BGL (Blue Gene/L) Log Dataset Loader
 * =====================================
 * Bộ dữ liệu BGL (Loghub) chứa log từ supercomputer Blue Gene/L với format:
 *
 *   Label  Timestamp  Date  Node  Time  NodeRepeat  Type  Component  Level  Content
 *
 * Quy ước nhãn:
 *  - "-"     : Dòng log bình thường (Normal)
 *  - Khác "-": Dòng log có cảnh báo (Alert/Anomaly) — ví dụ: FATAL, APPREAD, ...
 *
 * Đơn vị phát hiện: LOG LINE (mỗi dòng log có nhãn riêng biệt)
 * Có thể gom theo Fixed Time Window để tạo sequences.
 */

const BGL_LINE_REGEX = /^(\S+)\s+(\d+)\s+(\d{4}\.\d{2}\.\d{2})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;

/**
 * Bước 1: Parse từng dòng log BGL
 * @param {string} logFilePath - Đường dẫn tới BGL.log
 * @returns {Promise<Array>} Danh sách log entry với nhãn
 */
export async function parseBglLogFile(logFilePath) {
  const entries = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(logFilePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });

  let lineIndex = 0;
  for await (const line of rl) {
    lineIndex++;
    const match = line.match(BGL_LINE_REGEX);
    if (!match) continue;

    const [_, rawLabel, timestamp, date, node, time, nodeRepeat, type, component, level, content] = match;

    const isAnomaly = rawLabel !== '-';

    entries.push({
      line_id: lineIndex,
      label: rawLabel,           // Nhãn gốc từ dataset (chuỗi alert code hoặc "-")
      is_anomaly: isAnomaly,     // True nếu label !== "-"
      timestamp: parseInt(timestamp, 10),
      date,
      node,
      time,
      node_repeat: nodeRepeat,
      type,
      component,
      level: level.toUpperCase(),
      content
    });
  }

  return entries;
}

/**
 * Bước 2 (Tùy chọn): Gom các log entries thành Fixed Time Window sequences
 * Mỗi window là một đơn vị phát hiện bất thường (nếu có ít nhất 1 anomaly trong window => window là anomaly)
 *
 * @param {Array} entries          - Output của parseBglLogFile
 * @param {number} windowSizeMs    - Kích thước time window tính bằng milliseconds (mặc định 60000 = 1 phút)
 * @returns {Array} Danh sách windows với nhãn
 */
export function buildBglTimeWindows(entries, windowSizeMs = 60_000) {
  if (entries.length === 0) return [];

  const windows = [];
  const firstTs = entries[0].timestamp;
  let windowStart = firstTs;
  let windowEnd = firstTs + windowSizeMs;
  let currentWindow = [];

  for (const entry of entries) {
    if (entry.timestamp < windowEnd) {
      currentWindow.push(entry);
    } else {
      // Đóng window hiện tại
      if (currentWindow.length > 0) {
        const hasAnomaly = currentWindow.some(e => e.is_anomaly);
        windows.push({
          window_start: windowStart,
          window_end: windowEnd,
          log_count: currentWindow.length,
          is_anomaly: hasAnomaly,
          anomaly_count: currentWindow.filter(e => e.is_anomaly).length,
          log_lines: currentWindow
        });
      }

      // Mở window mới từ entry hiện tại
      windowStart = windowEnd;
      windowEnd = windowStart + windowSizeMs;
      currentWindow = [entry];
    }
  }

  // Đóng window cuối cùng
  if (currentWindow.length > 0) {
    const hasAnomaly = currentWindow.some(e => e.is_anomaly);
    windows.push({
      window_start: windowStart,
      window_end: windowEnd,
      log_count: currentWindow.length,
      is_anomaly: hasAnomaly,
      anomaly_count: currentWindow.filter(e => e.is_anomaly).length,
      log_lines: currentWindow
    });
  }

  return windows;
}

/**
 * Hàm tiện ích: Chạy toàn bộ pipeline BGL preprocessing
 * @param {string} logFile        - Đường dẫn BGL.log
 * @param {number} windowSizeMs   - Kích thước time window (ms) — mặc định 60000 (1 phút)
 */
export async function loadBglDataset(logFile, windowSizeMs = 60_000) {
  console.log('[BGL Loader] Đang parse log file...');
  const entries = await parseBglLogFile(logFile);

  const anomalyLines = entries.filter(e => e.is_anomaly).length;
  const normalLines = entries.length - anomalyLines;
  console.log(`[BGL Loader] Parse xong ${entries.length} dòng log | Anomaly lines: ${anomalyLines} | Normal lines: ${normalLines}`);

  console.log(`[BGL Loader] Đang gom time windows (${windowSizeMs}ms)...`);
  const windows = buildBglTimeWindows(entries, windowSizeMs);

  const anomalyWindows = windows.filter(w => w.is_anomaly).length;
  console.log(`[BGL Loader] Hoàn thành: ${windows.length} windows | Anomaly windows: ${anomalyWindows}`);

  return { entries, windows };
}
