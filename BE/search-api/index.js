import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {
  searchLogs,
  getLogStats,
  getKpiStats,
  getRecentAnomalies,
  getDrainTemplates,
  getAnomalyAnalytics,
  incrementDynamicTotalLogs,
  recordRuntimeAnomaly
} from './opensearchQueries.js';
import { chatWithAI, explainLog } from './aiService.js';
import { alertConfig, dispatchAlerts, sendDiscordAlert, sendEmailAlert, setMaintenanceMode, getMaintenanceMode, saveConfigToSqlite } from './alertService.js';
import db, { ghiNhatKyHeThong, luuTinNhanNoiBo, layDanhSachTinNhanNoiBo, luuLogDuPhong } from '../database/sqlite.js';
import { loginUser, changePassword, authenticateToken, requireAdmin, optionalAuth, JWT_SECRET } from './authService.js';
import { getPipelineHealth, recordPipelineLog } from './pipelineMetrics.js';
import { updateIncidentStatus, addIncidentNote, enrichAnomaliesWithIncidentState } from './incidentService.js';
import { cronConfig, sendDailyDigestReport, runLogRetentionCleanup, initCronJobs, reloadCronJobs } from './cronService.js';
import { redisSub, REALTIME_LOG_CHANNEL } from '../queue/config.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REAL_DATASET_FILE = path.resolve(__dirname, '../datasets/real_logs_dataset.json');

let realLogsPool = [];
function getRealLogsPool() {
  if (realLogsPool.length > 0) return realLogsPool;
  try {
    if (fs.existsSync(REAL_DATASET_FILE)) {
      realLogsPool = JSON.parse(fs.readFileSync(REAL_DATASET_FILE, 'utf-8'));
    }
  } catch (e) {
    realLogsPool = [];
  }
  return realLogsPool;
}

let streamInterval = null;
let currentLogIndex = 0;

