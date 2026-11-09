/**
 * All-In-One Orchestrator for Backend Services
 * ============================================
 * Chạy đồng thời tất cả các microservices Backend:
 *   1. Search API Server (Port 5000)
 *   2. Log Collector Server (HTTP/Syslog Ingestion)
 *   3. Log Parser Worker (BullMQ Processor)
 *   4. Anomaly Engine (3-Tier Engine)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
  { name: 'Search API', script: 'search-api/index.js' },
  { name: 'Collector', script: 'collector/index.js' },
  { name: 'Parser Worker', script: 'parser/index.js' },
  { name: 'Log Generator', script: 'log_generator.js' }
];



const children = [];

services.forEach(service => {
  const child = spawn('node', [service.script], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '' } // Xóa biến PORT chung
  });

  children.push(child);
  console.log(`[+] Started ${service.name} (PID: ${child.pid})`);

  child.on('error', (err) => {
    console.error(`[X] Error starting ${service.name}:`, err);
  });
});

// Xử lý dừng sạch sẽ toàn bộ các tiến trình con khi nhấn Ctrl+C
const cleanup = () => {
  console.log('\n[!] Đang dừng tất cả các dịch vụ con Backend...');
  children.forEach(child => {
    try {
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t']);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // Bỏ qua lỗi nếu tiến trình đã dừng
    }
  });
  setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
