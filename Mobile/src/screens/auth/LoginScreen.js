import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Shield, Lock, User, Server, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getServerUrl, setServerUrl } from '../../api/config';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Config Server IP
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverInput, setServerInput] = useState('');

  const handleOpenServerConfig = async () => {
    const current = await getServerUrl();
    setServerInput(current);
    setShowServerConfig(true);
  };

  const handleSaveServerConfig = async () => {
    if (serverInput.trim()) {
      await setServerUrl(serverInput.trim());
      setShowServerConfig(false);
      Alert.alert('Thành công', `Đã lưu địa chỉ máy chủ: ${serverInput.trim()}`);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Sai tài khoản hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}
    >
      <View style={styles.content}>
        {/* Logo & Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Shield size={36} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Hệ Thống Giám Sát Log</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Phân Tích & Cảnh Báo Sự Cố Thời Gian Thực
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Đăng Nhập Hệ Thống</Text>

          {/* Username Input */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <User size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Tài khoản (admin hoặc viewer)"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input With Eye Toggle */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, paddingRight: 12 }]}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, flex: 1 }]}
              placeholder="Mật khẩu"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(p => !p)} 
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.primary} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Đăng Nhập</Text>
            )}
          </TouchableOpacity>

          {/* Server Config Toggle */}
          <TouchableOpacity onPress={handleOpenServerConfig} style={styles.serverConfigToggle}>
            <Server size={14} color={colors.textSecondary} />
            <Text style={[styles.serverConfigToggleText, { color: colors.textSecondary }]}>
              Cấu hình địa chỉ IP máy chủ API
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={[styles.serverBox, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.serverBoxLabel, { color: colors.textSecondary }]}>
                Địa chỉ IP Backend (VD: http://192.168.1.10:5000):
              </Text>
              <TextInput
                style={[styles.serverInput, { color: colors.text, borderColor: colors.border }]}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://192.168.x.x:5000"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.btnSaveServer, { backgroundColor: colors.primary }]}
                onPress={handleSaveServerConfig}
              >
                <Text style={styles.btnSaveServerText}>Lưu Địa Chỉ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
  },
  loginBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
    minWidth: 160,
    paddingHorizontal: 28,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 6,
  },
  serverConfigToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  serverBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  serverBoxLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  serverInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
    marginBottom: 8,
  },
  btnSaveServer: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSaveServerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