function startCloudLogStreamer() {
  const shouldStream =
    process.env.ENABLE_DEMO_STREAMER === 'true' ||
    (process.env.RENDER === 'true' && process.env.ENABLE_DEMO_STREAMER !== 'false');
  if (!shouldStream) return;
  const pool = getRealLogsPool();
  if (streamInterval || pool.length === 0) return;
  console.log('[Realtime Streamer] Bắt đầu phát sóng log HDFS/BGL định kỳ cho client trực tuyến.');
  streamInterval = setInterval(() => {
    if (io.engine.clientsCount === 0) {
      console.log('[Realtime Streamer] Không còn client kết nối, tạm dừng phát sóng để tiết kiệm tài nguyên.');
      clearInterval(streamInterval);
      streamInterval = null;
      return;
    }

    const templateLog = pool[currentLogIndex % pool.length];
    currentLogIndex++;

    const dynamicLog = {
      ...templateLog,
      id: `realtime_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };

    broadcastNewLog(dynamicLog);
  }, 3500);
}

const app = express();
const httpServer = http.createServer(app);

// --- CORS cho FE dev server (port 3000), Vercel & Mobile (ngrok tunnel) ---
const envCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'https://fedatn-xi.vercel.app',
  'https://job-observing-corporal.ngrok-free.dev',
  ...envCorsOrigins
];

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.ngrok-free.dev') ||
      origin.endsWith('.ngrok-free.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin không được phép bởi CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight in-memory rate limiter cho Auth & AI endpoints
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(key);
    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '15', 10),
  message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau ít phút.'
});

const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '30', 10),
  message: 'Đã vượt giới hạn gọi AI Assistant, vui lòng thử lại sau.'
});

// --- Socket.IO setup ---
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Xác thực JWT tùy chọn trên Socket.IO handshake (bắt buộc cho ghi/chat)
io.use((socket, next) => {
  const authHeader = socket.handshake.headers?.authorization;
  const token = socket.handshake.auth?.token || (authHeader && authHeader.split(' ')[1]);
  if (token) {
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch {
      socket.user = null;
    }
  } else {
    socket.user = null;
  }
  next();
});

// Cache in-memory để broadcast log mới qua Socket.IO
const recentLogBuffer = [];
const MAX_BUFFER = 200;

/**
 * Hàm này được gọi bởi Parser Worker (thông qua import) mỗi khi
 * một log mới được ghi vào OpenSearch — broadcast ngay cho tất cả client.
 */
export function broadcastNewLog(logEntry) {
  recentLogBuffer.unshift(logEntry);
  if (recentLogBuffer.length > MAX_BUFFER) recentLogBuffer.pop();
  incrementDynamicTotalLogs(1);
  recordRuntimeAnomaly(logEntry);
  io.emit('new_log', logEntry);

  // Ghi nhận số liệu thông lượng và độ trễ pipeline
  recordPipelineLog(logEntry);

  // Kích hoạt cảnh báo đa kênh (Discord + Email) nếu là FATAL hoặc vượt ngưỡng Anomaly
  dispatchAlerts(logEntry);
}

// Lắng nghe log realtime từ Parser Worker qua Redis Pub/Sub
if (process.env.NODE_ENV !== 'test') {
  redisSub.subscribe(REALTIME_LOG_CHANNEL, (err) => {
    if (err) {
      console.error('[Redis PubSub] Lỗi đăng ký kênh realtime log:', err.message);
    } else {
      console.log(`[Redis PubSub] Đã kết nối kênh '${REALTIME_LOG_CHANNEL}' để nhận log realtime từ Parser Worker`);
    }
  });
}

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

  // Tự động kích hoạt luồng phát log Realtime cho client trực tuyến
  startCloudLogStreamer();

  // Gửi ngay buffer log gần nhất cho client mới kết nối
  if (recentLogBuffer.length > 0) {
    socket.emit('log_buffer', recentLogBuffer.slice(0, 50));
  }

  // Lắng nghe chat nội bộ SRE (Admin <-> Viewer) — yêu cầu JWT hợp lệ qua handshake
  socket.on('sre_chat_send', (data) => {
    try {
      if (!socket.user) {
        socket.emit('sre_chat_error', { error: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại để nhắn tin.' });
        return;
      }
      const content = (data?.content || '').toString().trim();
      const logAttachment = data?.logAttachment || null;
      if (!content && !logAttachment) return;

      const saved = luuTinNhanNoiBo({
        nguoiGui: socket.user.username,
        vaiTro: socket.user.role || 'viewer',
        tenHienThi: socket.user.displayName || socket.user.username,
        noiDung: content || 'Đã đính kèm thẻ log sự cố',
        dinhKemLog: logAttachment
      });
      if (saved) {
        io.emit('sre_chat_message', saved);
      }
    } catch (err) {
      console.error('[SRE Chat Socket Error]:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client ngắt kết nối: ${socket.id}`);
  });
});

const PORT = process.env.PORT || process.env.SEARCH_API_PORT || 5000;

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'search-api' });
});

// ── AUTHENTICATION ROUTES ────────────────────────────────────────────────────
app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password, req.ip);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: req.user });
});

