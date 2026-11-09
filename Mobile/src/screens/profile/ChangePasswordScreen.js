import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, KeyRound, Lock, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { changePassword } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi đổi mật khẩu', err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Đổi Mật Khẩu</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu hiện tại</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <Lock size={16} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nhập mật khẩu cũ"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Mật khẩu mới</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <KeyRound size={16} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Xác nhận mật khẩu mới</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <KeyRound size={16} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSubmit, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnRow}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.btnSubmitText}>Cập Nhật Mật Khẩu</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  btnSubmit: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

