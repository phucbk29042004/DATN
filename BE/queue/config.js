import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

function cleanRedisUrl(url) {
  if (!url) return '';
  let clean = url.trim();
  if (clean.includes('-u ')) {
    clean = clean.split('-u ')[1].trim();
  }
  clean = clean.replace(/^['"]|['"]$/g, '');
  if (clean.startsWith('redis://') && clean.includes('upstash.io')) {
    clean = clean.replace('redis://', 'rediss://');
  }
  return clean;
}

export const REDIS_URL = cleanRedisUrl(process.env.REDIS_URL);
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const redisOptions = {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 10) return null; // Dừng retry nếu không kết nối được
    return Math.min(times * 1000, 3000);
  }
};

if (REDIS_URL && REDIS_URL.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

export const redisConnection = REDIS_URL 
  ? new Redis(REDIS_URL, redisOptions) 
  : new Redis({ host: REDIS_HOST, port: REDIS_PORT, ...redisOptions });

export const LOG_QUEUE_NAME = 'raw-logs-queue';
export const REALTIME_LOG_CHANNEL = 'realtime-log-channel';

// Kết nối Redis riêng biệt phục vụ Pub/Sub (tránh xung đột với BullMQ connection)
export const redisPub = REDIS_URL 
  ? new Redis(REDIS_URL, redisOptions) 
  : new Redis({ host: REDIS_HOST, port: REDIS_PORT, ...redisOptions });

export const redisSub = REDIS_URL 
  ? new Redis(REDIS_URL, redisOptions) 
  : new Redis({ host: REDIS_HOST, port: REDIS_PORT, ...redisOptions });

// Ngăn chặn unhandled error event làm crash tiến trình Node.js trên cloud
const handleRedisError = (name) => (err) => {
  console.warn(`[Redis ${name} Warning] Không thể kết nối: ${err.message}`);
};

redisConnection.on('error', handleRedisError('Connection'));
redisPub.on('error', handleRedisError('Pub'));
redisSub.on('error', handleRedisError('Sub'));

export const rawLogsQueue = new Queue(LOG_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