app.post('/api/v1/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, oldPassword, newPassword } = req.body;
    const currentPass = currentPassword || oldPassword;
    const result = await changePassword(req.user.id, currentPass, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
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
app.patch('/api/v1/anomalies/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, priority, root_cause, action_taken } = req.body;
    const updated = updateIncidentStatus(id, status, req.user, note, { priority, root_cause, action_taken });
    return res.status(200).json({ success: true, incident: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Thêm ghi chú xử lý sự cố (Incident Notes — Admin & Viewer đã xác thực)
 * POST /api/v1/anomalies/:id/notes
 */
app.post('/api/v1/anomalies/:id/notes', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = 'NOTE' } = req.body;
    const newNote = addIncidentNote(id, req.user, note, type);
    return res.status(200).json({ success: true, note: newNote });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── MAINTENANCE MODE (SILENCE ALERTS) ENDPOINTS ──────────────────────────────
app.get('/api/v1/alerts/maintenance', (req, res) => {
  return res.status(200).json(getMaintenanceMode());
});

app.post('/api/v1/alerts/maintenance', requireAdmin, (req, res) => {
  const { enabled, minutes, reason } = req.body;
  const createdBy = req.user.displayName || req.user.username;
  const updated = setMaintenanceMode({ enabled, minutes, reason, createdBy });
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
app.get('/api/v1/config', authenticateToken, (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  res.status(200).json({
    ...alertConfig,
    ...cronConfig,
    smtpPass: alertConfig.smtpPass ? '********' : '',
    discordWebhookUrl: isAdmin ? alertConfig.discordWebhookUrl : (alertConfig.discordWebhookUrl ? '********' : ''),
    smtpUser: isAdmin ? alertConfig.smtpUser : (alertConfig.smtpUser ? '********' : '')
  });
});

app.post('/api/v1/config', requireAdmin, (req, res) => {
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
  const nextSmtpPass = smtpPass !== undefined && String(smtpPass).trim() !== '********'
    ? String(smtpPass).trim().replace(/\s+/g, '')
    : undefined;
  if (nextSmtpPass !== undefined) alertConfig.smtpPass = nextSmtpPass;
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

  // Lưu cấu hình vào SQLite và ghi nhật ký kiểm toán
  saveConfigToSqlite({
    anomalyThreshold,
    discordEnabled,
    discordWebhookUrl,
    emailEnabled,
    smtpHost,
    smtpPort,
    smtpUser,
    ...(nextSmtpPass !== undefined ? { smtpPass: nextSmtpPass } : {}),
    receiverEmail,
    alertKeywords
  });

  ghiNhatKyHeThong(
    req.user.displayName || req.user.username,
    'UPDATE_CONFIG',
    'SystemConfig',
    { updatedKeys: Object.keys(req.body) },
    req.ip
  );

  console.log('[Alert Config Updated]:', {
    ...alertConfig,
    ...cronConfig,
    smtpPass: alertConfig.smtpPass ? '********' : '' // Ẩn mật khẩu khi log
  });
  res.status(200).json({
    status: 'OK',
    config: {
      ...alertConfig,
      ...cronConfig,
      smtpPass: alertConfig.smtpPass ? '********' : ''
    }
  });
});

// ── ENTERPRISE AUDIT & CRON HISTORY ENDPOINTS ───────────────────────────────
app.get('/api/v1/audit/logs', requireAdmin, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const logs = db.prepare('SELECT * FROM nhat_ky_he_thong ORDER BY id DESC LIMIT ?').all(limit);
    return res.status(200).json({ total: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/cron/history', requireAdmin, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const history = db.prepare('SELECT * FROM lich_su_cron ORDER BY id DESC LIMIT ?').all(limit);
    return res.status(200).json({ total: history.length, history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── SCHEDULED REPORTS & RETENTION TRIGGER ENDPOINTS ──────────────────────────
/**
 * Nút bấm gửi ngay báo cáo Daily Digest 24h (Manual trigger phục vụ demo)
 */
app.post('/api/v1/reports/digest/trigger', requireAdmin, async (req, res) => {
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
app.post('/api/v1/storage/retention/cleanup', requireAdmin, async (req, res) => {
  const { days } = req.body;
  const targetDays = days ? parseInt(days, 10) : cronConfig.retentionDays;
  const result = await runLogRetentionCleanup(targetDays);
  return res.status(200).json(result);
});

// ── GET /api/v1/export/csv ───────────────────────────────────────────────────
app.get('/api/v1/export/csv', authenticateToken, async (req, res) => {
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
 * AI Chatbot — Hỏi đáp tự do về giám sát hệ thống (Hỗ trợ Multimodal Vision)
 * Body: { messages: [{role, content}], systemContext?: string, image?: { base64, mimeType } }
 */
app.post('/api/v1/ai/chat', aiLimiter, async (req, res) => {
  try {
    let { messages, query, systemContext, image } = req.body;
    if (!messages && query) {
      messages = [{ role: 'user', content: query }];
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung tin nhắn (messages)' });
    }
    const result = await chatWithAI(messages, systemContext || '', image || null);
    return res.status(200).json({ reply: result.text, answer: result.text, provider: result.provider });
  } catch (err) {
    console.error('[AI Chat Error]:', err.message);
    return res.status(500).json({ error: err.message || 'AI Assistant không phản hồi' });
  }
});

// Alias cho các client có thể còn gọi /api/v1/ai/query
app.post('/api/v1/ai/query', aiLimiter, (req, res) => {
  let { messages, query, systemContext, image } = req.body;
  if (!messages && query) {
    messages = [{ role: 'user', content: query }];
  }
  return chatWithAI(messages || [], systemContext || '', image || null)
    .then(result => res.status(200).json({ reply: result.text, answer: result.text, provider: result.provider }))
    .catch(err => res.status(500).json({ error: err.message || 'AI Assistant không phản hồi' }));
});

// ── SRE INTERNAL CHAT (ADMIN <-> VIEWER MESSENGER) ───────────────────────────
/**
 * Lấy lịch sử tin nhắn nội bộ SRE
 */
app.get('/api/v1/chat/messages', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const msgs = layDanhSachTinNhanNoiBo(limit);
    return res.status(200).json(msgs);
  } catch (err) {
    return res.status(500).json({ error: 'Không thể lấy danh sách tin nhắn' });
  }
});

/**
 * Gửi tin nhắn nội bộ SRE (hỗ trợ đính kèm thẻ log sự cố)
 */
app.post('/api/v1/chat/messages', authenticateToken, (req, res) => {
  try {
    const { content, logAttachment } = req.body;
    if (!content && !logAttachment) {
      return res.status(400).json({ error: 'Nội dung tin nhắn hoặc đính kèm không được để trống' });
    }

    const saved = luuTinNhanNoiBo({
      nguoiGui: req.user.username,
      vaiTro: req.user.role || 'viewer',
      tenHienThi: req.user.displayName || req.user.username,
      noiDung: content || '',
      dinhKemLog: logAttachment || null
    });

    if (saved) {
      io.emit('sre_chat_message', saved);
      return res.status(200).json(saved);
    }
    return res.status(500).json({ error: 'Không thể lưu tin nhắn vào cơ sở dữ liệu' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/v1/ai/explain-log ──────────────────────────────────────────────
/**
 * AI phân tích nguyên nhân 1 dòng log cụ thể
 * Body: { log: {message, level, service, anomaly_score, ...} }
 */
app.post('/api/v1/ai/explain-log', aiLimiter, async (req, res) => {
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

    let collectorSuccess = false;
    let collectorData = null;
    try {
      const collectorRes = await fetch('http://localhost:4000/api/v1/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
      if (collectorRes.ok) {
        collectorData = await collectorRes.json();
        collectorSuccess = true;
      }
    } catch (fetchErr) {
      console.warn('[Simulator Info] Collector port 4000 offline, tự động ingestion trực tiếp:', fetchErr.message);
    }

    if (!collectorSuccess) {
      // Direct ingestion fallback: lưu bền vững vào SQLite log_du_phong + phát Socket.IO & tính toán anomaly
      for (const log of logs) {
        const isAnomaly = log.level === 'FATAL' || log.level === 'ERROR' || log.level === 'WARN';
        const enrichedLog = {
          id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...log,
          drain_template: log.message.replace(/\b\d+\b/g, '<*>').replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '<IP>'),
          anomaly_score: log.level === 'FATAL' ? 0.95 : log.level === 'ERROR' ? 0.85 : log.level === 'WARN' ? 0.65 : 0.05,
          is_anomaly: isAnomaly
        };
        luuLogDuPhong(enrichedLog);
        broadcastNewLog(enrichedLog);
      }
      return res.status(200).json({
        success: true,
        count: logs.length,
        mode: 'sqlite_fallback_ingestion',
        message: 'Collector offline — Đã lưu log dự phòng vào SQLite và phát sóng trực tiếp.'
      });
    }

    return res.status(200).json({ success: true, count: logs.length, collector: collectorData });
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

export { app, httpServer, io };

