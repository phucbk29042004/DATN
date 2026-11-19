/**
 * Multi-Channel Alert Service: Discord Webhook & Email (SMTP)
 * Tích hợp SQLite Database lưu trữ cấu hình cảnh báo và lịch sử bảo trì.
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import db, { ghiNhatKyHeThong } from '../database/sqlite.js';

dotenv.config();

// Cấu hình in-memory đồng bộ từ SQLite
export const alertConfig = {
  anomalyThreshold: 0.5,
  discordEnabled: true,
  discordWebhookUrl: '',
  emailEnabled: false,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  receiverEmail: '',
  alertKeywords: ['FATAL', 'Out of Memory', 'Connection refused', 'Database connection failed']
};

/**
 * Tải cấu hình từ SQLite Database vào memory
 */
export function loadConfigFromSqlite() {
  try {
    const rows = db.prepare('SELECT khoa, gia_tri FROM cau_hinh_he_thong').all();
    for (const row of rows) {
      if (row.khoa === 'anomalyThreshold') alertConfig.anomalyThreshold = parseFloat(row.gia_tri);
      else if (row.khoa === 'discordEnabled') alertConfig.discordEnabled = row.gia_tri === 'true';
      else if (row.khoa === 'discordWebhookUrl') alertConfig.discordWebhookUrl = row.gia_tri;
      else if (row.khoa === 'emailEnabled') alertConfig.emailEnabled = row.gia_tri === 'true';
      else if (row.khoa === 'smtpHost') alertConfig.smtpHost = row.gia_tri;
      else if (row.khoa === 'smtpPort') alertConfig.smtpPort = parseInt(row.gia_tri, 10);
      else if (row.khoa === 'smtpUser') alertConfig.smtpUser = row.gia_tri;
      else if (row.khoa === 'smtpPass') alertConfig.smtpPass = row.gia_tri;
      else if (row.khoa === 'receiverEmail') alertConfig.receiverEmail = row.gia_tri;
      else if (row.khoa === 'alertKeywords') {
        try {
          alertConfig.alertKeywords = JSON.parse(row.gia_tri);
        } catch {
          alertConfig.alertKeywords = [row.gia_tri];
        }
      }
    }
  } catch (err) {
    console.warn('[Alert Service] Không thể đọc cấu hình từ SQLite:', err.message);
  }
}

/**
 * Lưu cấu hình vào SQLite
 */
export function saveConfigToSqlite(updates = {}) {
  const stmt = db.prepare(`
    INSERT INTO cau_hinh_he_thong (khoa, gia_tri, ngay_cap_nhat)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, ngay_cap_nhat = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined && val !== null) {
        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        stmt.run(key, valStr);
      }
    }
  });

  tx();
  loadConfigFromSqlite();
}

// Khởi chạy nạp cấu hình ban đầu
loadConfigFromSqlite();

// Cooldown tracking để chống spam (tối thiểu 10s cho Discord, 30s cho Email)
let lastDiscordAlertTime = 0;
let lastEmailAlertTime = 0;
const DISCORD_COOLDOWN_MS = 10000;
const EMAIL_COOLDOWN_MS = 30000;

/**
 * Thiết lập chế độ bảo trì hệ thống (Maintenance Mode) lưu vào SQLite
 */
export function setMaintenanceMode({ enabled, minutes = 30, reason = '', createdBy = 'Admin' }) {
  const now = new Date();
  const isEnabled = Boolean(enabled);
  const until = isEnabled && minutes > 0 ? new Date(now.getTime() + minutes * 60 * 1000).toISOString() : null;
  const reasonText = reason || (isEnabled ? 'Bảo trì hệ thống định kỳ' : '');

  // Vô hiệu hóa các phiên bảo trì cũ
  db.prepare('UPDATE lich_bao_tri SET kich_hoat = 0 WHERE kich_hoat = 1').run();

  if (isEnabled) {
    db.prepare(`
      INSERT INTO lich_bao_tri (kich_hoat, ly_do, thoi_gian_bat_dau, thoi_gian_ket_thuc, nguoi_tao)
      VALUES (1, ?, ?, ?, ?)
    `).run(reasonText, now.toISOString(), until, createdBy);
  }

  ghiNhatKyHeThong(createdBy, isEnabled ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE', 'System', {
    reason: reasonText,
    until
  });

  return getMaintenanceMode();
}

/**
 * Lấy trạng thái bảo trì hiện tại từ SQLite
 */
export function getMaintenanceMode() {
  const active = db.prepare(`
    SELECT * FROM lich_bao_tri 
    WHERE kich_hoat = 1 
    ORDER BY id DESC LIMIT 1
  `).get();

  if (!active) {
    return { enabled: false, until: null, reason: '' };
  }

  if (active.thoi_gian_ket_thuc) {
    const expireTime = new Date(active.thoi_gian_ket_thuc).getTime();
    if (Date.now() >= expireTime) {
      db.prepare('UPDATE lich_bao_tri SET kich_hoat = 0 WHERE id = ?').run(active.id);
      return { enabled: false, until: null, reason: '' };
    }
  }

  return {
    enabled: true,
    until: active.thoi_gian_ket_thuc,
    reason: active.ly_do || ''
  };
}

// Deduplication Store: service::message -> { count, lastAlertedAt }
const deduplicationWindowMs = 60000; // 60s
const alertDeduplicationMap = new Map();

function checkDeduplication(logEntry) {
  const now = Date.now();
  const svc = logEntry.service || logEntry.service_name || 'System';
  const msgPrefix = (logEntry.message || logEntry.content || '').slice(0, 60);
  const key = `${svc}::${msgPrefix}`;

  const existing = alertDeduplicationMap.get(key);
  if (existing && (now - existing.lastAlertedAt < deduplicationWindowMs)) {
    existing.count += 1;
    return { isDuplicate: true, occurrences: existing.count };
  }

  alertDeduplicationMap.set(key, { count: 1, lastAlertedAt: now });
  return { isDuplicate: false, occurrences: 1 };
}

/**
 * Gửi cảnh báo qua Discord Webhook
 */
export async function sendDiscordAlert(logEntry) {
  if (!alertConfig.discordEnabled || !alertConfig.discordWebhookUrl) {
    return;
  }

  const now = Date.now();
  if (now - lastDiscordAlertTime < DISCORD_COOLDOWN_MS) {
    return;
  }

  const score = ((logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0) * 100).toFixed(0);
  const isFatal = logEntry.level === 'FATAL';
  const color = isFatal ? 14423100 : 16101643;

  const embed = {
    title: `[LogPulse Alert] Sự cố ${logEntry.level || 'ANOMALY'} tại ${logEntry.service || logEntry.service_name || 'System'}`,
    description: `Hệ thống vừa phát hiện sự kiện bất thường cần chú ý.`,
    color: color,
    fields: [
      { name: 'Dịch vụ', value: `\`${logEntry.service || logEntry.service_name || 'System'}\``, inline: true },
      { name: 'Mức độ', value: `\`${logEntry.level || 'INFO'}\``, inline: true },
      { name: 'Điểm Anomaly', value: `\`${score}%\``, inline: true },
      { name: 'Thời gian', value: new Date(logEntry.timestamp || Date.now()).toLocaleString('vi-VN'), inline: false },
      { name: 'Nội dung Log', value: `\`\`\`${(logEntry.message || logEntry.content || '').slice(0, 500)}\`\`\``, inline: false }
    ],
    footer: { text: 'LogPulse Monitoring System • Enterprise SRE' },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(alertConfig.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'LogPulse Sentinel',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/9638/9638804.png',
        embeds: [embed]
      })
    });

    if (res.ok) {
      lastDiscordAlertTime = now;
      console.log(`[Discord Alert] Đã gửi cảnh báo thành công qua Discord Webhook.`);
    }
  } catch (err) {
    console.error('[Discord Alert Error]:', err.message);
  }
}

