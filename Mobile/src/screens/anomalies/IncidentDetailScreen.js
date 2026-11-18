import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  Server,
  AlertCircle,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Send,
  Eye,
  Check,
  Wrench,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';

const ROOT_CAUSES = [
  'Lỗi Code / Ứng Dụng (Application Bug)',
  'Cơ Sở Dữ Liệu (Database Failure)',
  'Kết Nối Mạng / Timeout (Network / Latency)',
  'Quá Tải Tài Nguyên (CPU/Memory Spike)',
  'Sai Cấu Hình (Misconfiguration)',
  'Báo Động Giả (False Positive)',
];

const ACTIONS_TAKEN = [
  'Đã Khởi Động Lại Dịch Vụ (Restart Service)',
  'Đã Rollback Phiên Bản (Rollback Release)',
  'Đã Mở Rộng Tài Nguyên (Scale CPU/RAM)',
  'Đã Vá Lỗi Nóng (Applied Hotfix)',
  'Đã Bỏ Qua / Thêm Ngoại Lệ (Whitelisted)',
];

const PRIORITIES = [
  { id: 'P1', label: 'P1 - Khẩn cấp', color: '#ef4444' },
  { id: 'P2', label: 'P2 - Nghiêm trọng', color: '#f59e0b' },
  { id: 'P3', label: 'P3 - Trung bình', color: '#3b82f6' },
];

