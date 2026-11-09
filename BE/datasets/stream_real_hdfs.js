/**
 * Real Log Streamer — Stream HDFS/BGL Dataset to Backend Collector
 * =========================================================================
 * Đẩy dữ liệu log THẬT từ Dataset chuẩn HDFS / BGL tới Collector API (port 4000)
 *
 * Cách dùng:
 *   npm run stream:real-hdfs
 *
 * Yêu cầu file dataset (đặt đúng vị trí):
 *   datasets/hdfs/HDFS_2k.log          ← Log file từ Loghub HDFS dataset
 *   datasets/hdfs/anomaly_label.csv    ← Label file
 *   datasets/bgl/BGL_2k.log            ← Log file từ Loghub BGL dataset
 */

import http from 'http';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLLECTOR_URL = 'http://localhost:4000/api/v1/logs/batch';
const SEND_INTERVAL_MS = 2500;
const BATCH_SIZE = 5;

// ── Đọc file dataset thực tế ──────────────────────────────────────────────────
async function readLogFile(filePath) {
  const lines = [];
  if (!fs.existsSync(filePath)) {
    console.warn(`[Real Streamer] ⚠️  Không tìm thấy file: ${filePath}`);
    return lines;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) lines.push(line.trim());
  }

  console.log(`[Real Streamer] ✅ Đọc xong ${lines.length} dòng từ ${path.basename(filePath)}`);
  return lines;
}

// ── Parse một dòng HDFS log → Standard Schema ──────────────────────────────
function parseHdfsLine(rawLine) {
  // Format: LineId Date Time Pid Level Component Content
  const match = rawLine.match(/(\d+)\s+(\d{6})\s+(\d{6})\s+(\d+)\s+(\w+)\s+(\S+)\s+(.*)/);
  if (!match) return null;
  const [, , date, time, , level, , content] = match;
  return {
    timestamp: new Date().toISOString(),
    service: 'hdfs-cluster',
    level: level === 'ERROR' ? 'ERROR' : level === 'FATAL' ? 'FATAL' : level === 'WARN' ? 'WARN' : 'INFO',
    message: content,
    environment: 'dataset-hdfs',
    source_dataset: 'HDFS_2k'
  };
}

// ── Parse một dòng BGL log → Standard Schema ───────────────────────────────
function parseBglLine(rawLine) {
  // Format: Label Timestamp Date Node Time NodeRepeat Type Component Level Content
  const match = rawLine.match(/^(\S+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/);
  if (!match) return null;
  const [, label, , , node, , , , , rawLevel, content] = match;
  const isAnomaly = label !== '-';
  return {
    timestamp: new Date().toISOString(),
    service: `bgl-${node.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20)}`,
    level: isAnomaly ? 'FATAL' : (rawLevel === 'WARN' ? 'WARN' : 'INFO'),
    message: content,
    environment: 'dataset-bgl',
    source_dataset: 'BGL_2k',
    anomaly_score: isAnomaly ? 0.92 : 0.05,
    rule_triggered: isAnomaly ? label : null
  };
}

// ── Gửi batch tới Collector ────────────────────────────────────────────────
function sendBatch(logs) {
  if (logs.length === 0) return;
  const data = JSON.stringify({ logs });
  const req = http.request(COLLECTOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    res.resume();
    res.on('end', () => {
      console.log(`[Real Streamer] 🚀 Gửi ${logs.length} dòng log thực tế → Collector (HTTP ${res.statusCode})`);
    });
  });

  req.on('error', (err) => {
    console.log(`[Real Streamer] ⏳ Đang chờ Collector... (${err.message})`);
  });

  req.write(data);
  req.end();
}

// ── Main: Khởi động stream ─────────────────────────────────────────────────
async function main() {
  console.log('=============================================================');
  console.log('⚡  PHÁT DỮ LIỆU LOG THẬT TỪ BỘ DỮ LIỆU CHUẨN HDFS / BGL');
  console.log('=============================================================\n');

  const hdfsPath = path.join(__dirname, 'hdfs', 'HDFS_2k.log');
  const bglPath = path.join(__dirname, 'bgl', 'BGL_2k.log');

  const [hdfsRaw, bglRaw] = await Promise.all([
    readLogFile(hdfsPath),
    readLogFile(bglPath)
  ]);

  const hdfsParsed = hdfsRaw.map(parseHdfsLine).filter(Boolean);
  const bglParsed = bglRaw.map(parseBglLine).filter(Boolean);

  // Trộn ngẫu nhiên cả hai dataset
  const allLogs = [...hdfsParsed, ...bglParsed];

  if (allLogs.length === 0) {
    console.error('[Real Streamer] ❌ Không có dữ liệu để stream. Kiểm tra lại file dataset.');
    process.exit(1);
  }

  console.log(`[Real Streamer] 📊 Tổng: ${allLogs.length} entries (HDFS: ${hdfsParsed.length} | BGL: ${bglParsed.length})`);
  console.log(`[Real Streamer] 📡 Stream ${BATCH_SIZE} logs mỗi ${SEND_INTERVAL_MS}ms...\n`);

  let idx = 0;
  setInterval(() => {
    const batch = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const log = { ...allLogs[idx % allLogs.length] };
      log.timestamp = new Date().toISOString(); // Timestamp hiện tại
      batch.push(log);
      idx++;
    }
    sendBatch(batch);
  }, SEND_INTERVAL_MS);
}

main();
