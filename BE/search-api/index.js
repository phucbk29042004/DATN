import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  searchLogs,
  getLogStats,
  getKpiStats,
  getRecentAnomalies,
  getDrainTemplates,
  getAnomalyAnalytics
} from './opensearchQueries.js';
import { chatWithAI, explainLog } from './aiService.js';
import { alertConfig, dispatchAlerts, sendDiscordAlert, sendEmailAlert, setMaintenanceMode, getMaintenanceMode } from './alertService.js';
import { loginUser, authenticateToken, requireAdmin, optionalAuth } from './authService.js';
import { getPipelineHealth, recordPipelineLog } from './pipelineMetrics.js';
import { updateIncidentStatus, addIncidentNote, enrichAnomaliesWithIncidentState } from './incidentService.js';
import { cronConfig, sendDailyDigestReport, runLogRetentionCleanup, initCronJobs, reloadCronJobs } from './cronService.js';
import { redisSub, REALTIME_LOG_CHANNEL } from '../queue/config.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// --- CORS cho FE dev server (port 3000) ---
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Socket.IO setup ---
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Cache in-memory để broadcast log mới qua Socket.IO
const recentLogBuffer = [];
const MAX_BUFFER = 200;

// --- Multi-Channel Alert Dispatcher (Discord & Email) ---
// Backward compatibility cho các module khác có thể còn import sendTelegramAlert
export async function sendTelegramAlert(logEntry) {
  return dispatchAlerts(logEntry);
}

/**
 * Hàm này được gọi bởi Parser Worker (thông qua import) mỗi khi
 * một log mới được ghi vào OpenSearch — broadcast ngay cho tất cả client.
 */
export function broadcastNewLog(logEntry) {
  recentLogBuffer.unshift(logEntry);
  if (recentLogBuffer.length > MAX_BUFFER) recentLogBuffer.pop();
  io.emit('new_log', logEntry);

  // Ghi nhận số liệu thông lượng và độ trễ pipeline
  recordPipelineLog(logEntry);

  // Kích hoạt cảnh báo đa kênh (Discord + Email) nếu là FATAL hoặc vượt ngưỡng Anomaly
  dispatchAlerts(logEntry);
}

// Lắng nghe log realtime từ Parser Worker qua Redis Pub/Sub
redisSub.subscribe(REALTIME_LOG_CHANNEL, (err) => {
  if (err) {
    console.error('[Redis PubSub] Lỗi đăng ký kênh realtime log:', err.message);
  } else {
    console.log(`[Redis PubSub] Đã kết nối kênh '${REALTIME_LOG_CHANNEL}' để nhận log realtime từ Parser Worker`);
  }
});

redisSub.on('message', (channel, message) => {
  if (channel === REALTIME_LOG_CHANNEL) {
    try {
      const log = JSON.parse(message);
      broadcastNewLog(log);
    } catch (err) {
      console.warn('[Redis PubSub] Lỗi parse JSON từ log realtime:', err.message);
    }
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client kết nối: ${socket.id}`);

  // Gửi ngay buffer log gần nhất cho client mới kết nối
  if (recentLogBuffer.length > 0) {
    socket.emit('log_buffer', recentLogBuffer.slice(0, 50));
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client ngắt kết nối: ${socket.id}`);
  });
});

const PORT = process.env.SEARCH_API_PORT || 5000;

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'search-api' });
});

// ── AUTHENTICATION ROUTES ────────────────────────────────────────────────────
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// ── PIPELINE HEALTH & BULLMQ QUEUE METRICS ────────────────────────────────────
app.get('/api/v1/pipeline/health', async (req, res) => {
  try {
    const health = await getPipelineHealth();
    return res.status(200).json(health);
  } catch (err) {
    console.error('[Pipeline Health Error]:', err.message);
    return res.status(500).json({ error: 'Không thể lấy thông tin sức khỏe pipeline' });
  }
});

// ── GET /api/v1/logs/search ───────────────────────────────────────────────────
/**
 * Query params: q, level, service, from, to, page, size
 */
app.get('/api/v1/logs/search', async (req, res) => {
  try {
    const { q, level, service, from, to, page = 1, size = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(size, 10)));

    const results = await searchLogs({
      query: q,
      level: level ? level.toUpperCase() : undefined,
      service,
      from: from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      to: to || new Date().toISOString(),
      page: pageNum,
      size: pageSize
    });

    return res.status(200).json(results);
  } catch (error) {
    console.warn('[Search API Warning]:', error.message);
    return res.status(200).json({ total: 0, page: 1, size: 50, total_pages: 0, logs: [] });
  }
});

// ── GET /api/v1/logs/stats ────────────────────────────────────────────────────
app.get('/api/v1/logs/stats', async (req, res) => {
  try {
    const {
      from = new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString()
    } = req.query;

    const stats = await getLogStats({ from, to });
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[Stats API Error]:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy thống kê' });
  }
});

