import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { redisConnection, LOG_QUEUE_NAME, redisPub, REALTIME_LOG_CHANNEL } from '../queue/config.js';
import { parseLog } from './normalizer.js';
import { bulkIndexLogs } from '../storage/opensearch.js';
import { checkLogLineSingle } from '../anomaly-engine/rule-based/detector.js';
import { runAnomalyDetection } from '../anomaly-engine/index.js';

dotenv.config();

console.log('[Parser Worker] Đang khởi tạo Worker lắng nghe hàng đợi BullMQ...');

// --- Bulk Buffer: gom log lại trước khi ghi OpenSearch ---
const BULK_SIZE = 10;         // Số log tối đa trước khi flush
const BULK_FLUSH_MS = 2000;   // Thời gian chờ tối đa trước khi flush (2 giây)

let logBuffer = [];
let flushTimer = null;

/**
 * Flush toàn bộ buffer hiện tại vào OpenSearch bằng Bulk API.
 * Sau đó broadcast từng log lên Socket.IO.
 */
async function flushBuffer() {
  if (logBuffer.length === 0) return;

  const batch = logBuffer.splice(0, logBuffer.length); // Lấy hết và reset buffer
  clearTimeout(flushTimer);
  flushTimer = null;

  const { indexed, errors, fallback } = await bulkIndexLogs(batch);
  console.log(`[Parser Worker] Bulk flush: ${indexed} indexed, ${errors} errors, fallback=${fallback}`);

  // Broadcast từng log lên Frontend qua Redis Pub/Sub (Search API Socket.IO lắng nghe)
  for (const log of batch) {
    try {
      redisPub.publish(REALTIME_LOG_CHANNEL, JSON.stringify(log));
    } catch (err) {
      console.warn('[Parser Worker] Lỗi publish realtime log qua Redis:', err.message);
    }
  }

  // Fire-and-forget: chạy đầy đủ 3 tầng Anomaly Detection trên batch (không block pipeline)
  runAnomalyDetection(batch).then(result => {
    if (result.is_anomaly) {
      console.log(`[Anomaly Engine] 🚨 Batch anomaly detected | Rule: ${result.detections.rule_based?.is_anomaly} | Stat: ${result.detections.statistical?.is_anomaly} | ML: ${result.detections.template_mining?.ml_prediction?.is_anomaly}`);
    }
  }).catch(err => {
    console.warn(`[Anomaly Engine] Batch detection error: ${err.message}`);
  });
}

/**
 * Thêm 1 log vào buffer. Flush ngay nếu đủ BULK_SIZE,
 * hoặc đặt timer để flush sau BULK_FLUSH_MS.
 */
function addToBuffer(normalizedLog) {
  logBuffer.push(normalizedLog);

  if (logBuffer.length >= BULK_SIZE) {
    // Buffer đủ lớn → flush ngay lập tức
    flushBuffer();
  } else if (!flushTimer) {
    // Đặt timer flush trễ để không chờ quá lâu khi log thưa
    flushTimer = setTimeout(flushBuffer, BULK_FLUSH_MS);
  }
}

// --- BullMQ Worker ---
export const logParserWorker = new Worker(
  LOG_QUEUE_NAME,
  async (job) => {
    const { receivedAt, payload } = job.data;

    // 1. Chuẩn hóa Log về Standard Schema
    const normalizedLog = parseLog(payload);

    if (!normalizedLog) {
      console.warn(`[Parser Worker] Skip job ${job.id}: Không thể parse payload`, payload);
      return;
    }

    // 2. Per-log Rule-based check (sync, nhanh) — gắn is_anomaly vào document trước khi lưu OpenSearch
    const ruleCheck = checkLogLineSingle(normalizedLog);
    if (ruleCheck.is_anomaly) {
      normalizedLog.is_anomaly = true;
      normalizedLog.rule_triggered = ruleCheck.keyword || null;
      normalizedLog.anomaly_score = Math.max(normalizedLog.anomaly_score || 0, 0.85);
    }

    // 3. Đưa vào buffer — Bulk API sẽ ghi vào OpenSearch khi buffer đầy hoặc timer hết
    try {
      addToBuffer(normalizedLog);
      console.log(`[Parser Worker] Buffered job ${job.id} (Hash: ${normalizedLog.hash_id}) — buffer: ${logBuffer.length}/${BULK_SIZE} | anomaly: ${normalizedLog.is_anomaly || false}`);
    } catch (err) {
      console.error(`[Parser Worker Error] Fail to buffer job ${job.id}:`, err.message);
      // Ném lỗi để BullMQ kích hoạt cơ chế retry với backoff
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Xử lý song song 5 jobs một lúc
  }
);

logParserWorker.on('completed', (job) => {
  // Job thành công
});

logParserWorker.on('failed', (job, err) => {
  console.error(`[Parser Worker] Job ${job.id} thất bại sau các lần thử lại: ${err.message}`);
});

// Đảm bảo flush buffer khi process tắt (graceful shutdown)
process.on('SIGTERM', async () => {
  console.log('[Parser Worker] SIGTERM nhận được — đang flush buffer...');
  await flushBuffer();
  await logParserWorker.close();
  process.exit(0);
});
