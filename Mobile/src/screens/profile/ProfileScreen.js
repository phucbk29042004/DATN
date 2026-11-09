import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  KeyRound,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { currentUser, isAdmin, logout } = useAuth();

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

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
            <Shield size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {currentUser?.displayName || currentUser?.username}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
              @{currentUser?.username}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: isAdmin ? colors.primaryLight : colors.surfaceVariant }]}>
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
              {isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.warning} />}
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
          {/* Đổi Mật Khẩu */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <KeyRound size={18} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Đổi Mật Khẩu</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Cấu Hình Báo Cáo (Chỉ hiển thị cho Admin) */}
          {isAdmin ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('AdminSettings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Settings size={18} color={colors.secondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Cấu Hình & Báo Cáo</Text>
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
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Đăng Xuất</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          LogPulse AI Enterprise Mobile v1.0.0
        </Text>
      </ScrollView>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 12,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
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
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
  },
});

