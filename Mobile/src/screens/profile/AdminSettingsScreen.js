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
import {
  ArrowLeft,
  Bell,
  Mail,
  Clock,
  Save,
  Trash2,
  ShieldAlert,
  Calendar,
  Plus,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient } from '../../api/client';

export default function AdminSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activeBlue = colors.link || colors.primary;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [anomalyThreshold, setAnomalyThreshold] = useState('0.75');
  const [alertKeywords, setAlertKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(true);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState('30');

  useEffect(() => {
    (async () => {
      try {
        const config = await apiClient('/config').catch(() => ({}));
        if (config) {
          setAnomalyThreshold(config.anomalyThreshold != null ? String(config.anomalyThreshold) : '0.75');
          setAlertKeywords(Array.isArray(config.alertKeywords) ? config.alertKeywords : []);
          setDiscordWebhookUrl(config.discordWebhookUrl || '');
          setDiscordEnabled(!!config.discordEnabled);
          setReceiverEmail(config.receiverEmail || '');
          setEmailEnabled(!!config.emailEnabled);
          setDailyDigestEnabled(config.dailyDigestEnabled !== false);
          setAutoCleanupEnabled(config.autoCleanupEnabled !== false);
          setRetentionDays(config.retentionDays ? config.retentionDays.toString() : '30');
        }
      } catch (err) {
        console.warn('Lỗi đọc cấu hình thông báo:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddKeyword = () => {
    const kw = newKeyword.trim().toUpperCase();
    if (!kw) return;
    if (!alertKeywords.includes(kw)) {
      setAlertKeywords(prev => [...prev, kw]);
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw) => {
    setAlertKeywords(prev => prev.filter(k => k !== kw));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedThreshold = Math.min(1, Math.max(0.1, parseFloat(anomalyThreshold) || 0.75));
      await apiClient('/config', {
        method: 'POST',
        body: JSON.stringify({
          anomalyThreshold: parsedThreshold,
          alertKeywords,
          discordWebhookUrl,
          discordEnabled,
          receiverEmail,
          emailEnabled,
          dailyDigestEnabled,
          autoCleanupEnabled,
          retentionDays: parseInt(retentionDays, 10) || 30,
        }),
      });

      Alert.alert('Thành công', 'Đã lưu cấu hình thông báo, từ khóa và lưu trữ log!');
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
              const res = await apiClient('/storage/retention/cleanup', {
                method: 'POST',
                body: JSON.stringify({ days: parseInt(retentionDays, 10) || 30 }),
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
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: Math.max(insets.bottom, 32) }}>
          {/* Ngưỡng Anomaly Score & Từ Khóa */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.titleRow}>
              <ShieldAlert size={18} color={colors.danger} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Ngưỡng & Từ Khóa Cảnh Báo</Text>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 10 }]}>
              Ngưỡng Anomaly Score kích hoạt cảnh báo (0.1 - 1.0):
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
              placeholder="0.75"
              placeholderTextColor={colors.textMuted}
              value={anomalyThreshold}
              onChangeText={setAnomalyThreshold}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Từ khóa cảnh báo động (Tags):
            </Text>
            <View style={styles.keywordInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
                placeholder="VD: OOM, PANIC, TIMEOUT..."
                placeholderTextColor={colors.textMuted}
                value={newKeyword}
                onChangeText={setNewKeyword}
                autoCapitalize="characters"
                onSubmitEditing={handleAddKeyword}
              />
              <TouchableOpacity
                style={[styles.btnAddTag, { backgroundColor: colors.primary }]}
                onPress={handleAddKeyword}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.tagsWrap}>
              {alertKeywords.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Chưa có từ khóa bổ sung.</Text>
              ) : (
                alertKeywords.map((kw) => (
                  <View
                    key={kw}
                    style={[styles.tagChip, { backgroundColor: colors.primaryLight, borderColor: colors.borderSubtle }]}
                  >
                    <Text style={[styles.tagText, { color: activeBlue }]}>{kw}</Text>
                    <TouchableOpacity onPress={() => handleRemoveKeyword(kw)}>
                      <X size={12} color={activeBlue} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Discord Webhook */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Bell size={18} color={activeBlue} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Discord Webhook</Text>
              </View>
              <Switch
                value={discordEnabled}
                onValueChange={setDiscordEnabled}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Webhook URL:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
              placeholder="https://discord.com/api/webhooks/..."
              placeholderTextColor={colors.textMuted}
              value={discordWebhookUrl}
              onChangeText={setDiscordWebhookUrl}
              autoCapitalize="none"
            />
          </View>

          {/* Email SMTP */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Mail size={18} color={activeBlue} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Email Cảnh Báo (SMTP)</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email người nhận cảnh báo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
              placeholder="admin@example.com"
              placeholderTextColor={colors.textMuted}
              value={receiverEmail}
              onChangeText={setReceiverEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Daily Digest & Retention */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Calendar size={18} color={activeBlue} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Báo Cáo Định Kỳ 08:00 (Daily Digest)</Text>
              </View>
              <Switch
                value={dailyDigestEnabled}
                onValueChange={setDailyDigestEnabled}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Retention Days */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Clock size={18} color={colors.warning} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Lưu Trữ Tự Động (Retention)</Text>
              </View>
              <Switch
                value={autoCleanupEnabled}
                onValueChange={setAutoCleanupEnabled}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 6 }]}>
              Số ngày lưu trữ log trên OpenSearch:
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
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
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 18,
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
    fontWeight: '600',
    letterSpacing: -0.224,
  },
  label: {
    fontSize: 12.5,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  keywordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnAddTag: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  btnCleanup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 1,
    marginTop: 12,
  },
  btnCleanupText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnSave: {
    height: 46,
    borderRadius: 9999,
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
    fontWeight: '600',
  },
});
