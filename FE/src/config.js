/**
 * Enterprise Frontend Configuration
 * Tự động đồng bộ URL backend theo biến môi trường Vite (hỗ trợ triển khai Vercel, Render và Localhost).
 */
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') 
  : '';

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

export const SOCKET_URL = BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

