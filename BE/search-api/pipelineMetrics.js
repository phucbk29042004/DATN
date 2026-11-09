/**
 * Pipeline Health & Queue Metrics Service
 * Giám sát trạng thái hàng đợi BullMQ, thông lượng throughput và độ trễ pipeline.
 */
import { rawLogsQueue, redisConnection, REDIS_HOST, REDIS_PORT } from '../queue/config.js';

// Rolling window để tính Throughput (10 giây gần nhất)
const WINDOW_SIZE_SEC = 10;
const secondBuckets = new Map(); // timestamp_sec -> count
let peakThroughput = 0;

// Rolling window để tính Latency (100 log gần nhất)
const latencySamples = [];
const MAX_LATENCY_SAMPLES = 100;

/**
 * Ghi nhận một log vừa đi qua pipeline thành công
 * @param {Object} logEntry 
 */
export function recordPipelineLog(logEntry) {
  const now = Date.now();
  const currentSec = Math.floor(now / 1000);

  // Cập nhật throughput bucket
  const count = (secondBuckets.get(currentSec) || 0) + 1;
  secondBuckets.set(currentSec, count);

  // Xóa các bucket cũ hơn WINDOW_SIZE_SEC
  for (const sec of secondBuckets.keys()) {
    if (sec < currentSec - WINDOW_SIZE_SEC) {
      secondBuckets.delete(sec);
    }
  }

  // Đo latency nếu có trường receivedAt từ Collector
  if (logEntry && logEntry.receivedAt) {
    const recvTime = new Date(logEntry.receivedAt).getTime();
    if (!isNaN(recvTime) && recvTime <= now) {
      const latency = now - recvTime;
      latencySamples.push(latency);
      if (latencySamples.length > MAX_LATENCY_SAMPLES) {
        latencySamples.shift();
      }
    }
  }
}

/**
 * Lấy số liệu thông lượng hiện tại (logs/giây)
 */
function calculateThroughput() {
  const currentSec = Math.floor(Date.now() / 1000);
  let totalLogs = 0;
  let activeSeconds = 0;

  for (let s = currentSec - WINDOW_SIZE_SEC; s < currentSec; s++) {
    if (secondBuckets.has(s)) {
      totalLogs += secondBuckets.get(s);
      activeSeconds++;
    }
  }

  const currentThroughput = activeSeconds > 0 ? parseFloat((totalLogs / activeSeconds).toFixed(1)) : 0;
  if (currentThroughput > peakThroughput) {
    peakThroughput = currentThroughput;
  }

  return {
    current: currentThroughput,
    peak: peakThroughput
  };
}

/**
 * Tính độ trễ trung bình của pipeline (ms)
 */
function calculateAvgLatency() {
  if (latencySamples.length === 0) return 120; // Giá trị baseline danh nghĩa khi chưa có log mới
  const sum = latencySamples.reduce((a, b) => a + b, 0);
  return Math.round(sum / latencySamples.length);
}

/**
 * Truy vấn toàn bộ trạng thái sức khỏe của Pipeline
 */
export async function getPipelineHealth() {
  let queueCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  let redisStatus = 'connected';

  try {
    if (redisConnection.status === 'ready' || redisConnection.status === 'connect') {
      queueCounts = await rawLogsQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    } else {
      redisStatus = redisConnection.status || 'disconnected';
    }
  } catch (err) {
    redisStatus = 'error';
    console.warn('[Pipeline Health] Không thể lấy job counts từ Redis:', err.message);
  }

  const throughput = calculateThroughput();
  const avgLatency = calculateAvgLatency();

  // Đánh giá trạng thái tổng thể
  let overallStatus = 'HEALTHY';
  let message = 'Đường ống xử lý log hoạt động ổn định và thông suốt.';

  if (redisStatus !== 'connected' && redisStatus !== 'ready') {
    overallStatus = 'DEGRADED';
    message = 'Mất kết nối tới Redis Server.';
  } else if (queueCounts.waiting > 100 || queueCounts.failed > 20) {
    overallStatus = 'WARNING';
    message = 'Hàng đợi đang có tải cao hoặc xuất hiện job lỗi.';
  }

  return {
    status: overallStatus,
    message,
    redis: {
      status: redisStatus,
      host: REDIS_HOST,
      port: REDIS_PORT
    },
    queue: {
      ...queueCounts,
      totalProcessed: queueCounts.completed + queueCounts.failed
    },
    throughput: {
      currentLogsPerSec: throughput.current,
      peakLogsPerSec: throughput.peak
    },
    latency: {
      avgLatencyMs: avgLatency
    },
    config: {
      concurrency: 5,
      bulkSize: 10,
      flushIntervalMs: 2000
    },
    updatedAt: new Date().toISOString()
  };
}

