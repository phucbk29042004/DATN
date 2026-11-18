import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  KeyRound,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Info,
  X,
  Lock,
  Check,
  Bell,
  Mail,
  Clock,
  Save,
  Trash2,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { currentUser, isAdmin, logout, changePassword } = useAuth();
  const { showToast } = useToast();

  // Modals state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [adminSettingsModalOpen, setAdminSettingsModalOpen] = useState(false);

  // Change Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Admin Settings form state
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState('30');

  // Open Admin Settings Modal & Fetch Config
  const handleOpenAdminSettings = async () => {
    setAdminSettingsModalOpen(true);
    setConfigLoading(true);
    try {
      const config = await apiClient('/config').catch(() => ({}));
      if (config) {
        setDiscordWebhookUrl(config.discordWebhookUrl || '');
        setDiscordEnabled(!!config.discordEnabled);
        setReceiverEmail(config.receiverEmail || '');
        setEmailEnabled(!!config.emailEnabled);
        setRetentionDays(config.retentionDays ? config.retentionDays.toString() : '30');
      }
    } catch (err) {
      showToast('Lỗi khi tải cấu hình hệ thống', 'error');
    } finally {
      setConfigLoading(false);
    }
  };

  // Submit Change Password
  const handleSubmitChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Vui lòng nhập đầy đủ các trường', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      showToast('Đổi mật khẩu thành công!', 'success');
      setChangePasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Không thể đổi mật khẩu', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  // Submit Admin Settings
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await apiClient('/config', {
        method: 'POST',
        body: JSON.stringify({
          discordWebhookUrl,
          discordEnabled,
          receiverEmail,
          emailEnabled,
          retentionDays: parseInt(retentionDays, 10) || 30,
        }),
      });
      showToast('Đã lưu cấu hình thông báo thành công!', 'success');
      setAdminSettingsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Lỗi lưu cấu hình', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  // Cleanup logs
  const handleRunCleanup = () => {
    Alert.alert(
      'Dọn dẹp log cũ',
      `Bạn có chắc chắn muốn dọn dẹp các log cũ hơn ${retentionDays} ngày trên OpenSearch không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dọn dẹp ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient('/storage/retention/cleanup', {
                method: 'POST',
                body: JSON.stringify({ days: parseInt(retentionDays, 10) || 30 }),
              });
              showToast(`Đã dọn dẹp ${res.deletedCount || 0} bản ghi log cũ!`, 'success');
            } catch (err) {
              showToast(err.message || 'Lỗi khi dọn dẹp log', 'error');
            }
          },
        },
      ]
    );
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tài Khoản & Cài Đặt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {currentUser?.displayName || currentUser?.username}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
              @{currentUser?.username}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: isAdmin ? 'rgba(99,102,241,0.15)' : colors.surfaceVariant }]}>
              <Text style={[styles.rolePillText, { color: isAdmin ? colors.primary : colors.secondary }]}>
                {isAdmin ? 'QUẢN TRỊ VIÊN' : 'GIÁM SÁT VIÊN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Giao Diện */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>GIAO DIỆN</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              {isDark ? <Moon size={17} color={colors.primary} /> : <Sun size={17} color={colors.warning} />}
              <Text style={[styles.menuItemText, { color: colors.text }]}>Giao diện Tối (Dark Mode)</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section: Bảo Mật & Hệ Thống */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>BẢO MẬT & HỆ THỐNG</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Đổi Mật Khẩu (Mở Modal tại chỗ) */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
            onPress={() => setChangePasswordModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <KeyRound size={17} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Đổi Mật Khẩu</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Cấu Hình Báo Cáo (Chỉ Admin - Mở Modal tại chỗ) */}
          {isAdmin ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleOpenAdminSettings}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Settings size={17} color={colors.secondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Cấu Hình Báo Cáo & Lưu Trữ</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.menuItem, { opacity: 0.6 }]}>
              <View style={styles.menuItemLeft}>
                <Info size={16} color={colors.textMuted} />
                <Text style={[styles.menuItemText, { color: colors.textMuted, fontSize: 12 }]}>
                  Tài khoản Viewer chỉ có quyền xem dữ liệu
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Section: Đăng Xuất */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.danger }]}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.danger} />
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Đăng Xuất</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          LogPulse AI Enterprise Mobile v1.0.0
        </Text>
      </ScrollView>

      {/* ── MODAL ĐỔI MẬT KHẨU ── */}
      <Modal
        visible={changePasswordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChangePasswordModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.modalTitleRow}>
                <KeyRound size={17} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Đổi Mật Khẩu</Text>
              </View>
              <TouchableOpacity onPress={() => setChangePasswordModalOpen(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mật khẩu hiện tại</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
                <Lock size={15} color={colors.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="Nhập mật khẩu cũ..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>Mật khẩu mới</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
                <KeyRound size={15} color={colors.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="Ít nhất 6 ký tự..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>Xác nhận mật khẩu mới</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
                <KeyRound size={15} color={colors.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={handleSubmitChangePassword}
                disabled={pwdLoading}
                activeOpacity={0.8}
              >
                {pwdLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.btnSubmitText}>Cập Nhật Mật Khẩu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL CẤU HÌNH & BÁO CÁO (ADMIN) ── */}
      <Modal
        visible={adminSettingsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAdminSettingsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: '82%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.modalTitleRow}>
                <Settings size={17} color={colors.secondary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Cấu Hình Báo Cáo & Lưu Trữ</Text>
              </View>
              <TouchableOpacity onPress={() => setAdminSettingsModalOpen(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {configLoading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary, fontSize: 12.5 }}>Đang tải cấu hình...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {/* Discord Alerts */}
                <View style={styles.sectionHeaderSmall}>
                  <Bell size={14} color={colors.primary} />
                  <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Cảnh Báo Discord Webhook</Text>
                </View>
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Kích hoạt thông báo Discord</Text>
                  <Switch
                    value={discordEnabled}
                    onValueChange={setDiscordEnabled}
                    trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
                {discordEnabled && (
                  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.modalInput, { color: colors.text }]}
                      placeholder="https://discord.com/api/webhooks/..."
                      placeholderTextColor={colors.textMuted}
                      value={discordWebhookUrl}
                      onChangeText={setDiscordWebhookUrl}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {/* Email Alerts */}
                <View style={[styles.sectionHeaderSmall, { marginTop: 16 }]}>
                  <Mail size={14} color={colors.secondary} />
                  <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Cảnh Báo & Báo Cáo Email</Text>
                </View>
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Kích hoạt gửi Email</Text>
                  <Switch
                    value={emailEnabled}
                    onValueChange={setEmailEnabled}
                    trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
                {emailEnabled && (
                  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.modalInput, { color: colors.text }]}
                      placeholder="admin@example.com"
                      placeholderTextColor={colors.textMuted}
                      value={receiverEmail}
                      onChangeText={setReceiverEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                )}

                {/* Log Retention Policy */}
                <View style={[styles.sectionHeaderSmall, { marginTop: 16 }]}>
                  <Clock size={14} color={colors.warning} />
                  <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Chính Sách Lưu Trữ (Retention)</Text>
                </View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Số ngày lưu trữ log:</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, marginTop: 4 }]}>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="30"
                    placeholderTextColor={colors.textMuted}
                    value={retentionDays}
                    onChangeText={setRetentionDays}
                    keyboardType="numeric"
                  />
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.btnSubmit, { backgroundColor: colors.primary, marginTop: 18 }]}
                  onPress={handleSaveConfig}
                  disabled={configSaving}
                  activeOpacity={0.8}
                >
                  {configSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={15} color="#ffffff" />
                      <Text style={styles.btnSubmitText}>Lưu Cấu Hình</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnDangerAction, { borderColor: colors.danger, marginTop: 10, marginBottom: 20 }]}
                  onPress={handleRunCleanup}
                  activeOpacity={0.8}
                >
                  <Trash2 size={15} color={colors.danger} />
                  <Text style={[styles.btnDangerText, { color: colors.danger }]}>
                    Dọn Dẹp Log Quá {retentionDays} Ngày
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 95,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileUsername: {
    fontSize: 12.5,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuItemText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11.5,
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
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
  modalBody: {
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 8,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnDangerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 12.5,
  },
});