/**
 * Gửi cảnh báo qua Email (SMTP)
 */
export async function sendEmailAlert(logEntry) {
  if (!alertConfig.emailEnabled || !alertConfig.smtpUser || !alertConfig.smtpPass || !alertConfig.receiverEmail) {
    return;
  }

  const now = Date.now();
  if (now - lastEmailAlertTime < EMAIL_COOLDOWN_MS) {
    return;
  }

  const isFatal = logEntry.level === 'FATAL';
  const score = ((logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0) * 100).toFixed(0);
  const timeStr = new Date(logEntry.timestamp || Date.now()).toLocaleString('vi-VN');
  const levelColor = isFatal ? '#dc2626' : (logEntry.level === 'ERROR' ? '#ea580c' : '#f59e0b');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>LogPulse Alert</title></head>
  <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="background-color: ${levelColor}; padding: 14px 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">
          Thông Báo Sự Cố: ${logEntry.service || logEntry.service_name || 'System'}
        </h2>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 35%;">Dịch vụ:</td>
            <td style="padding: 8px 0; font-weight: 600;">${logEntry.service || logEntry.service_name || 'System'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Mức độ:</td>
            <td style="padding: 8px 0; font-weight: 600; color: ${levelColor};">${logEntry.level || 'INFO'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Score:</td>
            <td style="padding: 8px 0; font-weight: 600;">${score}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Thời gian:</td>
            <td style="padding: 8px 0;">${timeStr}</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; white-space: pre-wrap;">
${(logEntry.message || logEntry.content || '').slice(0, 1000)}
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: alertConfig.smtpHost,
      port: alertConfig.smtpPort,
      secure: alertConfig.smtpPort === 465,
      auth: {
        user: alertConfig.smtpUser,
        pass: (alertConfig.smtpPass || '').replace(/\s+/g, '')
      }
    });

    await transporter.sendMail({
      from: `"LogPulse Sentinel" <${alertConfig.smtpUser}>`,
      to: alertConfig.receiverEmail,
      subject: `[LogPulse Alert] ${logEntry.level || 'ANOMALY'} tại ${logEntry.service || 'System'} (${score}%)`,
      html: htmlContent
    });

    lastEmailAlertTime = now;
    console.log(`[Email Alert] Đã gửi email cảnh báo tới: ${alertConfig.receiverEmail}`);
  } catch (err) {
    console.error('[Email Alert Error]:', err.message);
  }
}

/**
 * Điều phối phát cảnh báo song song đa kênh
 */
export function dispatchAlerts(logEntry) {
  const currentMaint = getMaintenanceMode();
  if (currentMaint.enabled) {
    return;
  }

  const score = logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0;
  if (logEntry.level === 'FATAL' || score >= alertConfig.anomalyThreshold) {
    const dedup = checkDeduplication(logEntry);
    if (dedup.isDuplicate) {
      return;
    }

    Promise.allSettled([
      sendDiscordAlert(logEntry),
      sendEmailAlert(logEntry)
    ]).catch(err => console.error('[Dispatch Alerts Warning]:', err.message));
  }
}
