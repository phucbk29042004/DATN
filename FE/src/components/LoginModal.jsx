import React, { useState } from 'react';
import { LogIn, X, Shield, AlertCircle, Key, User, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../config.js';

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

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
              <Shield size={20} color="#60a5fa" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>LOGPULSE SRE</span>
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
                {isVi ? 'Chọn tài khoản mẫu hoặc nhập thông tin quản trị' : 'Choose demo account or enter your credentials'}
              </p>
            </div>
          </div>

          {/* Quick Demo Accounts */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {isVi ? 'Tài khoản demo mẫu' : 'Quick Demo Profiles'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: username === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${username === 'admin' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={14} color="#ef4444" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Admin</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Toàn quyền</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer', 'viewer123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: username === 'viewer' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${username === 'viewer' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={14} color="#3b82f6" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Viewer</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Chỉ xem</div>
                </div>
              </button>
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
