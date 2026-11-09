import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, setAuthToken } from '../api/client';

const USER_STORAGE_KEY = 'logpulse_mobile_auth_user';

const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  changePassword: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.warn('Lỗi khôi phục phiên đăng nhập:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await apiClient('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (!data.token || !data.user) {
        throw new Error('Phản hồi đăng nhập không hợp lệ');
      }

      await setAuthToken(data.token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await setAuthToken(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (err) {
      console.warn('Lỗi khi đăng xuất:', err);
    } finally {
      setCurrentUser(null);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await apiClient('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        loading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

