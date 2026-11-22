import React, { useState } from 'react';
import CustomSelect from './CustomSelect.jsx';
import {
  FileText,
  Send,
  X,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Tag,
  Wrench,
  HelpCircle,
} from 'lucide-react';

const ROOT_CAUSES = [
  { id: 'APP_BUG', label: 'Lỗi Code / Ứng Dụng (Application Bug)' },
  { id: 'DB_ERROR', label: 'Cơ Sở Dữ Liệu (Database Failure)' },
  { id: 'NETWORK', label: 'Kết Nối Mạng / Timeout (Network / Latency)' },
  { id: 'OVERLOAD', label: 'Quá Tải Tài Nguyên (CPU/Memory Spike)' },
  { id: 'CONFIG', label: 'Sai Cấu Hình (Misconfiguration)' },
  { id: 'FALSE_ALARM', label: 'Báo Động Giả (False Positive)' },
];

const ACTIONS_TAKEN = [
  { id: 'RESTART', label: 'Đã Khởi Động Lại Dịch Vụ (Restart Service)' },
  { id: 'ROLLBACK', label: 'Đã Rollback Phiên Bản (Rollback Release)' },
  { id: 'SCALE', label: 'Đã Mở Rộng Tài Nguyên (Scale CPU/RAM)' },
  { id: 'HOTFIX', label: 'Đã Vá Lỗi Nóng (Applied Hotfix)' },
  { id: 'WHITELIST', label: 'Đã Bỏ Qua / Thêm Ngoại Lệ (Whitelisted)' },
];

