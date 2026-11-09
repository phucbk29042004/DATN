/**
 * Log Simulator & Ingestion Service
 * ==================================
 * Script phát sinh dữ liệu log thật liên tục theo thời gian thực (Realtime Stream)
 * Đẩy trực tiếp log tới Collector Ingestion API (http://localhost:4000/api/v1/logs/batch)
 */

import http from 'http';

const COLLECTOR_URL = 'http://localhost:4000/api/v1/logs/batch';

const SERVICES = ['auth-service', 'payment-api', 'order-worker', 'inventory-db', 'search-api', 'gateway'];
const LEVELS = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'FATAL'];

const MESSAGES = {
  INFO: [
    'User session created token_id=tk_9812497',
    'Order #ORD-98421 successfully processed for customer_id=8831',
    'Cache cleared for key user_profile_8831',
    'Payment gateway webhook received HTTP 200 OK'
  ],
  WARN: [
    'High CPU utilization detected on node-worker-03 (88.4%)',
    'Slow query execution detected: SELECT * FROM orders took 1250ms',
    'Disk usage exceeded 80% threshold on /data partition'
  ],
  ERROR: [
    'Failed password verification for user admin from IP 192.168.1.105',
    'Out of memory exception during ElasticSearch query execution window',
    'HTTP 500 Internal Server Error returned by downstream service'
  ],
  FATAL: [
    'Database connection failed: Timeout connecting to PostgreSQL master at 10.0.4.12:5432',
    'Fatal System Crash: Segmentation fault in core process memory pool'
  ]
};

function generateRandomBatch(size = 5) {
  const logs = [];
  const now = new Date().toISOString();

  for (let i = 0; i < size; i++) {
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const msgList = MESSAGES[level];
    const message = msgList[Math.floor(Math.random() * msgList.length)];

    logs.push({
      timestamp: now,
      service,
      level,
      message,
      environment: 'production'
    });
  }
  return logs;
}

function sendLogsToCollector() {
  const batch = generateRandomBatch(5);
  const data = JSON.stringify({ logs: batch });

  const req = http.request('http://localhost:4000/api/v1/logs/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`[Log Generator] 🚀 Đã phát sinh & gửi ${batch.length} logs thật tới Collector (HTTP ${res.statusCode})`);
    });
  });

  req.on('error', (err) => {
    console.log(`[Log Generator] ⏳ Đang chờ Collector Service trên cổng 4000... (${err.message})`);
  });

  req.write(data);
  req.end();
}

console.log('=======================================================');
console.log('⚡ BẮT ĐẦU PHÁT SINH DỮ LIỆU LOG THẬT TIME-SERIES (REALTIME STREAM)');
console.log('=======================================================\n');

// Gửi ngẫu nhiên 5-10 log mỗi 2 giây
setInterval(sendLogsToCollector, 2000);
