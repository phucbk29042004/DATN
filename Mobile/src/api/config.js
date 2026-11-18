import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mặc định: Kết nối trực tiếp qua IP Hotspot iPhone 172.20.10.8
export const CURRENT_LAN_IP = '172.20.10.8';
export const LOCAL_API_BASE = `http://${CURRENT_LAN_IP}:5000`;
export const NGROK_SERVER_URL = 'https://job-observing-corporal.ngrok-free.dev';

export const DEFAULT_API_BASE = `http://${CURRENT_LAN_IP}:5000`;
export const DEFAULT_COLLECTOR_BASE = `http://${CURRENT_LAN_IP}:4000`;

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

