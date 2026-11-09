/**
 * Cron Service — Scheduled Daily Digest Reports & OpenSearch Log Retention Cleanup
 * Tự động tạo báo cáo ca trực 24h và dọn dẹp log quá hạn lưu trữ.
 */
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { opensearchClient } from '../storage/opensearch.js';
import { alertConfig } from './alertService.js';

dotenv.config();

const INDEX_PATTERN = 'logs-*';

export const cronConfig = {
  dailyDigestEnabled: process.env.DAILY_DIGEST_ENABLED !== 'false',
  dailyDigestCron: process.env.DAILY_DIGEST_CRON || '0 8 * * *',
  retentionDays: parseInt(process.env.RETENTION_DAYS || '30', 10),
  autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED !== 'false',
  autoCleanupCron: process.env.AUTO_CLEANUP_CRON || '0 0 * * *'
};

let digestJob = null;
let cleanupJob = null;

/**
 * Thu thập dữ liệu thống kê tổng hợp trong 24 giờ qua
 */
export async function generate24hDigestData() {
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const body = {
    query: {
      range: {
        timestamp: {
          gte: past24h.toISOString(),
          lte: now.toISOString()
        }
      }
    },
    size: 0,
    aggs: {
      by_level: { terms: { field: 'level.keyword', size: 10 } },
      by_service: { terms: { field: 'service_name.keyword', size: 5 } },
      anomaly_count: {
        filter: {
          range: { anomaly_score: { gte: alertConfig.anomalyThreshold || 0.5 } }
        }
      }
    }
  };

  try {
    const resp = await opensearchClient.search({ index: INDEX_PATTERN, body });
    const hits = resp.body.hits;
    const aggs = resp.body.aggregations || {};

    const totalLogs = hits.total.value || 0;
    const anomalyCount = aggs.anomaly_count?.doc_count || 0;

    const levelBuckets = aggs.by_level?.buckets || [];
    const fatalCount = levelBuckets.find(b => b.key === 'FATAL')?.doc_count || 0;
    const errorCount = levelBuckets.find(b => b.key === 'ERROR')?.doc_count || 0;
    const warnCount = levelBuckets.find(b => b.key === 'WARN')?.doc_count || 0;
    const infoCount = levelBuckets.find(b => b.key === 'INFO')?.doc_count || 0;

    const topServices = (aggs.by_service?.buckets || []).map(b => ({
      service: b.key,
      count: b.doc_count
    }));

    return {
      period: '24h',
      from: past24h.toISOString(),
      to: now.toISOString(),
      totalLogs,
      anomalyCount,
      levels: {
        FATAL: fatalCount,
        ERROR: errorCount,
        WARN: warnCount,
        INFO: infoCount
      },
      topServices,
      generatedAt: now.toISOString()
    };
  } catch (err) {
    console.warn('[Cron Digest] Không thể truy vấn thống kê OpenSearch:', err.message);
    return {
      period: '24h',
      from: past24h.toISOString(),
      to: now.toISOString(),
      totalLogs: 0,
      anomalyCount: 0,
      levels: { FATAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topServices: [],
      generatedAt: now.toISOString()
    };
  }
}

/**
 * Gửi báo cáo Daily Digest qua Discord Webhook
 */
async function sendDiscordDigest(data) {
  if (!alertConfig.discordEnabled || !alertConfig.discordWebhookUrl) return;

  const topSvcStr = data.topServices.length > 0
    ? data.topServices.map(s => `• \`${s.service}\`: ${s.count.toLocaleString()} logs`).join('\n')
    : 'Chưa ghi nhận';

  const embed = {
    title: '[LogPulse Digest] Báo Cáo Tổng Kết Ca Trực 24 Giờ',
    description: `Bản báo cáo tình trạng hệ thống tự động từ ${new Date(data.from).toLocaleString('vi-VN')} đến ${new Date(data.to).toLocaleString('vi-VN')}.`,
    color: 6513905, // Màu Indigo #6366f1
    fields: [
      { name: 'Tổng Log Thu Thập', value: `\`${data.totalLogs.toLocaleString()}\``, inline: true },
      { name: 'Sự Cố Bất Thường', value: `\`${data.anomalyCount.toLocaleString()}\``, inline: true },
      { name: 'Log ERROR / FATAL', value: `\`${(data.levels.ERROR + data.levels.FATAL).toLocaleString()}\``, inline: true },
      { name: 'Top Dịch Vụ Hoạt Động', value: topSvcStr, inline: false },
      {
        name: 'Phân Bố Mức Độ',
        value: `INFO: \`${data.levels.INFO}\` | WARN: \`${data.levels.WARN}\` | ERROR: \`${data.levels.ERROR}\` | FATAL: \`${data.levels.FATAL}\``,
        inline: false
      }
    ],
    footer: { text: 'LogPulse Sentinel • Daily Digest Automated Report' },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(alertConfig.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'LogPulse Digest Reporter',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/9638/9638804.png',
        embeds: [embed]
      })
    });
    console.log('[Cron Digest] Đã gửi báo cáo Daily Digest sang Discord thành công.');
  } catch (err) {
    console.error('[Cron Digest Error] Gửi Discord thất bại:', err.message);
  }
}

