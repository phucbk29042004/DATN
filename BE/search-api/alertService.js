/**
 * Multi-Channel Alert Service: Discord Webhook & Email (SMTP)
 * Cung cấp giải pháp cảnh báo tức thì đa kênh hoàn toàn miễn phí.
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Cấu hình in-memory (có thể được update qua API config từ Dashboard)
export const alertConfig = {
  anomalyThreshold: 0.5,
  discordEnabled: process.env.DISCORD_ENABLED === 'true' || true,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  emailEnabled: process.env.EMAIL_ALERT_ENABLED === 'true' || false,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USERNAME || process.env.SMTP_USER || '',
  smtpPass: (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  receiverEmail: process.env.ADMIN_EMAIL || process.env.ALERT_RECEIVER_EMAIL || '',
  alertKeywords: ['FATAL', 'Out of Memory', 'Connection refused', 'Database connection failed']
};

// Cooldown tracking để chống spam (tối thiểu 10s cho Discord, 30s cho Email)
let lastDiscordAlertTime = 0;
let lastEmailAlertTime = 0;
const DISCORD_COOLDOWN_MS = 10000;
const EMAIL_COOLDOWN_MS = 30000;

// Chế độ bảo trì (Maintenance Mode / Silence Alerts)
export const maintenanceMode = {
  enabled: false,
  until: null,
  reason: ''
};

export function setMaintenanceMode({ enabled, minutes = 30, reason = '' }) {
  maintenanceMode.enabled = Boolean(enabled);
  if (enabled && minutes > 0) {
    maintenanceMode.until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  } else if (!enabled) {
    maintenanceMode.until = null;
  }
  maintenanceMode.reason = reason || (enabled ? 'Bảo trì hệ thống định kỳ' : '');
  console.log('[Alert Service] Cập nhật chế độ bảo trì:', maintenanceMode);
  return getMaintenanceMode();
}

export function getMaintenanceMode() {
  if (maintenanceMode.enabled && maintenanceMode.until) {
    const expireTime = new Date(maintenanceMode.until).getTime();
    if (Date.now() >= expireTime) {
      maintenanceMode.enabled = false;
      maintenanceMode.until = null;
      maintenanceMode.reason = '';
      console.log('[Alert Service] Chế độ bảo trì đã tự động kết thúc (Hết thời hạn).');
    }
  }
  return { ...maintenanceMode };
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
 * Gửi cảnh báo qua Discord Webhook (dạng Rich Embed)
 */
export async function sendDiscordAlert(logEntry) {
  if (!alertConfig.discordEnabled || !alertConfig.discordWebhookUrl) {
    return;
  }

  const now = Date.now();
  if (now - lastDiscordAlertTime < DISCORD_COOLDOWN_MS) {
    return; // Đang trong thời gian cooldown
  }

  const score = ((logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0) * 100).toFixed(0);
  const isFatal = logEntry.level === 'FATAL';
  const color = isFatal ? 14423100 : 16101643; // Đỏ #dc2626 hoặc Cam #f59e0b

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
    footer: { text: 'LogPulse Monitoring System • AIOps & Anomaly Detection' },
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
    } else {
      console.warn(`[Discord Alert] Webhook trả về status ${res.status}`);
    }
  } catch (err) {
    console.error('[Discord Alert Error]:', err.message);
  }
}

/**
 * Gửi cảnh báo qua Email (SMTP / Gmail)
 */
export async function sendEmailAlert(logEntry) {
  if (!alertConfig.emailEnabled || !alertConfig.smtpUser || !alertConfig.smtpPass || !alertConfig.receiverEmail) {
    return;
  }

  const now = Date.now();
  if (now - lastEmailAlertTime < EMAIL_COOLDOWN_MS) {
    return; // Đang trong thời gian cooldown email
  }

  const score = ((logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0) * 100).toFixed(0);
  const timeStr = new Date(logEntry.timestamp || Date.now()).toLocaleString('vi-VN');

  const levelColor = isFatal ? '#dc2626' : (logEntry.level === 'ERROR' ? '#ea580c' : '#f59e0b');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>LogPulse Alert</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header bar -->
      <div style="background-color: ${levelColor}; padding: 14px 24px; color: #ffffff;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">LogPulse Monitoring</div>
        <h2 style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #ffffff;">
          Thông Báo Sự Cố: ${logEntry.service || logEntry.service_name || 'System'}
        </h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
          Hệ thống phát hiện bản ghi log bất thường vượt ngưỡng thiết lập. Dưới đây là thông tin chi tiết sự cố:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; color: #64748b; width: 35%; font-weight: 500;">Dịch vụ phát sinh:</td>
            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${logEntry.service || logEntry.service_name || 'System'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; color: #64748b; font-weight: 500;">Mức độ nghiêm trọng:</td>
            <td style="padding: 10px 12px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: ${levelColor};">
                ${logEntry.level || 'INFO'}
              </span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; color: #64748b; font-weight: 500;">Điểm bất thường (Score):</td>
            <td style="padding: 10px 12px; font-weight: 600; color: ${levelColor};">${score}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; color: #64748b; font-weight: 500;">Thời gian ghi nhận:</td>
            <td style="padding: 10px 12px; color: #334155;">${timeStr}</td>
          </tr>
        </table>

        <!-- Log snippet -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Nội dung bản ghi log:</div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; line-height: 1.5; color: #0f172a; word-break: break-all; white-space: pre-wrap;">
${(logEntry.message || logEntry.content || '').slice(0, 1000)}
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Email này được gửi tự động từ hệ thống LogPulse Sentinel. Bạn có thể đăng nhập vào bảng điều khiển để xem chi tiết và tiếp nhận xử lý sự cố.
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
 * Điều phối phát cảnh báo song song đa kênh (Fire-and-forget)
 */
export function dispatchAlerts(logEntry) {
  // 1. Kiểm tra chế độ bảo trì (Silence)
  const currentMaint = getMaintenanceMode();
  if (currentMaint.enabled) {
    console.log(`[Alert Dispatcher] 🔇 Đang trong chế độ bảo trì (${currentMaint.reason || 'Silence'}), bỏ qua phát cảnh báo.`);
    return;
  }

  const score = logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0;
  if (logEntry.level === 'FATAL' || score >= alertConfig.anomalyThreshold) {
    // 2. Chống bão tin nhắn (Deduplication)
    const dedup = checkDeduplication(logEntry);
    if (dedup.isDuplicate) {
      console.log(`[Alert Dispatcher] 🔄 Phát hiện cảnh báo trùng lặp (Lần thứ ${dedup.occurrences}), bỏ qua gửi tin nhắn lặp.`);
      return;
    }

    // Chạy bất đồng bộ ngầm
    Promise.allSettled([
      sendDiscordAlert(logEntry),
      sendEmailAlert(logEntry)
    ]).catch(err => console.error('[Dispatch Alerts Warning]:', err.message));
  }
}

