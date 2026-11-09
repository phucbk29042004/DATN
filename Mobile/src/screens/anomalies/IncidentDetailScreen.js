import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Server, AlertCircle, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function IncidentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { anomaly } = route.params || {};

  if (!anomaly) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.text, padding: 20 }}>Không tìm thấy thông tin sự cố.</Text>
      </View>
    );
  }

  const status = anomaly.incident_status || 'NEW';
  const scorePercent = anomaly.anomaly_score ? `${(anomaly.anomaly_score * 100).toFixed(0)}%` : '0%';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi Tiết Sự Cố</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Trạng thái hiện tại:</Text>
            <View style={[styles.statusBadge, { backgroundColor: status === 'RESOLVED' ? colors.successLight : colors.dangerLight }]}>
              <Text style={[styles.statusText, { color: status === 'RESOLVED' ? colors.success : colors.danger }]}>
                {status}
              </Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Độ bất thường (Score):</Text>
            <Text style={[styles.value, { color: colors.danger, fontWeight: '800' }]}>{scorePercent}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Dịch vụ (Service):</Text>
            <Text style={[styles.value, { color: colors.secondary, fontWeight: '700' }]}>
              {anomaly.service || anomaly.service_name || 'Hệ thống'}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mức độ nghiêm trọng:</Text>
            <Text style={[styles.value, { color: colors.primary, fontWeight: '700' }]}>
              {(anomaly.level || 'INFO').toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Thời gian ghi nhận:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString('vi-VN') : '—'}
            </Text>
          </View>
        </View>

        {/* Message Log */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Thông Điệp Log Gốc</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.codeText, { color: colors.text }]}>
              {anomaly.message || anomaly.content || 'Trống'}
            </Text>
          </View>
        </View>

        {/* Raw JSON Details */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Dữ Liệu Thuộc Tính (JSON)</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.codeText, { color: colors.textMuted, fontSize: 11 }]}>
              {JSON.stringify(anomaly, null, 2)}
            </Text>
          </View>
        </View>

        {/* Incident Notes History */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Lịch Sử Ghi Chú ({anomaly.incident_notes?.length || 0})
          </Text>
          {anomaly.incident_notes?.length > 0 ? (
            anomaly.incident_notes.map((n, i) => (
              <View key={i} style={[styles.noteItem, { borderBottomColor: colors.borderSubtle }]}>
                <View style={styles.noteMeta}>
                  <Text style={[styles.noteUser, { color: colors.primary }]}>{n.user || 'Người dùng'}</Text>
                  <Text style={[styles.noteTime, { color: colors.textMuted }]}>
                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('vi-VN') : ''}
                  </Text>
                </View>
                <Text style={[styles.noteText, { color: colors.text }]}>{n.note}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>Chưa có ghi chú xử lý nào.</Text>
          )}
        </View>
      </ScrollView>
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
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 12.5,
  },
  value: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  codeBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  noteItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  noteUser: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteTime: {
    fontSize: 10.5,
  },
  noteText: {
    fontSize: 12.5,
  },
  emptyNote: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
});

