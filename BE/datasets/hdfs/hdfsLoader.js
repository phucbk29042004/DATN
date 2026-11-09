import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * HDFS Log Dataset Loader
 * ========================
 * Bộ dữ liệu HDFS (Loghub) có 2 file:
 *  - HDFS.log       : Các dòng log thô (mỗi dòng gồm: LineId, Date, Time, Pid, Level, Component, Content)
 *  - anomaly_label.csv : Nhãn (BlockId, Label: Normal/Anomaly) cho từng block_id
 *
 * Đơn vị phát hiện: SEQUENCE theo block_id
 * - Gom tất cả dòng log liên quan đến cùng một block_id thành một sequence
 * - Label cả sequence là Normal/Anomaly theo file nhãn
 */

const HDFS_LOG_REGEX = /(\d+)\s+(\d{6})\s+(\d{6})\s+(\d+)\s+(\w+)\s+(\S+)\s+(.*)/;
const BLOCK_ID_REGEX = /blk_(-?\d+)/g;

/**
 * Bước 1: Parse file HDFS.log thành danh sách log entries chuẩn hóa
 * @param {string} logFilePath - Đường dẫn tới file HDFS.log
 * @returns {Promise<Array>} Danh sách log entry đã được parse
 */
export async function parseHdfsLogFile(logFilePath) {
  const entries = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(logFilePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const match = line.match(HDFS_LOG_REGEX);
    if (!match) continue;

    const [_, lineId, date, time, pid, level, component, content] = match;

    // Trích xuất tất cả block_id trong dòng log
    const blockIds = [];
    let m;
    const regex = new RegExp(BLOCK_ID_REGEX.source, 'g');
    while ((m = regex.exec(content)) !== null) {
      blockIds.push(`blk_${m[1]}`);
    }

    entries.push({
      line_id: parseInt(lineId, 10),
      date,
      time,
      pid,
      level: level.toUpperCase(),
      component,
      content,
      block_ids: blockIds
    });
  }

  return entries;
}

/**
 * Bước 2: Load file nhãn anomaly_label.csv
 * Format: BlockId,Label (header ở dòng 1)
 * @param {string} labelFilePath - Đường dẫn tới anomaly_label.csv
 * @returns {Promise<Map<string, string>>} Map: blockId -> "Normal" | "Anomaly"
 */
export async function loadHdfsLabels(labelFilePath) {
  const labelMap = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(labelFilePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) { isFirstLine = false; continue; } // Skip header
    const [blockId, label] = line.trim().split(',');
    if (blockId && label) {
      labelMap.set(blockId.trim(), label.trim());
    }
  }

  return labelMap;
}

/**
 * Bước 3: Gom log entries thành các Sequences theo block_id, gán nhãn Normal/Anomaly
 *
 * @param {Array} entries - Output của parseHdfsLogFile
 * @param {Map} labelMap  - Output của loadHdfsLabels
 * @returns {Array<Object>} Mỗi phần tử: { block_id, label, log_lines: [...] }
 */
export function buildHdfsSequences(entries, labelMap) {
  const blockMap = new Map();

  for (const entry of entries) {
    for (const blockId of entry.block_ids) {
      if (!blockMap.has(blockId)) {
        blockMap.set(blockId, []);
      }
      blockMap.get(blockId).push(entry);
    }
  }

  const sequences = [];
  for (const [blockId, lines] of blockMap.entries()) {
    const label = labelMap.get(blockId) ?? 'Unknown';
    sequences.push({
      block_id: blockId,
      label,               // "Normal" | "Anomaly" | "Unknown"
      is_anomaly: label === 'Anomaly',
      log_count: lines.length,
      log_lines: lines
    });
  }

  return sequences;
}

/**
 * Hàm tiện ích: Chạy toàn bộ pipeline HDFS preprocessing
 * @param {string} logFile    - Đường dẫn HDFS.log
 * @param {string} labelFile  - Đường dẫn anomaly_label.csv
 */
export async function loadHdfsDataset(logFile, labelFile) {
  console.log('[HDFS Loader] Đang parse log file...');
  const entries = await parseHdfsLogFile(logFile);
  console.log(`[HDFS Loader] Parse xong ${entries.length} dòng log`);

  console.log('[HDFS Loader] Đang load nhãn...');
  const labelMap = await loadHdfsLabels(labelFile);
  console.log(`[HDFS Loader] Load xong ${labelMap.size} nhãn block_id`);

  console.log('[HDFS Loader] Đang gom sequences...');
  const sequences = buildHdfsSequences(entries, labelMap);

  const anomalyCount = sequences.filter(s => s.is_anomaly).length;
  const normalCount = sequences.filter(s => !s.is_anomaly && s.label !== 'Unknown').length;
  console.log(`[HDFS Loader] Hoàn thành: ${sequences.length} sequences | Anomaly: ${anomalyCount} | Normal: ${normalCount}`);

  return sequences;
}
