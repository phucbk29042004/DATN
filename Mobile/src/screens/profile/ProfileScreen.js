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
  KeyRound,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Info,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { currentUser, isAdmin, logout } = useAuth();
  const activeBlue = colors.link || colors.primary;

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
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
            <ShieldCheck size={28} color={activeBlue} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {currentUser?.displayName || currentUser?.username}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
              @{currentUser?.username}
            </Text>
            <View style={[styles.rolePill, { backgroundColor: isAdmin ? colors.primaryLight : colors.surfaceVariant }]}>
              <Text style={[styles.rolePillText, { color: isAdmin ? activeBlue : colors.textSecondary }]}>
                {isAdmin ? 'QUẢN TRỊ VIÊN' : 'GIÁM SÁT VIÊN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Giao Diện */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>GIAO DIỆN</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              {isDark ? <Moon size={17} color={activeBlue} /> : <Sun size={17} color={colors.warning} />}
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
        <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {/* Điều hướng sang Stack Screen Đổi Mật Khẩu */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <KeyRound size={17} color={activeBlue} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Đổi Mật Khẩu</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Điều hướng sang Stack Screen Cấu Hình Báo Cáo (Chỉ Admin) */}
          {isAdmin ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('AdminSettings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Settings size={17} color={activeBlue} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Cấu Hình Báo Cáo & Lưu Trữ</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.menuItem, { opacity: 0.65 }]}>
              <View style={styles.menuItemLeft}>
                <Info size={16} color={colors.textMuted} />
                <Text style={[styles.menuItemText, { color: colors.textMuted, fontSize: 12.5 }]}>
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
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 95,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
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
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.374,
  },
  profileUsername: {
    fontSize: 12.5,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    marginTop: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 18,
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
    fontSize: 14,
    fontWeight: '400',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 8,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11.5,
    marginTop: 20,
  },
});
