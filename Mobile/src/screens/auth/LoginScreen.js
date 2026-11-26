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
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Lock, User, Eye, EyeOff, Settings, Activity, X, Server } from 'lucide-react-native';
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

  // Config Server IP Modal
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverInput, setServerInput] = useState('');

  const handleOpenServerConfig = async () => {
    const current = await getServerUrl();
    setServerInput(current);
    setShowServerModal(true);
  };

  const handleSaveServerConfig = async () => {
    if (serverInput.trim()) {
      await setServerUrl(serverInput.trim());
      setShowServerModal(false);
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Top Bar Header with Settings */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.badgeBrand, { backgroundColor: colors.primaryLight }]}>
            <Activity size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>LOGPULSE SRE</Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenServerConfig}
            style={[styles.btnSettings, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Cấu hình máy chủ"
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Đăng nhập</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Hệ thống giám sát log & cảnh báo sự cố thời gian thực
            </Text>
          </View>

          {/* Flat Form Fields */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tên tài khoản</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Nhập tên tài khoản"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mật khẩu</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Mật khẩu truy cập"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(p => !p)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.primary} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Truy cập hệ thống</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal Cấu hình Server IP */}
        <Modal
          visible={showServerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowServerModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Server size={18} color={colors.primary} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Địa Chỉ Máy Chủ API</Text>
                </View>
                <TouchableOpacity onPress={() => setShowServerModal(false)}>
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                Nhập địa chỉ máy chủ Backend (Ví dụ: http://192.168.1.10:5000)
              </Text>

              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://192.168.x.x:5000"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btnModalCancel, { borderColor: colors.borderSubtle }]}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={[styles.btnModalCancelText, { color: colors.textSecondary }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModalSave, { backgroundColor: colors.primary }]}
                  onPress={handleSaveServerConfig}
                >
                  <Text style={styles.btnModalSaveText}>Lưu Cấu Hình</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  badgeBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnSettings: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.374,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '400',
  },
  loginBtn: {
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.224,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnModalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnModalCancelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  btnModalSave: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnModalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
