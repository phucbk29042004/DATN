import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from './config';

const TOKEN_KEY = 'logpulse_mobile_auth_token';

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = async (token) => {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Lỗi lưu token:', err);
  }
};

export const apiClient = async (endpoint, options = {}) => {
  const baseUrl = await getServerUrl();
  const token = await getAuthToken();

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Lỗi HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Yêu cầu hết thời gian chờ (Timeout). Vui lòng kiểm tra kết nối mạng hoặc IP máy chủ.');
    }
    throw err;
  }
};

