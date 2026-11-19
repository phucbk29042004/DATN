/**
 * Enterprise Frontend Configuration
 * Tự động đồng bộ URL backend theo biến môi trường Vite hoặc localStorage (hỗ trợ triển khai Vercel, Render và Localhost).
 */
const getSavedBackendUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('logpulse_backend_url') || '';
  }
  return '';
};

export const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || getSavedBackendUrl() || '').replace(/\/+$/, '');

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

// Chỉ kết nối Socket nếu có BACKEND_URL cụ thể hoặc đang chạy localhost (chặn kết nối sai vào domain Vercel)
export const SOCKET_URL = BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

export function setCustomBackendUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('logpulse_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('logpulse_backend_url');
    }
    window.location.reload();
  }
}