// ── GET /api/v1/stats/kpi ─────────────────────────────────────────────────────
/**
 * Trả về 4 KPI metrics cho Dashboard Overview:
 *   total_logs_24h, anomaly_count_1h, template_count, fatal_count_1h
 */
app.get('/api/v1/stats/kpi', async (req, res) => {
  try {
    const kpi = await getKpiStats();
    return res.status(200).json(kpi);
  } catch (error) {
    console.error('[KPI API Error]:', error.message);
    return res.status(500).json({ error: 'Lỗi khi lấy KPI stats' });
  }
});

// ── GET /api/v1/anomalies ─────────────────────────────────────────────────────
/**
 * Query params: from, to, threshold (mặc định 0.5), size (mặc định 50)
 */
app.get('/api/v1/anomalies', async (req, res) => {
  try {
    const {
      from = new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString(),
      threshold = 0.5,
      size = 50
    } = req.query;

    const result = await getRecentAnomalies({
      from,
      to,
      threshold: parseFloat(threshold),
      size: parseInt(size, 10)
    });

    // Bổ sung thông tin vòng đời sự cố (NEW / ACKNOWLEDGED / RESOLVED, notes)
    const enriched = enrichAnomaliesWithIncidentState(result.anomalies);

    return res.status(200).json({
      total: result.total,
      anomalies: enriched
    });
  } catch (error) {
    console.error('[Anomalies API Error]:', error.message);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách anomaly' });
  }
});

// ── INCIDENT LIFECYCLE MANAGEMENT ENDPOINTS ──────────────────────────────────
/**
 * Cập nhật trạng thái sự cố (NEW -> ACKNOWLEDGED -> RESOLVED)
 * PATCH /api/v1/anomalies/:id/status
 */
app.patch('/api/v1/anomalies/:id/status', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const user = req.user || { username: 'admin', displayName: 'Quản Trị Viên' };
    const updated = updateIncidentStatus(id, status, user, note);
    return res.status(200).json({ success: true, incident: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Thêm ghi chú xử lý sự cố (Incident Notes)
 * POST /api/v1/anomalies/:id/notes
 */
app.post('/api/v1/anomalies/:id/notes', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const user = req.user || { username: 'operator', displayName: 'Giám Sát Viên' };
    const newNote = addIncidentNote(id, user, note);
    return res.status(200).json({ success: true, note: newNote });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── MAINTENANCE MODE (SILENCE ALERTS) ENDPOINTS ──────────────────────────────
app.get('/api/v1/alerts/maintenance', (req, res) => {
  return res.status(200).json(getMaintenanceMode());
});

app.post('/api/v1/alerts/maintenance', optionalAuth, (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ tài khoản Admin mới có quyền bật/tắt chế độ bảo trì.' });
  }
  const { enabled, minutes, reason } = req.body;
  const updated = setMaintenanceMode({ enabled, minutes, reason });
  return res.status(200).json({ success: true, maintenance: updated });
});

// ── GET /api/v1/templates ─────────────────────────────────────────────────────
/**
 * Lấy danh sách Drain templates đã khai phá từ OpenSearch
 * Query params: size (mặc định 100)
 */
app.get('/api/v1/templates', async (req, res) => {
  try {
    const { size = 100 } = req.query;
    const result = await getDrainTemplates({ size: parseInt(size, 10) });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Templates API Error]:', error.message);
    return res.status(500).json({ error: 'Lỗi khi lấy Drain templates' });
  }
});

// ── GET /api/v1/config & POST /api/v1/config ──────────────────────────────────
app.get('/api/v1/config', (req, res) => {
  res.status(200).json({
    ...alertConfig,
    ...cronConfig
  });
});

app.post('/api/v1/config', optionalAuth, (req, res) => {
  // Kiểm tra phân quyền: Nếu là Viewer thì không được phép sửa cấu hình
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Tài khoản Viewer chỉ có quyền xem, không được phép chỉnh sửa cấu hình hệ thống.' });
  }

  const {
    anomalyThreshold,
    discordEnabled,
    discordWebhookUrl,
    emailEnabled,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    receiverEmail,
    alertKeywords,
    dailyDigestEnabled,
    retentionDays,
    autoCleanupEnabled
  } = req.body;

  if (anomalyThreshold !== undefined) alertConfig.anomalyThreshold = parseFloat(anomalyThreshold);
  if (discordEnabled !== undefined) alertConfig.discordEnabled = Boolean(discordEnabled);
  if (discordWebhookUrl !== undefined) alertConfig.discordWebhookUrl = String(discordWebhookUrl).trim();
  if (emailEnabled !== undefined) alertConfig.emailEnabled = Boolean(emailEnabled);
  if (smtpHost !== undefined) alertConfig.smtpHost = String(smtpHost).trim();
  if (smtpPort !== undefined) alertConfig.smtpPort = parseInt(smtpPort, 10);
  if (smtpUser !== undefined) alertConfig.smtpUser = String(smtpUser).trim();
  if (smtpPass !== undefined) alertConfig.smtpPass = String(smtpPass).trim().replace(/\s+/g, '');
  if (receiverEmail !== undefined) alertConfig.receiverEmail = String(receiverEmail).trim();
  if (Array.isArray(alertKeywords)) alertConfig.alertKeywords = alertKeywords;
  
  if (dailyDigestEnabled !== undefined) cronConfig.dailyDigestEnabled = Boolean(dailyDigestEnabled);
  if (retentionDays !== undefined) cronConfig.retentionDays = parseInt(retentionDays, 10) || 30;
  if (autoCleanupEnabled !== undefined) cronConfig.autoCleanupEnabled = Boolean(autoCleanupEnabled);

  // Tái nạp lại lịch trình các tác vụ Cron Jobs theo cấu hình mới
  try {
    reloadCronJobs();
  } catch (err) {
    console.warn('[Cron Reload Warning]:', err.message);
  }

  console.log('[Alert Config Updated]:', {
    ...alertConfig,
    ...cronConfig,
    smtpPass: alertConfig.smtpPass ? '********' : '' // Ẩn mật khẩu khi log
  });
  res.status(200).json({ status: 'OK', config: { ...alertConfig, ...cronConfig } });
});

// ── SCHEDULED REPORTS & RETENTION TRIGGER ENDPOINTS ──────────────────────────
/**
 * Nút bấm gửi ngay báo cáo Daily Digest 24h (Manual trigger phục vụ demo)
 */
app.post('/api/v1/reports/digest/trigger', async (req, res) => {
  try {
    const data = await sendDailyDigestReport();
    return res.status(200).json({
      success: true,
      message: 'Đã tổng hợp và gửi báo cáo Daily Digest thành công qua Discord và Email.',
      data
    });
  } catch (err) {
    console.error('[Trigger Digest Error]:', err.message);
    return res.status(500).json({ error: err.message || 'Không thể gửi báo cáo định kỳ' });
  }
});

/**
 * Nút bấm dọn dẹp log cũ ngay lập tức (Retention Cleanup)
 */
app.post('/api/v1/storage/retention/cleanup', optionalAuth, async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ tài khoản Admin mới có quyền dọn dẹp log lưu trữ.' });
  }
  const { days } = req.body;
  const targetDays = days ? parseInt(days, 10) : cronConfig.retentionDays;
  const result = await runLogRetentionCleanup(targetDays);
  return res.status(200).json(result);
});

