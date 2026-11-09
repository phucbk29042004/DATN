import React, { useState } from 'react';
import { LogIn, X, Shield, AlertCircle, Key, User, Eye, EyeOff } from 'lucide-react';

const API_BASE = '/api/v1';

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-portal-wrapper">
      <div className="login-portal-card" onClick={e => e.stopPropagation()}>
        {/* Left Column: Bức ảnh trung tâm dữ liệu giám sát cao cấp, không văn bản rườm rà */}
        <div 
          className="login-banner-side"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.92) 100%), url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2.5rem 2rem',
            position: 'relative'
          }}
        >
          {/* Logo & Tên nền tảng tiếng Việt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              color: '#ffffff'
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.12rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {isVi ? 'Hệ Thống Giám Sát Log' : 'Log Monitoring System'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>
                {isVi ? 'Phân Tích & Cảnh Báo Sự Cố' : 'Incident Analysis & Alerting'}
              </div>
            </div>
          </div>

          {/* Slogan & Giới thiệu ngắn gọn tinh tế ở góc dưới bức ảnh */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
              {isVi ? 'Giám Sát & Phân Tích Log Thời Gian Thực' : 'Real-time Log Analytics Platform'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {isVi ? 'Phát hiện sự cố và phân tích mẫu log tự động ứng dụng thuật toán Drain Mining' : 'Automated log template extraction & anomaly detection'}
            </div>
          </div>
        </div>

        {/* Right Column: Clean Authentication Form */}
        <div className="login-form-side" style={{ padding: '2.5rem 2.25rem', display: 'flex', flexDirection: 'column' }}>
          <div className="login-form-header" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="login-icon-circle" style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-primary)', border: '1px solid var(--border-color)'
              }}>
                <LogIn size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isVi ? 'Đăng Nhập' : 'Sign In'}
              </h3>
            </div>
            <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {isVi ? 'Nhập thông tin tài khoản để truy cập bảng điều khiển' : 'Enter your credentials to access the workspace'}
            </p>
          </div>

          {error && (
            <div className="login-error-alert" style={{ marginBottom: '1.2rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form-body">
            {/* Username Input */}
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                {isVi ? 'Tài khoản' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '2.4rem', height: '42px', fontSize: '0.88rem' }}
                  placeholder={isVi ? 'Nhập tài khoản (vd: admin)' : 'Enter username'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Password Input With Eye Toggle */}
            <div className="form-group" style={{ marginBottom: '1.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                {isVi ? 'Mật khẩu' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="search-input"
                  style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.6rem', height: '42px', fontSize: '0.88rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Key size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                
                {/* Nút bấm ẩn / hiện mật khẩu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
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
