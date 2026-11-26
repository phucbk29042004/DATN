import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, AlertCircle, Eye, Check, FileText } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function AnomalyCard({ item, isAdmin = false, onUpdateStatus, onAddNote, onPress }) {
  const { colors } = useTheme();

  const status = item.incident_status || 'NEW';
  const scorePercent = item.anomaly_score ? `${(item.anomaly_score * 100).toFixed(0)}%` : '0%';
  const serviceName = item.service || item.service_name || 'Hệ thống';
  const level = (item.level || 'INFO').toUpperCase();

  const getStatusBadge = () => {
    if (status === 'RESOLVED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
          <CheckCircle2 size={11} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>ĐÃ XỬ LÝ</Text>
        </View>
      );
    }
    if (status === 'ACKNOWLEDGED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <Clock size={11} color={colors.warning} />
          <Text style={[styles.statusText, { color: colors.warning }]}>ĐÃ TIẾP NHẬN</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
        <AlertCircle size={11} color={colors.danger} />
        <Text style={[styles.statusText, { color: colors.danger }]}>MỚI</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
    >
      {/* Header: Service + Level + Score */}
      <View style={styles.headerRow}>
        <View style={styles.serviceRow}>
          <Text style={[styles.serviceText, { color: colors.link || colors.primary }]} numberOfLines={1}>
            {serviceName}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: level === 'ERROR' || level === 'FATAL' ? colors.dangerLight : colors.primaryLight }]}>
            <Text style={[styles.levelText, { color: level === 'ERROR' || level === 'FATAL' ? colors.danger : colors.primary }]}>
              {level}
            </Text>
          </View>
          {(item.incident_priority || item.priority) && (
            <View style={[
              styles.priorityBadge,
              {
                backgroundColor: (item.incident_priority || item.priority) === 'P1'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : (item.incident_priority || item.priority) === 'P2'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
                borderColor: (item.incident_priority || item.priority) === 'P1'
                  ? '#ef4444'
                  : (item.incident_priority || item.priority) === 'P2'
                  ? '#f59e0b'
                  : '#3b82f6',
              }
            ]}>
              <Text style={[
                styles.priorityText,
                {
                  color: (item.incident_priority || item.priority) === 'P1'
                    ? '#ef4444'
                    : (item.incident_priority || item.priority) === 'P2'
                    ? '#f59e0b'
                    : '#3b82f6',
                }
              ]}>
                {item.incident_priority || item.priority}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.scoreText, { color: colors.danger }]}>
          {scorePercent}
        </Text>
      </View>

      {/* Message */}
      <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={2}>
        {item.message || item.content || 'Không có nội dung log'}
      </Text>

      {/* Timestamp */}
      <Text style={[styles.timeText, { color: colors.textMuted }]}>
        {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : '—'}
      </Text>

      {/* Actions Row (Căn ngang chuẩn chỉnh) */}
      <View style={[styles.actionsRow, { borderTopColor: colors.borderSubtle }]}>
        {/* Status Badge */}
        {getStatusBadge()}

        {/* Action Button (Chỉ Admin mới được phép Tiếp nhận / Xử lý) */}
        {isAdmin && status === 'NEW' && (
          <TouchableOpacity
            style={[styles.btnAction, { borderColor: colors.warning }]}
            onPress={() => onUpdateStatus(item.id || item.hash_id, 'ACKNOWLEDGED', item)}
          >
            <Eye size={12} color={colors.warning} />
            <Text style={[styles.btnActionText, { color: colors.warning }]}>Tiếp nhận</Text>
          </TouchableOpacity>
        )}

        {isAdmin && status === 'ACKNOWLEDGED' && (
          <TouchableOpacity
            style={[styles.btnAction, { borderColor: colors.success }]}
            onPress={() => onUpdateStatus(item.id || item.hash_id, 'RESOLVED', item)}
          >
            <Check size={12} color={colors.success} />
            <Text style={[styles.btnActionText, { color: colors.success }]}>Xử lý xong</Text>
          </TouchableOpacity>
        )}

        {/* Note Button */}
        <TouchableOpacity
          style={[styles.btnAction, { borderColor: colors.border }]}
          onPress={() => onAddNote(item)}
        >
          <FileText size={12} color={colors.textSecondary} />
          <Text style={[styles.btnActionText, { color: colors.textSecondary }]}>
            Ghi chú {item.incident_notes?.length > 0 ? `(${item.incident_notes.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle if resolved */}
      {(item.resolved_by || item.acknowledged_by) && (
        <Text style={[styles.resolvedByText, { color: colors.textMuted }]}>
          {item.resolved_by ? `Đã xử lý bởi: ${item.resolved_by}` : `Đang tiếp nhận: ${item.acknowledged_by}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 5,
    marginHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 17,
    marginVertical: 4,
  },
  timeText: {
    fontSize: 11,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    flexWrap: 'nowrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnActionText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  resolvedByText: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

