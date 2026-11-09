import React, { useState } from 'react';
import { FileText, Send, X, Clock, User, CheckCircle2 } from 'lucide-react';

export default function IncidentNoteModal({ isOpen, onClose, anomaly, onAddNote, lang }) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !anomaly) return null;

  const isVi = lang === 'vi';
  const notes = anomaly.incident_notes || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || loading) return;

    setLoading(true);
    try {
      await onAddNote(anomaly.id || anomaly.hash_id, noteText.trim());
      setNoteText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
            <FileText size={18} color="var(--accent-primary)" />
            {isVi ? 'Ghi Chú Xử Lý Sự Cố (Remediation Notes)' : 'Incident Remediation Notes'}
          </span>
          <button className="toast-close" onClick={onClose} aria-label="Close" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Anomaly summary */}
          <div style={{ background: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{anomaly.service || anomaly.service_name || 'System'}</span>
              <span style={{ color: 'var(--severity-error)', fontWeight: 700 }}>
                Score: {((anomaly.anomaly_score ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-word' }}>
              {(anomaly.message || anomaly.content || '').slice(0, 180)}...
            </div>
          </div>

          {/* Notes list */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>
                {isVi ? 'Chưa có ghi chú nào cho sự cố này' : 'No remediation notes yet'}
              </div>
            ) : (
              notes.map((n, idx) => (
                <div key={n.id || idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      <User size={12} /> {n.author}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={11} /> {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.83rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {n.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add note input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="text"
              className="search-input"
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.84rem' }}
              placeholder={isVi ? 'Nhập ghi chú xử lý (VD: Đã restart pod auth-service...)' : 'Enter note (e.g. Restarted auth pod...)'}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
              disabled={loading || !noteText.trim()}
            >
              <Send size={14} /> {isVi ? 'Lưu' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

