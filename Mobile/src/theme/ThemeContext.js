import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './colors';

const THEME_STORAGE_KEY = 'LOGPULSE_MOBILE_THEME';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  colors: colors.dark,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setTheme(saved);
        }
      } catch (err) {
        console.warn('Lỗi đọc theme từ storage:', err);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (err) {
      console.warn('Lỗi lưu theme:', err);
    }
  };

  const setThemeMode = async (mode) => {
    if (mode === 'dark' || mode === 'light') {
      setTheme(mode);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch (err) {
        console.warn('Lỗi lưu theme:', err);
      }
    }
  };

  const currentColors = colors[theme] || colors.dark;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        colors: currentColors,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