/**
 * Gửi báo cáo Daily Digest qua Email (Gmail SMTP)
 */
async function sendEmailDigest(data) {
  if (!alertConfig.emailEnabled || !alertConfig.smtpUser || !alertConfig.smtpPass || !alertConfig.receiverEmail) {
    return;
  }

  const topSvcHtml = data.topServices.length > 0
    ? data.topServices.map(s => `<li style="margin-bottom: 4px;"><strong>${s.service}</strong>: <span style="color: #6366f1; font-weight: 600;">${s.count.toLocaleString()}</span> logs</li>`).join('')
    : '<li>Chưa có dữ liệu</li>';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>LogPulse 24h Digest</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header bar -->
      <div style="background-color: #6366f1; padding: 16px 24px; color: #ffffff;">
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">LogPulse Sentinel</div>
        <h2 style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #ffffff;">
          Báo Cáo Tổng Kết Hoạt Động 24 Giờ
        </h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
          Bản tóm tắt tình trạng giám sát log hệ thống từ <strong>${new Date(data.from).toLocaleString('vi-VN')}</strong> đến <strong>${new Date(data.to).toLocaleString('vi-VN')}</strong>:
        </p>
        
        <!-- KPI Cards Grid -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 16px 0;">
          <tr>
            <td style="width: 33.33%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 12px; color: #64748b; font-weight: 500;">Tổng Log Thu Thập</div>
              <div style="font-size: 20px; font-weight: 700; color: #0284c7; margin-top: 4px;">${data.totalLogs.toLocaleString()}</div>
            </td>
            <td style="width: 33.33%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 12px; color: #64748b; font-weight: 500;">Sự Cố Anomaly</div>
              <div style="font-size: 20px; font-weight: 700; color: #f59e0b; margin-top: 4px;">${data.anomalyCount.toLocaleString()}</div>
            </td>
            <td style="width: 33.33%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 12px; color: #64748b; font-weight: 500;">Log ERROR / FATAL</div>
              <div style="font-size: 20px; font-weight: 700; color: #dc2626; margin-top: 4px;">${(data.levels.ERROR + data.levels.FATAL).toLocaleString()}</div>
            </td>
          </tr>
        </table>

        <!-- Top services section -->
        <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Top dịch vụ phát sinh nhiều log nhất:</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">${topSvcHtml}</ul>
        </div>

        <!-- Level summary -->
        <div style="margin-top: 14px; font-size: 13px; color: #64748b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
          <strong>Phân bổ log:</strong> INFO: ${data.levels.INFO.toLocaleString()} | WARN: ${data.levels.WARN.toLocaleString()} | ERROR: ${data.levels.ERROR.toLocaleString()} | FATAL: ${data.levels.FATAL.toLocaleString()}
        </div>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Báo cáo tự động được tạo và gửi định kỳ hàng ngày bởi hệ thống LogPulse Sentinel.
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
      from: `"LogPulse Reporter" <${alertConfig.smtpUser}>`,
      to: alertConfig.receiverEmail,
      subject: `[LogPulse 24h Digest] ${data.totalLogs.toLocaleString()} logs, ${data.anomalyCount} anomalies`,
      html
    });

    console.log(`[Cron Digest] Đã gửi báo cáo Daily Digest sang Email: ${alertConfig.receiverEmail}`);
  } catch (err) {
    console.error('[Cron Digest Error] Gửi Email thất bại:', err.message);
  }
}