// ── GET /api/v1/export/csv ───────────────────────────────────────────────────
app.get('/api/v1/export/csv', async (req, res) => {
  try {
    const { from, to, type = 'anomalies' } = req.query;
    const timeFrom = from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const timeTo = to || new Date().toISOString();

    let logs = [];
    if (type === 'anomalies') {
      const data = await getRecentAnomalies({ from: timeFrom, to: timeTo, threshold: alertConfig.anomalyThreshold, size: 200 });
      logs = data.anomalies || [];
    } else {
      const data = await searchLogs({ from: timeFrom, to: timeTo, page: 1, size: 200 });
      logs = data.logs || [];
    }

    // Biến đổi thành định dạng CSV
    const headers = ['Timestamp', 'Service', 'Level', 'Anomaly_Score', 'Message'];
    const rows = logs.map(l => [
      `"${new Date(l.timestamp || Date.now()).toLocaleString('vi-VN')}"`,
      `"${(l.service || l.service_name || '').replace(/"/g, '""')}"`,
      `"${(l.level || '').replace(/"/g, '""')}"`,
      `"${((l.anomaly_score ?? 0) * 100).toFixed(0)}%"`,
      `"${(l.message || l.content || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=logpulse_${type}_report.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Export CSV Error]:', err.message);
    return res.status(500).json({ error: 'Không thể xuất báo cáo CSV' });
  }
});

// ── POST /api/v1/ai/chat ─────────────────────────────────────────────────────
/**
 * AI Chatbot — Hỏi đáp tự do về giám sát hệ thống
 * Body: { messages: [{role, content}], systemContext?: string }
 */
app.post('/api/v1/ai/chat', async (req, res) => {
  try {
    const { messages, systemContext } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung tin nhắn (messages)' });
    }
    const result = await chatWithAI(messages, systemContext || '');
    return res.status(200).json({ reply: result.text, provider: result.provider });
  } catch (err) {
    console.error('[AI Chat Error]:', err.message);
    return res.status(500).json({ error: err.message || 'AI Assistant không phản hồi' });
  }
});

// ── POST /api/v1/ai/explain-log ──────────────────────────────────────────────
/**
 * AI phân tích nguyên nhân 1 dòng log cụ thể
 * Body: { log: {message, level, service, anomaly_score, ...} }
 */
app.post('/api/v1/ai/explain-log', async (req, res) => {
  try {
    const { log } = req.body;
    if (!log || !log.message) {
      return res.status(400).json({ error: 'Thiếu thông tin log cần phân tích' });
    }
    const result = await explainLog(log);
    return res.status(200).json({ explanation: result.text, provider: result.provider });
  } catch (err) {
    console.error('[AI Explain Error]:', err.message);
    return res.status(500).json({ error: err.message || 'AI không thể phân tích log' });
  }
});

// ── GET /api/v1/anomalies/analytics ───────────────────────────────────────────
/**
 * Dữ liệu phân tích bất thường đa chiều cho Dashboard Analytics
 * Query params: from, to, service, level
 */
app.get('/api/v1/anomalies/analytics', async (req, res) => {
  try {
    const {
      from = new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString(),
      service,
      level
    } = req.query;

    const analytics = await getAnomalyAnalytics({ from, to, service, level });
    return res.status(200).json(analytics);
  } catch (error) {
    console.error('[Anomaly Analytics Error]:', error.message);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu phân tích bất thường' });
  }
});

// ── POST /api/v1/simulator/generate ──────────────────────────────────────────
/**
 * Tự động phát sinh batch log mẫu đẩy tới Collector Ingestion API (port 4000)
 * Giúp người dùng kiểm thử trực tiếp trên Web mà không cần mở terminal
 */
app.post('/api/v1/simulator/generate', async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.body.count || 25, 10), 5), 100);
    const services = ['auth-service', 'payment-api', 'order-worker', 'inventory-db', 'search-api', 'gateway'];
    const levels = ['INFO', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const messages = {
      INFO: [
        'User session created token_id=tk_' + Math.floor(Math.random() * 900000 + 100000),
        'Order #ORD-' + Math.floor(Math.random() * 90000 + 10000) + ' successfully processed for customer_id=' + Math.floor(Math.random() * 9000 + 1000),
        'Cache cleared for key user_profile_' + Math.floor(Math.random() * 9000 + 1000),
        'Payment gateway webhook received HTTP 200 OK',
        'Health check probe passed on port 8080 latency=12ms'
      ],
      WARN: [
        'High CPU utilization detected on node-worker-0' + Math.floor(Math.random() * 5 + 1) + ' (88.4%)',
        'Slow query execution detected: SELECT * FROM orders took ' + Math.floor(Math.random() * 2000 + 500) + 'ms',
        'Disk usage exceeded 82% threshold on /data partition',
        'Connection pool reaching 85% capacity threshold'
      ],
      ERROR: [
        'Failed password verification for user admin from IP 192.168.1.' + Math.floor(Math.random() * 250 + 2),
        'Out of memory exception during ElasticSearch query execution window',
        'HTTP 500 Internal Server Error returned by downstream service',
        'Redis connection timeout on key lock:order_9981'
      ],
      FATAL: [
        'Database connection failed: Timeout connecting to PostgreSQL master at 10.0.4.12:5432',
        'Fatal System Crash: Segmentation fault in core process memory pool'
      ]
    };

    const logs = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const msgList = messages[level];
      const message = msgList[Math.floor(Math.random() * msgList.length)];
      const logTime = new Date(now.getTime() - Math.floor(Math.random() * 30000)).toISOString();
      logs.push({ timestamp: logTime, service, level, message, environment: 'production' });
    }

    const collectorRes = await fetch('http://localhost:4000/api/v1/logs/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs })
    });

    if (!collectorRes.ok) {
      throw new Error(`Collector trả về lỗi HTTP ${collectorRes.status}`);
    }

    const data = await collectorRes.json();
    return res.status(200).json({ success: true, count: logs.length, collector: data });
  } catch (err) {
    console.error('[Simulator Error]:', err.message);
    return res.status(500).json({ error: err.message || 'Không thể phát sinh log mẫu' });
  }
});

// ── Start server (Chỉ listen khi chạy trực tiếp file này) ─────────────────────
const currentFile = fileURLToPath(import.meta.url);
const isMainModule = !process.argv[1] || path.resolve(process.argv[1]).toLowerCase() === path.resolve(currentFile).toLowerCase();

if (isMainModule) {
  httpServer.listen(PORT, () => {
    console.log(`[Search API Service] HTTP + Socket.IO đang chạy tại http://localhost:${PORT}`);
    // Khởi động các Cron Jobs (Daily Digest & Retention Auto-Cleanup)
    initCronJobs();
  });
}

export { io };

