import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';

import AuthStackNavigator from './AuthStackNavigator';
import AppStackNavigator from './AppStackNavigator';
import FloatingAiAssistant from '../components/FloatingAiAssistant';

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      <View style={styles.rootContainer}>
        {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}

        {/* Global Floating AI Assistant Bubble (chỉ hiển thị khi đã đăng nhập) */}
        {isAuthenticated && <FloatingAiAssistant />}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootContainer: {
    flex: 1,
  },
});

