/**
 * Enterprise Frontend Configuration
 * Tự động đồng bộ URL backend theo biến môi trường Vite hoặc mặc định server Render https://datn-juwa.onrender.com
 */
export const DEFAULT_PRODUCTION_BACKEND = 'https://datn-juwa.onrender.com';

export const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : DEFAULT_PRODUCTION_BACKEND)
).replace(/\/+$/, '');

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

export const SOCKET_URL = BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : DEFAULT_PRODUCTION_BACKEND);
