import React from 'react';
import {
  Settings, X, Bell, Send, BellOff, ShieldAlert,
  Calendar, Database, Plus, Trash2, RefreshCw, Eye, Download, FileSpreadsheet
} from 'lucide-react';
import { translations } from '../i18n.js';

export default function AdminSettingsModal({
  isOpen,
  onClose,
  lang = 'vi',
  configState,
  setConfigState,
  saveConfig,
  maintenanceState,
  handleToggleMaintenance,
  newKeywordInput,
  setNewKeywordInput,
  handleTriggerDailyDigest,
  isTriggeringDigest,
  handleRunRetentionCleanup,
  isCleaningRetention,
  currentUser,
  formatVnDateTime,
  handleExportCsv
}) {
  if (!isOpen) return null;

  const t = translations[lang] || translations.vi;

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="modal-container"
        style={{ maxWidth: '780px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <Settings size={22} color="var(--accent-primary)" />
            Cấu Hình Hệ Thống & Quản Trị Cảnh Báo
          </span>
          <button className="toast-close" onClick={onClose} aria-label="Đóng" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentUser?.role === 'viewer' && (
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#38bdf8', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={16} />
              <span>{t.viewerNotice || 'Bạn đang ở chế độ Viewer (Chỉ xem). Các nút thay đổi cấu hình đã bị vô hiệu hóa.'}</span>
            </div>
          )}

          {/* Ngưỡng kích hoạt chung */}
          <div className="form-group" style={{ background: 'var(--bg-input)', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              {t.configThresholdLabel || 'Ngưỡng Anomaly Score Kích Hoạt Cảnh Báo (0.1 - 1.0)'}
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              className="form-input"
              style={{ width: '100%', maxWidth: '240px' }}
              value={configState.anomalyThreshold}
              onChange={e => setConfigState(p => ({ ...p, anomalyThreshold: parseFloat(e.target.value) || 0.5 }))}
              disabled={currentUser?.role === 'viewer'}
            />
          </div>

          {/* ── Kênh 1: Discord Webhook ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Bell size={18} color="#5865F2" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.configDiscordSection || 'Kênh Cảnh Báo Discord Webhook'}
              </span>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                id="modal-discord-check"
                type="checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={configState.discordEnabled}
                onChange={e => setConfigState(p => ({ ...p, discordEnabled: e.target.checked }))}
                disabled={currentUser?.role === 'viewer'}
              />
              <label htmlFor="modal-discord-check" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>
                {t.configDiscordEnable || 'Bật cảnh báo qua Discord Webhook'}
              </label>
            </div>

            {configState.discordEnabled && (
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>{t.configDiscordUrlLabel || 'Discord Webhook URL'}</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="https://discord.com/api/webhooks/..."
                  value={configState.discordWebhookUrl}
                  onChange={e => setConfigState(p => ({ ...p, discordWebhookUrl: e.target.value }))}
                  disabled={currentUser?.role === 'viewer'}
                />
              </div>
            )}
          </div>

          {/* ── Kênh 2: Email SMTP ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Send size={18} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.configEmailSection || 'Kênh Cảnh Báo Email SMTP (Gmail)'}
              </span>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                id="modal-email-check"
                type="checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={configState.emailEnabled}
                onChange={e => setConfigState(p => ({ ...p, emailEnabled: e.target.checked }))}
                disabled={currentUser?.role === 'viewer'}
              />
              <label htmlFor="modal-email-check" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>
                {t.configEmailEnable || 'Bật cảnh báo qua Email (SMTP)'}
              </label>
            </div>

            {configState.emailEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>{t.configReceiverEmailLabel || 'Email nhận thông báo'}</label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="admin@example.com"
                    value={configState.receiverEmail}
                    onChange={e => setConfigState(p => ({ ...p, receiverEmail: e.target.value }))}
                    disabled={currentUser?.role === 'viewer'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>{t.configSmtpUserLabel || 'Tài khoản Gmail gửi'}</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="alert-bot@gmail.com"
                      value={configState.smtpUser}
                      onChange={e => setConfigState(p => ({ ...p, smtpUser: e.target.value }))}
                      disabled={currentUser?.role === 'viewer'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>{t.configSmtpPassLabel || 'Mật khẩu ứng dụng Gmail'}</label>
                    <input
                      type="password"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="16 ký tự App Password"
                      value={configState.smtpPass}
                      onChange={e => setConfigState(p => ({ ...p, smtpPass: e.target.value }))}
                      disabled={currentUser?.role === 'viewer'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Kênh 3: Chế độ bảo trì (Silence Alerts) ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <BellOff size={18} color="#fbbf24" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.maintenanceTitle || 'Chế Độ Bảo Trì (Silence Alerts)'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Khi kích hoạt, hệ thống tạm dừng gửi tin nhắn Discord và Email trong thời gian bảo trì (vẫn nạp log vào OpenSearch bình thường).
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {maintenanceState?.enabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>
                    Đang bảo trì đến: {formatVnDateTime ? formatVnDateTime(maintenanceState.until) : String(maintenanceState.until)}
                  </span>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      className="toggle-btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                      onClick={() => handleToggleMaintenance(false)}
                    >
                      Tắt bảo trì ngay
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      className="toggle-btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleToggleMaintenance(true, mins)}
                      disabled={currentUser?.role === 'viewer'}
                    >
                      Bật bảo trì {mins} phút
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Kênh 4: Quản lý từ khóa cảnh báo động (Alert Keywords) ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ShieldAlert size={18} color="#f87171" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.alertKeywordsTitle || 'Từ Khóa Cảnh Báo Tức Thì (Alert Keywords)'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {(configState.alertKeywords || []).map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {kw}
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = (configState.alertKeywords || []).filter((_, i) => i !== idx);
                        setConfigState(p => ({ ...p, alertKeywords: next }));
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Xóa từ khóa này"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {currentUser?.role === 'admin' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                  placeholder="Thêm từ khóa mới (VD: OutOfMemory, Deadlock)..."
                  value={newKeywordInput}
                  onChange={e => setNewKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newKeywordInput.trim()) {
                        setConfigState(p => ({
                          ...p,
                          alertKeywords: [...(p.alertKeywords || []), newKeywordInput.trim()]
                        }));
                        setNewKeywordInput('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  onClick={() => {
                    if (newKeywordInput.trim()) {
                      setConfigState(p => ({
                        ...p,
                        alertKeywords: [...(p.alertKeywords || []), newKeywordInput.trim()]
                      }));
                      setNewKeywordInput('');
                    }
                  }}
                >
                  <Plus size={14} /> Thêm
                </button>
              </div>
            )}
          </div>

          {/* ── Kênh 5: Báo Cáo Tự Động Định Kỳ (Daily Digest) ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Calendar size={18} color="#818cf8" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.digestTitle || 'Báo Cáo Định Kỳ 24h (Daily Digest)'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {t.digestDesc || 'Tự động chạy lúc 08:00 sáng mỗi ngày, tổng hợp số liệu 24h qua và gửi qua Discord & Email.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
                <input
                  id="modal-digest-check"
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={configState.dailyDigestEnabled}
                  onChange={e => setConfigState(p => ({ ...p, dailyDigestEnabled: e.target.checked }))}
                  disabled={currentUser?.role === 'viewer'}
                />
                <label htmlFor="modal-digest-check" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>
                  {t.digestEnable || 'Kích hoạt Daily Digest tự động'}
                </label>
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  className="toggle-btn"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderColor: '#818cf8', color: '#818cf8' }}
                  onClick={handleTriggerDailyDigest}
                  disabled={isTriggeringDigest}
                >
                  {isTriggeringDigest ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                  {t.btnTriggerDigest || 'Gửi Báo Cáo 24h Ngay'}
                </button>
              )}
            </div>
          </div>

          {/* ── Kênh 6: Chính Sách Lưu Giữ Log (Log Retention) ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Database size={18} color="#06b6d4" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {t.retentionTitle || 'Chính Sách Lưu Giữ Log (Retention Policy)'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {t.retentionDesc || 'Tự động xóa các log cũ hơn N ngày trong OpenSearch lúc 00:00 hàng ngày.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>{t.retentionDaysLabel || 'Số ngày lưu trữ log (Retention Days)'}</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="form-input"
                  style={{ width: '100%', maxWidth: '200px' }}
                  value={configState.retentionDays}
                  onChange={e => setConfigState(p => ({ ...p, retentionDays: parseInt(e.target.value, 10) || 30 }))}
                  disabled={currentUser?.role === 'viewer'}
                />
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  className="toggle-btn"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderColor: '#ef4444', color: '#f87171' }}
                  onClick={handleRunRetentionCleanup}
                  disabled={isCleaningRetention}
                >
                  {isCleaningRetention ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                  {t.btnRetentionCleanup || 'Dọn Dẹp Log Cũ Ngay'}
                </button>
              )}
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
              <input
                id="modal-retention-auto-check"
                type="checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={configState.autoCleanupEnabled}
                onChange={e => setConfigState(p => ({ ...p, autoCleanupEnabled: e.target.checked }))}
                disabled={currentUser?.role === 'viewer'}
              />
              <label htmlFor="modal-retention-auto-check" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.82rem' }}>
                {t.retentionAutoCleanup || 'Bật tự động dọn dẹp log quá hạn'}
              </label>
            </div>
          </div>

          {/* ── Kênh 7: Xuất Báo Cáo Dữ Liệu Excel (.xlsx) ── */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <FileSpreadsheet size={18} color="#10b981" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Xuất Báo Cáo Dữ Liệu Excel (.xlsx)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Tải xuống tập tin báo cáo định dạng Excel (.xlsx) chứa danh sách log hoặc sự kiện Anomaly để phân tích offline.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="toggle-btn"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                onClick={() => handleExportCsv && handleExportCsv('anomalies')}
              >
                <FileSpreadsheet size={14} color="#10b981" /> Xuất Danh Sách Anomaly (.xlsx)
              </button>
              <button
                type="button"
                className="toggle-btn"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                onClick={() => handleExportCsv && handleExportCsv('logs')}
              >
                <FileSpreadsheet size={14} color="#10b981" /> Xuất Danh Sách Log (.xlsx)
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="toggle-btn" onClick={onClose}>
            Đóng
          </button>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                saveConfig();
                onClose();
              }}
            >
              <Send size={15} /> Lưu Cấu Hình
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