export default function IncidentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const initialAnomaly = route.params?.anomaly || {};
  const [anomaly, setAnomaly] = useState(initialAnomaly);
  const [notes, setNotes] = useState(initialAnomaly.incident_notes || []);

  // Add Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Admin Resolve Modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedRootCause, setSelectedRootCause] = useState(ROOT_CAUSES[0]);
  const [selectedActionTaken, setSelectedActionTaken] = useState(ACTIONS_TAKEN[0]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!anomaly || !anomaly.timestamp) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.text, padding: 20 }}>Không tìm thấy thông tin sự cố.</Text>
      </View>
    );
  }

  const incidentId = anomaly.id || anomaly.hash_id || anomaly._id;
  const status = anomaly.incident_status || 'NEW';
  const priority = anomaly.incident_priority || 'P2';
  const scorePercent = anomaly.anomaly_score ? `${(anomaly.anomaly_score * 100).toFixed(0)}%` : '0%';
  const priorityObj = PRIORITIES.find((p) => p.id === priority) || PRIORITIES[1];

  // Submit Note (Admin or Viewer)
  const handleAddNote = async () => {
    if (!newNoteText.trim() || submittingNote) return;
    setSubmittingNote(true);
    try {
      const res = await apiClient(`/anomalies/${incidentId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          note: newNoteText.trim(),
          type: isAdmin ? 'ADMIN_NOTE' : 'INVESTIGATION',
        }),
      });

      const savedNote = res.note || {
        author: currentUser?.displayName || currentUser?.username || 'Người dùng',
        role: currentUser?.role || 'viewer',
        text: newNoteText.trim(),
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => [...prev, savedNote]);
      setNewNoteText('');
      showToast('Đã thêm ghi chú điều tra sự cố', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi ghi chú', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Admin Acknowledge Incident
  const handleAcknowledge = async () => {
    setUpdatingStatus(true);
    try {
      const res = await apiClient(`/anomalies/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'ACKNOWLEDGED',
          priority: 'P2',
          note: 'Tiếp nhận xử lý sự cố trên Mobile',
        }),
      });

      setAnomaly((prev) => ({
        ...prev,
        incident_status: 'ACKNOWLEDGED',
        acknowledged_by: currentUser?.displayName || currentUser?.username,
      }));
      showToast('Đã tiếp nhận xử lý sự cố', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi khi tiếp nhận', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Admin Confirm Resolve Incident
  const handleConfirmResolve = async () => {
    setUpdatingStatus(true);
    try {
      const res = await apiClient(`/anomalies/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'RESOLVED',
          root_cause: selectedRootCause,
          action_taken: selectedActionTaken,
          priority,
          note: resolutionNote.trim() || `Xử lý xong: ${selectedActionTaken}`,
        }),
      });

      setAnomaly((prev) => ({
        ...prev,
        incident_status: 'RESOLVED',
        root_cause: selectedRootCause,
        action_taken: selectedActionTaken,
        resolved_by: currentUser?.displayName || currentUser?.username,
        resolved_at: new Date().toISOString(),
      }));

      setResolveModalOpen(false);
      showToast('Đã nghiệm thu và giải quyết sự cố', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi khi giải quyết', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Biên Bản Chi Tiết Sự Cố</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Trạng thái hiện tại:</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    status === 'RESOLVED'
                      ? 'rgba(16,185,129,0.15)'
                      : status === 'ACKNOWLEDGED'
                      ? 'rgba(245,158,11,0.15)'
                      : 'rgba(239,68,68,0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      status === 'RESOLVED'
                        ? '#10b981'
                        : status === 'ACKNOWLEDGED'
                        ? '#f59e0b'
                        : '#ef4444',
                  },
                ]}
              >
                {status === 'RESOLVED' ? 'ĐÃ GIẢI QUYẾT' : status === 'ACKNOWLEDGED' ? 'ĐANG XỬ LÝ' : 'MỚI'}
              </Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Độ ưu tiên:</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${priorityObj.color}18` }]}>
              <Text style={[styles.statusText, { color: priorityObj.color }]}>{priorityObj.label}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Độ bất thường (Score):</Text>
            <Text style={[styles.value, { color: colors.danger, fontWeight: '800' }]}>{scorePercent}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Dịch vụ:</Text>
            <Text style={[styles.value, { color: colors.secondary, fontWeight: '700' }]}>
              {anomaly.service || anomaly.service_name || 'Hệ thống'}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Thời gian ghi nhận:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString('vi-VN') : '—'}
            </Text>
          </View>
        </View>

        {/* BIÊN BẢN NGHIỆM THU (Hiển thị cho cả Admin và Viewer) */}
        {(anomaly.root_cause || anomaly.action_taken || status === 'RESOLVED') && (
          <View style={[styles.card, { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)', marginTop: 10 }]}>
            <View style={styles.resolutionHeaderRow}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.resolutionTitle}>Biên Bản Khắc Phục (SRE Resolution)</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.textSecondary }]}>Nguyên nhân:</Text>
              <Text style={[styles.reportVal, { color: colors.text }]}>{anomaly.root_cause || 'Đang cập nhật'}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.textSecondary }]}>Biện pháp:</Text>
              <Text style={[styles.reportVal, { color: colors.text }]}>{anomaly.action_taken || 'Đang cập nhật'}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.textSecondary }]}>Người xử lý:</Text>
              <Text style={[styles.reportVal, { color: colors.primary, fontWeight: '700' }]}>
                {anomaly.resolved_by || anomaly.acknowledged_by || 'Admin'}
              </Text>
            </View>
          </View>
        )}

        {/* ADMIN ACTION BUTTONS (Tiếp nhận / Giải quyết) */}
        {isAdmin && status !== 'RESOLVED' && (
          <View style={[styles.actionPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {status === 'NEW' ? (
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#f59e0b' }]}
                onPress={handleAcknowledge}
                disabled={updatingStatus}
                activeOpacity={0.8}
              >
                <Eye size={15} color="#ffffff" />
                <Text style={styles.btnActionText}>Tiếp Nhận Xử Lý Sự Cố</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#10b981' }]}
                onPress={() => setResolveModalOpen(true)}
                disabled={updatingStatus}
                activeOpacity={0.8}
              >
                <Check size={15} color="#ffffff" />
                <Text style={styles.btnActionText}>Hoàn Tất Biên Bản (Resolve)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Message Log */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Thông Điệp Log Gốc</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.codeText, { color: colors.text }]}>
              {anomaly.message || anomaly.content || '(Trống)'}
            </Text>
          </View>
        </View>

        {/* Incident Notes History (Viewer & Admin) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
          <View style={styles.notesHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Nhật Ký Điều Tra ({notes.length})
            </Text>
            {!isAdmin && (
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                Viewer có thể gửi ghi chú
              </Text>
            )}
          </View>

          {notes.length > 0 ? (
            notes.map((n, i) => {
              const authorName = n.author || n.user || 'Người dùng';
              const isViewer = n.role === 'viewer' || n.type === 'INVESTIGATION';
              const textContent = n.text || n.note || '';

              return (
                <View key={i} style={[styles.noteItem, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={styles.noteMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.noteUser, { color: isViewer ? colors.secondary : colors.primary }]}>
                        {authorName}
                      </Text>
                      <View style={[styles.roleBadgeSmall, { backgroundColor: isViewer ? 'rgba(59,130,246,0.12)' : 'rgba(99,102,241,0.12)' }]}>
                        <Text style={[styles.roleBadgeSmallText, { color: isViewer ? '#3b82f6' : '#6366f1' }]}>
                          {isViewer ? 'Giám sát viên' : 'Quản trị viên'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.noteTime, { color: colors.textMuted }]}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('vi-VN') : ''}
                    </Text>
                  </View>
                  <Text style={[styles.noteText, { color: colors.text }]}>{textContent}</Text>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>Chưa có ghi chú điều tra nào.</Text>
          )}

          {/* Input Add Note */}
          <View style={[styles.addNoteRow, { borderTopColor: colors.borderSubtle }]}>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
              placeholder={isAdmin ? 'Thêm ghi chú xử lý...' : 'Ghi chú điều tra / manh mối lỗi (Viewer)...'}
              placeholderTextColor={colors.textMuted}
              value={newNoteText}
              onChangeText={setNewNoteText}
            />
            <TouchableOpacity
              style={[styles.btnSendNote, { backgroundColor: colors.primary }]}
              onPress={handleAddNote}
              disabled={submittingNote || !newNoteText.trim()}
              activeOpacity={0.8}
            >
              <Send size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL HOÀN TẤT BIÊN BẢN (ADMIN RESOLVE MODAL) */}
      <Modal visible={resolveModalOpen} transparent animationType="slide" onRequestClose={() => setResolveModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Wrench size={16} color="#10b981" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Hoàn Tất Biên Bản Sự Cố</Text>
              </View>
              <TouchableOpacity onPress={() => setResolveModalOpen(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Nguyên nhân gốc rễ (Root Cause):</Text>
              <View style={styles.radioGroup}>
                {ROOT_CAUSES.map((rc, idx) => {
                  const isSelected = selectedRootCause === rc;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: isSelected ? 'rgba(99,102,241,0.15)' : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setSelectedRootCause(rc)}
                    >
                      <Text style={[styles.choiceText, { color: isSelected ? colors.primary : colors.text }]}>
                        {rc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                Biện pháp đã khắc phục (Action Taken):
              </Text>
              <View style={styles.radioGroup}>
                {ACTIONS_TAKEN.map((act, idx) => {
                  const isSelected = selectedActionTaken === act;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: isSelected ? 'rgba(16,185,129,0.15)' : colors.surfaceVariant,
                          borderColor: isSelected ? '#10b981' : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setSelectedActionTaken(act)}
                    >
                      <Text style={[styles.choiceText, { color: isSelected ? '#10b981' : colors.text }]}>
                        {act}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                Ghi chú nghiệm thu bổ sung:
              </Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle, color: colors.text }]}
                placeholder="Ghi chú chi tiết về việc khắc phục..."
                placeholderTextColor={colors.textMuted}
                value={resolutionNote}
                onChangeText={setResolutionNote}
              />

              <TouchableOpacity
                style={[styles.btnConfirmResolve, { backgroundColor: '#10b981', marginTop: 16 }]}
                onPress={handleConfirmResolve}
                disabled={updatingStatus}
                activeOpacity={0.8}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.btnConfirmResolveText}>Lưu & Đóng Sự Cố</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 12.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  resolutionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  reportLabel: {
    fontSize: 11.5,
  },
  reportVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionPanel: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  codeBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 11.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  noteUser: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleBadgeSmall: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeSmallText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  noteTime: {
    fontSize: 10,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyNote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  noteInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
  },
  btnSendNote: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalFieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  radioGroup: {
    gap: 5,
  },
  choicePill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  choiceText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalTextInput: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
  },
  btnConfirmResolve: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  btnConfirmResolveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
