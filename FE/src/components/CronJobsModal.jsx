import React, { useState } from 'react';
import { 
  CalendarClock, X, Play, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, Clock, ShieldCheck, Mail, MessageSquare, Database, Sparkles, Send
} from 'lucide-react';

export default function CronJobsModal({
  isOpen,
  onClose,
  configState,
  setConfigState,
  saveConfig,
  handleTriggerDailyDigest,
  handleRunRetentionCleanup,
  isCleaningRetention,
  lang,
  currentUser
}) {
  const [isTriggeringDigest, setIsTriggeringDigest] = useState(false);

  if (!isOpen) return null;

  const isVi = lang === 'vi';
  const isAdmin = currentUser?.role === 'admin';

  const onTriggerDigestClick = async () => {
    setIsTriggeringDigest(true);
    try {
      await handleTriggerDailyDigest();
    } finally {
      setIsTriggeringDigest(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-container" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isVi ? 'Quản Lý Tác Vụ Định Kỳ (Cron Jobs)' : 'Scheduled Tasks & Cron Jobs'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isVi 
                  ? 'Tùy chỉnh bật/tắt, lịch phát báo cáo và dọn dẹp dữ liệu tự động' 
                  : 'Manage scheduled daily digest reports and log retention cleanup'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* JOB 1: Daily Digest Report */}
          <div style={{ 
            background: 'var(--bg-input)', 
            borderRadius: '12px', 
            padding: '1.1rem', 
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <Clock size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {isVi ? 'Báo Cáo Tổng Kết Ca Trực 24h (Daily Digest)' : '24h Daily Digest Report'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <span>{isVi ? 'Lịch chạy: ' : 'Schedule: '}</span>
                    <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', color: '#818cf8', fontWeight: 600 }}>0 8 * * *</code>
                    <span>({isVi ? '08:00 sáng hàng ngày' : '08:00 AM daily'})</span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: isAdmin ? 'pointer' : 'not-allowed', position: 'relative' }}>
                <input
                  type="checkbox"
                  style={{ display: 'none' }}
                  checked={configState.dailyDigestEnabled}
                  onChange={e => setConfigState(p => ({ ...p, dailyDigestEnabled: e.target.checked }))}
                  disabled={!isAdmin}
                />
                <div style={{
                  width: '42px', height: '22px', borderRadius: '11px',
                  background: configState.dailyDigestEnabled ? 'var(--accent-primary)' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px',
                    left: configState.dailyDigestEnabled ? '22px' : '2px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </div>
              </label>
            </div>

            <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isVi 
                ? 'Tổng hợp số lượng log, số sự cố Anomaly, lỗi FATAL/ERROR và Top dịch vụ trong 24 giờ qua để gửi qua Discord Webhook & Email.'
                : 'Aggregates log count, anomaly count, and error distribution for the last 24 hours sent via Discord & Email.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MessageSquare size={13} color="#5865f2" /> Discord: {configState.discordEnabled ? (isVi ? 'Đang bật' : 'Enabled') : (isVi ? 'Tắt' : 'Disabled')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} color="#ea4335" /> Email: {configState.emailEnabled ? (isVi ? 'Đang bật' : 'Enabled') : (isVi ? 'Tắt' : 'Disabled')}
                </span>
              </div>

              <button
                type="button"
                className="toggle-btn"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', gap: '0.4rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                onClick={onTriggerDigestClick}
                disabled={isTriggeringDigest}
              >
                {isTriggeringDigest ? <RefreshCw size={13} className="spin" /> : <Play size={13} color="#6366f1" />}
                {isVi ? 'Chạy Thử Ngay' : 'Trigger Now'}
              </button>
            </div>
          </div>

          {/* JOB 2: Log Retention Auto-Cleanup */}
          <div style={{ 
            background: 'var(--bg-input)', 
            borderRadius: '12px', 
            padding: '1.1rem', 
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                  <Database size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {isVi ? 'Tự Động Dọn Dẹp Log Quá Hạn (Retention Policy)' : 'Log Retention Policy Auto-Cleanup'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <span>{isVi ? 'Lịch chạy: ' : 'Schedule: '}</span>
                    <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', color: '#06b6d4', fontWeight: 600 }}>0 0 * * *</code>
                    <span>({isVi ? '00:00 nửa đêm hàng ngày' : '00:00 Midnight daily'})</span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: isAdmin ? 'pointer' : 'not-allowed', position: 'relative' }}>
                <input
                  type="checkbox"
                  style={{ display: 'none' }}
                  checked={configState.autoCleanupEnabled}
                  onChange={e => setConfigState(p => ({ ...p, autoCleanupEnabled: e.target.checked }))}
                  disabled={!isAdmin}
                />
                <div style={{
                  width: '42px', height: '22px', borderRadius: '11px',
                  background: configState.autoCleanupEnabled ? 'var(--accent-primary)' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px',
                    left: configState.autoCleanupEnabled ? '22px' : '2px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </div>
              </label>
            </div>

            <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isVi 
                ? 'Định kỳ tự động xóa các chỉ mục log cũ hơn số ngày lưu trữ chỉ định trong OpenSearch để tránh tràn dung lượng đĩa.'
                : 'Deletes logs older than retention threshold from OpenSearch to conserve disk storage.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {isVi ? 'Thời hạn lưu trữ:' : 'Retention days:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="form-input"
                  style={{ width: '75px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}
                  value={configState.retentionDays}
                  onChange={e => setConfigState(p => ({ ...p, retentionDays: parseInt(e.target.value, 10) || 30 }))}
                  disabled={!isAdmin}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isVi ? 'ngày' : 'days'}</span>
              </div>

              <button
                type="button"
                className="toggle-btn"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', gap: '0.4rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={handleRunRetentionCleanup}
                disabled={isCleaningRetention}
              >
                {isCleaningRetention ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} color="#ef4444" />}
                {isVi ? 'Dọn Dẹp Ngay' : 'Clean Now'}
              </button>
            </div>
          </div>

          {/* Section 3: Đề xuất mở rộng tương lai */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px dashed rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '0.9rem 1.1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sparkles size={15} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#f59e0b' }}>
                {isVi ? 'Khả Năng Mở Rộng Thêm Cho Hệ Thống Cron Job' : 'Extensible Cron Capabilities'}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li><b>Weekly Executive Digest</b>: {isVi ? 'Báo cáo tổng kết tuần (08:00 sáng thứ Hai) so sánh tỷ lệ sự cố so với tuần trước.' : 'Weekly trend summary every Monday morning.'}</li>
              <li><b>Pipeline Heartbeat Lag Monitor</b>: {isVi ? 'Kiểm tra độ trễ dòng log 10 phút/lần, phát cảnh báo nếu pipeline bị treo.' : 'Checks ingestion lag every 10 minutes.'}</li>
              <li><b>Drain Template Pruner</b>: {isVi ? 'Định kỳ quét và tối ưu bộ nhớ cho các mẫu template log không còn xuất hiện.' : 'Prunes inactive Drain templates periodically.'}</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="toggle-btn" onClick={onClose}>
            {isVi ? 'Đóng' : 'Close'}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                await saveConfig();
                onClose();
              }}
            >
              <Send size={14} /> {isVi ? 'Lưu Cấu Hình Cron' : 'Save Cron Settings'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