const PRIORITIES = [
  { id: 'P1', label: 'P1 - Khẩn cấp', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { id: 'P2', label: 'P2 - Nghiêm trọng', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'P3', label: 'P3 - Trung bình', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
];

export default function IncidentNoteModal({
  isOpen,
  onClose,
  anomaly,
  onAddNote,
  onUpdateStatus,
  currentUser,
  lang,
}) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  // Resolution Form Mode
  const [isResolving, setIsResolving] = useState(false);
  const [selectedRootCause, setSelectedRootCause] = useState(ROOT_CAUSES[0].label);
  const [selectedActionTaken, setSelectedActionTaken] = useState(ACTIONS_TAKEN[0].label);
  const [selectedPriority, setSelectedPriority] = useState('P2');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen || !anomaly) return null;

  const isVi = lang === 'vi';
  const isAdmin = currentUser?.role === 'admin';
  const notes = anomaly.incident_notes || [];
  const status = anomaly.incident_status || 'NEW';
  const priority = anomaly.incident_priority || 'P2';
  const currentPriorityObj = PRIORITIES.find(p => p.id === priority) || PRIORITIES[1];

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || loading) return;

    setLoading(true);
    try {
      await onAddNote(
        anomaly.id || anomaly.hash_id,
        noteText.trim(),
        isAdmin ? 'ADMIN_NOTE' : 'INVESTIGATION'
      );
      setNoteText('');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!onUpdateStatus) return;
    setLoading(true);
    try {
      await onUpdateStatus(anomaly.id || anomaly.hash_id, 'ACKNOWLEDGED', {
        priority: selectedPriority,
        note: `Tiếp nhận sự cố mức ${selectedPriority}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!onUpdateStatus) return;
    setLoading(true);
    try {
      await onUpdateStatus(anomaly.id || anomaly.hash_id, 'RESOLVED', {
        root_cause: selectedRootCause,
        action_taken: selectedActionTaken,
        priority,
        note: resolutionNote.trim() || `Xử lý hoàn tất: ${selectedActionTaken}`
      });
      setIsResolving(false);
      setResolutionNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-container" style={{ maxWidth: '580px', width: '92%' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={19} color="var(--accent-primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {isVi ? 'Biên Bản & Tiến Trình Sự Cố' : 'Incident Lifecycle & Audit'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                ID: {(anomaly.id || anomaly.hash_id || 'N/A').slice(0, 16)}...
              </div>
            </div>
          </div>
          <button className="toast-close" onClick={onClose} aria-label="Close" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Status & Priority Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái:</span>
              {status === 'RESOLVED' ? (
                <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem' }}>
                  <CheckCircle2 size={11} /> Đã Giải Quyết
                </span>
              ) : status === 'ACKNOWLEDGED' ? (
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>
                  <Eye size={11} /> Đang Xử Lý
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem' }}>
                  <AlertTriangle size={11} /> Mới Phát Hiện
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Độ ưu tiên:</span>
              <span className="badge" style={{ background: currentPriorityObj.bg, color: currentPriorityObj.color, border: `1px solid ${currentPriorityObj.color}40`, fontSize: '0.75rem', fontWeight: 700 }}>
                {currentPriorityObj.label}
              </span>
            </div>
          </div>

          {/* Anomaly Log Summary */}
          <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                {anomaly.service || anomaly.service_name || 'unknown-service'}
              </span>
              <span style={{ color: 'var(--severity-error)', fontWeight: 700 }}>
                Score: {((anomaly.anomaly_score ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.77rem', wordBreak: 'break-word', lineHeight: 1.45 }}>
              {anomaly.message || anomaly.content || '(Không có nội dung log)'}
            </div>
          </div>

          {/* BIÊN BẢN XỬ LÝ (Nghiệm thu sự cố - hiển thị cho cả Admin và Viewer khi đã có thông tin) */}
          {(anomaly.root_cause || anomaly.action_taken || status === 'RESOLVED') && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <ShieldCheck size={14} />
                Biên Bản Nghiệm Thu Khắc Phục (SRE Resolution)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Nguyên nhân gốc rễ: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{anomaly.root_cause || 'Đang cập nhật'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Hành động xử lý: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{anomaly.action_taken || 'Đang cập nhật'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Người xử lý: </span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{anomaly.resolved_by || anomaly.acknowledged_by || 'Admin'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Thời gian: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {anomaly.resolved_at ? new Date(anomaly.resolved_at).toLocaleTimeString('vi-VN') : '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN ACTION PANEL (Dành riêng cho Admin thao tác chuyển vòng đời) */}
          {isAdmin && status !== 'RESOLVED' && !isResolving && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
              {status === 'NEW' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mức ưu tiên:</span>
                    <CustomSelect
                      className="select-filter"
                      style={{ minWidth: '150px' }}
                      value={selectedPriority}
                      onChange={e => setSelectedPriority(e.target.value)}
                      options={[
                        { value: 'P1', label: 'P1 - Khẩn cấp' },
                        { value: 'P2', label: 'P2 - Nghiêm trọng' },
                        { value: 'P3', label: 'P3 - Bình thường' }
                      ]}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem', backgroundColor: '#f59e0b' }}
                    onClick={handleAcknowledge}
                    disabled={loading}
                  >
                    <Eye size={13} /> Tiếp Nhận Sự Cố
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Đã tiếp nhận bởi <strong>{anomaly.acknowledged_by || 'Admin'}</strong>
                  </span>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem', backgroundColor: '#10b981' }}
                    onClick={() => setIsResolving(true)}
                  >
                    <Check size={13} /> Hoàn Tất Xử Lý (Resolve)
                  </button>
                </>
              )}
            </div>
          )}

          {/* FORM GIẢI QUYẾT SỰ CỐ (Admin điền Root Cause & Action Taken) */}
          {isResolving && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={14} /> Hoàn Tất Biên Bản Xử Lý Sự Cố
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nguyên nhân gốc rễ (Root Cause):</label>
                <CustomSelect
                  className="select-filter"
                  style={{ width: '100%' }}
                  value={selectedRootCause}
                  onChange={e => setSelectedRootCause(e.target.value)}
                  options={ROOT_CAUSES.map(rc => ({ value: rc.label, label: rc.label }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Biện pháp đã khắc phục (Action Taken):</label>
                <CustomSelect
                  className="select-filter"
                  style={{ width: '100%' }}
                  value={selectedActionTaken}
                  onChange={e => setSelectedActionTaken(e.target.value)}
                  options={ACTIONS_TAKEN.map(act => ({ value: act.label, label: act.label }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ghi chú nghiệm thu:</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  placeholder="Ghi chú thêm về việc khắc phục..."
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.3rem' }}>
                <button
                  type="button"
                  className="toggle-btn"
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                  onClick={() => setIsResolving(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.3rem 0.9rem', fontSize: '0.78rem', backgroundColor: '#10b981' }}
                  onClick={handleConfirmResolve}
                  disabled={loading}
                >
                  <Check size={13} /> Lưu & Đóng Sự Cố
                </button>
              </div>
            </div>
          )}

          {/* LỊCH SỬ GHI CHÚ & ĐIỀU TRA (Audit Timeline) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Nhật Ký Điều Tra & Ghi Chú ({notes.length})
              </span>
              {!isAdmin && (
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Viewer có quyền gửi ghi chú ca trực
                </span>
              )}
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>
                  {isVi ? 'Chưa có ghi chú nào cho sự cố này' : 'No investigation notes yet'}
                </div>
              ) : (
                notes.map((n, idx) => {
                  const isViewerNote = n.role === 'viewer' || n.type === 'INVESTIGATION';
                  return (
                    <div key={n.id || idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ color: isViewerNote ? 'var(--accent-secondary)' : 'var(--accent-primary)', fontWeight: 700 }}>
                            {n.author}
                          </span>
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: isViewerNote ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)', color: isViewerNote ? '#3b82f6' : '#6366f1' }}>
                            {isViewerNote ? 'Giám sát viên' : 'Quản trị viên'}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('vi-VN') : ''}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {n.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Note Form (Cả Admin và Viewer đều có thể gửi) */}
          <form onSubmit={handleAddNoteSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
            <input
              type="text"
              className="search-input"
              style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
              placeholder={
                isAdmin
                  ? 'Thêm chỉ dẫn hoặc ghi chú xử lý...'
                  : 'Ghi chú điều tra / manh mối lỗi (Viewer)...'
              }
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              disabled={loading || !noteText.trim()}
            >
              <Send size={13} /> {isVi ? 'Gửi' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
