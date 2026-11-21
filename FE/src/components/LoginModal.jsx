import React, { useState } from 'react';
import { LogIn, X, AlertCircle, Key, User, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../config.js';

function SreSentinelLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sreSentinelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
      <path d="M16 2 V6 M16 26 V30 M2 16 H6 M26 16 H30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="16,7 23.5,11.3 23.5,20.7 16,25 8.5,20.7 8.5,11.3" stroke="url(#sreSentinelGrad)" strokeWidth="1.8" fill="rgba(6, 182, 212, 0.12)" />
      <circle cx="16" cy="16" r="3" fill="#10b981" />
      <circle cx="16" cy="16" r="5.5" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.8" />
    </svg>
  );
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, lang }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isVi = lang === 'vi';

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.status === 405) {
        throw new Error(isVi 
          ? 'Không thể kết nối đến máy chủ Backend (405 Method Not Allowed).' 
          : 'Cannot connect to Backend server (405 Method Not Allowed).');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isVi ? 'Đăng nhập không thành công' : 'Login failed'));
      }

      // Lưu vào sessionStorage để bắt buộc đăng nhập khi mở lại phiên làm việc mới
      localStorage.removeItem('logpulse_auth_token');
      localStorage.removeItem('logpulse_auth_user');
      sessionStorage.setItem('logpulse_auth_token', data.token);
      sessionStorage.setItem('logpulse_auth_user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
      if (onClose) onClose();
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError(isVi 
          ? 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ.' 
          : 'Cannot connect to Backend server. Please check service status.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-portal-wrapper">
      <div className="login-portal-card" onClick={e => e.stopPropagation()}>
        {/* Left Column: Bức ảnh trung tâm dữ liệu giám sát cao cấp */}
        <div 
          className="login-banner-side"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.92) 100%), url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)'
            }}>
              <SreSentinelLogo size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>LOGPULSE</span>
                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.25)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', fontWeight: 700 }}>SRE</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>OBSERVABILITY SENTINEL</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.3)', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#93c5fd', marginBottom: '8px' }}>
              Enterprise Edition
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.3 }}>
              {isVi ? 'Hạ Tầng Giám Sát Phân Tán' : 'Distributed Monitoring Platform'}
            </h2>
            <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.8, lineHeight: 1.5 }}>
              {isVi 
                ? 'Hệ thống AIOps phát hiện bất thường và giám sát tập trung chuẩn doanh nghiệp.'
                : 'Enterprise AIOps anomaly detection and centralized monitoring system.'}
            </p>
          </div>
        </div>

        {/* Right Column: Form Đăng Nhập */}
        <div className="login-form-side">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {isVi ? 'Đăng Nhập Cổng Giám Sát' : 'Sign In to Portal'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {isVi ? 'Vui lòng nhập thông tin tài khoản quản trị' : 'Please enter your administrator credentials'}
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.78rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {isVi ? 'Tên đăng nhập' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={isVi ? 'Nhập tên tài khoản...' : 'Enter username...'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input, rgba(0,0,0,0.2))',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                  required
                />
                <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {isVi ? 'Mật khẩu' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isVi ? 'Nhập mật khẩu...' : 'Enter password...'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 36px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input, rgba(0,0,0,0.2))',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                  required
                />
                <Key size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: showPassword ? 'var(--accent-primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? (isVi ? 'Ẩn mật khẩu' : 'Hide password') : (isVi ? 'Hiện mật khẩu' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  height: '40px',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  width: 'auto',
                  minWidth: '150px',
                  padding: '0 1.75rem',
                  borderRadius: '10px'
                }}
                disabled={loading || !username.trim() || !password.trim()}
              >
                {loading ? (isVi ? 'Đang xác thực...' : 'Authenticating...') : (isVi ? 'Đăng Nhập' : 'Sign In')}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 'auto', paddingTop: '1.2rem', textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {isVi ? 'Hệ Thống Giám Sát Log & Cảnh Báo Bất Thường Thời Gian Thực' : 'Real-time Log Monitoring & Anomaly Detection'}
          </div>
        </div>
      </div>
    </div>
  );
}