/**
 * Thực hiện gửi báo cáo Daily Digest tổng hợp (gọi cả Discord lẫn Email)
 */
export async function sendDailyDigestReport() {
  console.log('[Cron Digest] Bắt đầu tổng hợp và phát hành báo cáo Daily Digest 24h...');
  const data = await generate24hDigestData();
  await Promise.allSettled([
    sendDiscordDigest(data),
    sendEmailDigest(data)
  ]);
  return data;
}

/**
 * Xóa các log cũ hơn N ngày trong OpenSearch (Log Retention Cleanup)
 * @param {number} days 
 */
export async function runLogRetentionCleanup(days = cronConfig.retentionDays) {
  const retentionDays = parseInt(days, 10) || 30;
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[Retention Policy] Bắt đầu dọn dẹp log cũ hơn ${retentionDays} ngày (Trước thời điểm: ${cutoffDate})...`);

  try {
    const response = await opensearchClient.deleteByQuery({
      index: INDEX_PATTERN,
      body: {
        query: {
          range: {
            timestamp: {
              lt: cutoffDate
            }
          }
        }
      },
      conflicts: 'proceed'
    });

    const deletedCount = response.body?.deleted ?? 0;
    console.log(`[Retention Policy] Dọn dẹp hoàn tất: Đã xóa ${deletedCount} logs cũ.`);

    return {
      success: true,
      deletedCount,
      cutoffDate,
      retentionDays
    };
  } catch (err) {
    console.error('[Retention Policy Error] Lỗi khi dọn dẹp log cũ:', err.message);
    return {
      success: false,
      deletedCount: 0,
      error: err.message,
      cutoffDate,
      retentionDays
    };
  }
}

/**
 * Khởi động các Cron Jobs định kỳ
 */
export function initCronJobs() {
  // 1. Cron gửi Daily Digest (Mặc định 08:00 sáng hàng ngày: "0 8 * * *")
  if (cronConfig.dailyDigestEnabled) {
    digestJob = cron.schedule(cronConfig.dailyDigestCron, () => {
      console.log(`[Cron Trigger] Kích hoạt gửi báo cáo Daily Digest theo lịch (${cronConfig.dailyDigestCron})`);
      sendDailyDigestReport().catch(err => console.error('[Cron Error] Digest error:', err.message));
    });
    console.log(`[Cron Service] Đã lên lịch Daily Digest: '${cronConfig.dailyDigestCron}' (08:00 sáng hàng ngày).`);
  }

  // 2. Cron tự động dọn dẹp log quá hạn Retention (Mặc định 00:00 nửa đêm hàng ngày: "0 0 * * *")
  if (cronConfig.autoCleanupEnabled) {
    cleanupJob = cron.schedule(cronConfig.autoCleanupCron, () => {
      console.log(`[Cron Trigger] Kích hoạt tự động dọn dẹp log cũ theo lịch (${cronConfig.autoCleanupCron})`);
      runLogRetentionCleanup(cronConfig.retentionDays).catch(err => console.error('[Cron Error] Cleanup error:', err.message));
    });
    console.log(`[Cron Service] Đã lên lịch Retention Auto-Cleanup: '${cronConfig.autoCleanupCron}' (Log cũ hơn ${cronConfig.retentionDays} ngày).`);
  }
}

/**
 * Tái nạp lại toàn bộ lịch trình Cron Jobs khi cấu hình thay đổi
 */
export function reloadCronJobs() {
  if (digestJob) {
    try { digestJob.stop(); } catch (e) {}
    digestJob = null;
  }
  if (cleanupJob) {
    try { cleanupJob.stop(); } catch (e) {}
    cleanupJob = null;
  }
  initCronJobs();
  console.log('[Cron Service] Đã tái nạp cấu hình các Cron Jobs thành công.');
}


