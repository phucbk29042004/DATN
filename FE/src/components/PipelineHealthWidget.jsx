import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, X, Server, Layers, Cpu, CheckCircle2, AlertTriangle, AlertOctagon, Clock, Zap } from 'lucide-react';

const API_BASE = '/api/v1';

export default function PipelineHealthWidget({ isOpen, onClose, lang, addToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const isVi = lang === 'vi';

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pipeline/health`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (addToast) addToast(lang === 'vi' ? 'Đã cập nhật trạng thái pipeline' : 'Pipeline status refreshed', 'success');
      }
    } catch {
      // Backend offline
    } finally {
      setLoading(false);
    }
  }, [addToast, lang]);

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 5000); // 5s auto-poll
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchHealth]);

  if (!isOpen) return null;

  const isHealthy = data?.status === 'HEALTHY';
  const isWarning = data?.status === 'WARNING';
  const statusColor = isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444';

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-container" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
            <Activity size={20} color={statusColor} />
            {isVi ? 'Sức Khỏe Đường Ống Xử Lý (Pipeline Health)' : 'Pipeline Health & Queue Monitoring'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button className="toggle-btn" onClick={fetchHealth} disabled={loading} style={{ padding: '0.25rem 0.5rem' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button className="toast-close" onClick={onClose} aria-label="Close" style={{ position: 'static' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Status banner */}
          <div style={{
            background: `rgba(${isHealthy ? '16, 185, 129' : isWarning ? '245, 158, 11' : '239, 68, 68'}, 0.1)`,
            border: `1px solid ${statusColor}`,
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {isHealthy ? <CheckCircle2 size={24} color={statusColor} /> : isWarning ? <AlertTriangle size={24} color={statusColor} /> : <AlertOctagon size={24} color={statusColor} />}
              <div>
                <div style={{ fontWeight: 700, color: statusColor, fontSize: '0.95rem' }}>
                  {data?.status || 'CHECKING...'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {data?.message || (isVi ? 'Đang kiểm tra tình trạng hàng đợi...' : 'Checking pipeline status...')}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isVi ? 'Cập nhật: ' : 'Updated: '} {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('vi-VN') : '—'}
            </span>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {/* BullMQ Queue */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <Layers size={15} color="#818cf8" />
                <span>{isVi ? 'Hàng Đợi BullMQ (Redis)' : 'BullMQ Queue (Redis)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Đang chờ (Waiting):' : 'Waiting:'}</span>
                <span style={{ fontWeight: 700, color: (data?.queue?.waiting || 0) > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                  {data?.queue?.waiting ?? 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Đang chạy (Active):' : 'Active:'}</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{data?.queue?.active ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Hoàn thành (Done):' : 'Completed:'}</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{data?.queue?.completed?.toLocaleString() ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Lỗi (Failed):' : 'Failed:'}</span>
                <span style={{ fontWeight: 700, color: (data?.queue?.failed || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {data?.queue?.failed ?? 0}
                </span>
              </div>
            </div>

            {/* Throughput & Latency */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <Zap size={15} color="#06b6d4" />
                <span>{isVi ? 'Thông Lượng & Độ Trễ' : 'Throughput & Latency'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Thông lượng hiện tại:' : 'Current Ingest:'}</span>
                <span style={{ fontWeight: 700, color: '#06b6d4', fontSize: '1rem' }}>
                  {data?.throughput?.currentLogsPerSec ?? 0} <small style={{ fontSize: '0.7rem' }}>log/s</small>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Đỉnh thông lượng:' : 'Peak Ingest:'}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data?.throughput?.peakLogsPerSec ?? 0} <small style={{ fontSize: '0.7rem' }}>log/s</small>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isVi ? 'Độ trễ Pipeline:' : 'Avg Latency:'}</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>
                  ~{data?.latency?.avgLatencyMs ?? 0} <small style={{ fontSize: '0.7rem' }}>ms</small>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Redis Server:</span>
                <span style={{ fontWeight: 600, color: data?.redis?.status === 'ready' || data?.redis?.status === 'connected' ? '#10b981' : '#ef4444' }}>
                  {data?.redis?.host}:{data?.redis?.port}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Config & Reliability Architecture Notes */}
          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
            <span style={{ fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Cpu size={14} /> {isVi ? 'Cơ Chế Tin Cậy & Tải Cao (Reliability):' : 'Pipeline Architecture & Reliability:'}
            </span>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <li><strong>Redis AOF:</strong> {isVi ? 'Đệm hàng đợi bền vững chống mất dữ liệu khi restart.' : 'Persistent queue via Redis AOF.'}</li>
              <li><strong>Backpressure & Bulk Index:</strong> {isVi ? 'Gom buffer 10 logs/batch trước khi nạp OpenSearch.' : 'Buffer 10 logs/batch to maximize bulk throughput.'}</li>
              <li><strong>Worker Concurrency:</strong> {isVi ? '5 luồng xử lý song song, retry tự động với backoff.' : '5 parallel workers with exponential retry backoff.'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

