import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mặc định: Máy ảo Android dùng 10.0.2.2, iOS simulator dùng localhost, hoặc IP LAN
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const DEFAULT_API_BASE = `http://${DEFAULT_HOST}:5000`;
export const DEFAULT_COLLECTOR_BASE = `http://${DEFAULT_HOST}:4000`;

const SERVER_URL_KEY = 'LOGPULSE_MOBILE_SERVER_URL';

export const getServerUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
    return saved || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
};

export const setServerUrl = async (url) => {
  try {
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
  } catch (err) {
    console.warn('Lỗi lưu URL máy chủ:', err);
  }
};

