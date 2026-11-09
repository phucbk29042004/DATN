import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Mail, Clock, Save, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient } from '../../api/client';

export default function AdminSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState('30');

  useEffect(() => {
    (async () => {
      try {
        const config = await apiClient('/config/notifications').catch(() => ({}));
        if (config) {
          setDiscordWebhookUrl(config.discordWebhookUrl || '');
          setDiscordEnabled(!!config.discordEnabled);
          setReceiverEmail(config.receiverEmail || '');
          setEmailEnabled(!!config.emailEnabled);
          setRetentionDays(config.retentionDays ? config.retentionDays.toString() : '30');
        }
      } catch (err) {
        console.warn('Lỗi đọc cấu hình thông báo:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient('/config/notifications', {
        method: 'POST',
        body: JSON.stringify({
          discordWebhookUrl,
          discordEnabled,
          receiverEmail,
          emailEnabled,
          retentionDays: parseInt(retentionDays, 10) || 30,
        }),
      });

      Alert.alert('Thành công', 'Đã lưu cấu hình thông báo và lưu trữ log!');
    } catch (err) {
      Alert.alert('Lỗi lưu cấu hình', err.message);
    } finally {
      setSaving(false);
    }
  };

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
              const res = await apiClient(`/logs/retention-cleanup?days=${retentionDays}`, {
                method: 'POST',
              });
              Alert.alert('Thành công', `Đã dọn dẹp ${res.deletedCount || 0} bản ghi log cũ!`);
            } catch (err) {
              Alert.alert('Lỗi dọn dẹp', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cấu Hình & Báo Cáo</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {/* Discord Webhook */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Bell size={18} color="#5865F2" />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Discord Webhook</Text>
              </View>
              <Switch
                value={discordEnabled}
                onValueChange={setDiscordEnabled}
                trackColor={{ false: colors.borderSubtle, true: '#5865F2' }}
              />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Webhook URL:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
              placeholder="https://discord.com/api/webhooks/..."
              placeholderTextColor={colors.textMuted}
              value={discordWebhookUrl}
              onChangeText={setDiscordWebhookUrl}
              autoCapitalize="none"
            />
          </View>

          {/* Email SMTP */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Mail size={18} color={colors.secondary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Email Cảnh Báo (SMTP)</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: colors.borderSubtle, true: colors.secondary }}
              />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email người nhận cảnh báo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
              placeholder="admin@example.com"
              placeholderTextColor={colors.textMuted}
              value={receiverEmail}
              onChangeText={setReceiverEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Retention Days */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.titleRow}>
              <Clock size={18} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Thời Gian Lưu Trữ (Retention)</Text>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 10 }]}>
              Số ngày lưu trữ log trên OpenSearch:
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
              placeholder="30"
              placeholderTextColor={colors.textMuted}
              value={retentionDays}
              onChangeText={setRetentionDays}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.btnCleanup, { borderColor: colors.danger }]}
              onPress={handleRunCleanup}
            >
              <Trash2 size={14} color={colors.danger} />
              <Text style={[styles.btnCleanupText, { color: colors.danger }]}>
                Dọn Dẹp Log Cũ Ngay Lập Tức
              </Text>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.btnSave, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnSaveRow}>
                <Save size={16} color="#ffffff" />
                <Text style={styles.btnSaveText}>Lưu Cấu Hình</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  btnCleanup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  btnCleanupText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnSave: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

