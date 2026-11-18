import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Database,
  AlertTriangle,
  Layers,
  Zap,
  RefreshCw,
  Activity,
  X,
  FileText,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import KpiCard from '../../components/KpiCard';
import PipelineHealthCard from '../../components/PipelineHealthCard';

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const scrollViewRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [kpi, setKpi] = useState(null);
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchDashboardData = useCallback(async (isUserAction = false) => {
    try {
      if (isUserAction) {
        showToast('Đang làm mới dữ liệu hệ thống...', 'info');
      }

      const [kpiRes, statsRes, healthRes, logsRes] = await Promise.all([
        apiClient('/stats/kpi').catch(() => null),
        apiClient('/logs/stats').catch(() => null),
        apiClient('/pipeline/health').catch(() => null),
        apiClient('/logs/search?size=15').catch(() => null),
      ]);

      if (kpiRes) setKpi(kpiRes);
      if (statsRes) setStats(statsRes);
      if (healthRes) setHealthData(healthRes);
      if (logsRes?.logs) setRecentLogs(logsRes.logs);

      if (isUserAction) {
        showToast('Đã làm mới dữ liệu thành công', 'success');
      }
    } catch (err) {
      if (isUserAction) {
        showToast('Lỗi khi tải dữ liệu từ máy chủ', 'error');
      }
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(true);
    setRefreshing(false);
  };

  // Tính throughput logs/phút từ over_time hoặc kpi
  const getLogsPerMinute = () => {
    if (stats?.over_time && stats.over_time.length > 0) {
      const lastPoint = stats.over_time[stats.over_time.length - 1];
      return `${lastPoint.logs}`;
    }
    if (kpi?.total_logs_24h) {
      const avg = Math.round(kpi.total_logs_24h / (24 * 60));
      return `${avg}`;
    }
    return '0';
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'FATAL':
        return '#dc2626';
      case 'ERROR':
        return '#ef4444';
      case 'WARN':
        return '#f59e0b';
      case 'INFO':
      default:
        return '#3b82f6';
    }
  };

  const formatLogTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Xin chào, {currentUser?.displayName || currentUser?.username || 'Quản trị viên'}
          </Text>
          <View style={styles.roleRow}>
            {currentUser?.role === 'admin' ? (
              <ShieldCheck size={14} color={colors.primary} />
            ) : (
              <User size={14} color={colors.textSecondary} />
            )}
            <Text
              style={[
                styles.roleBadge,
                { color: currentUser?.role === 'admin' ? colors.primary : colors.textSecondary },
              ]}
            >
              {currentUser?.role === 'admin' ? 'Quản Trị Viên (Admin)' : 'Giám Sát Viên (Viewer)'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.reloadBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
          onPress={() => fetchDashboardData(true)}
          activeOpacity={0.7}
        >
          <RefreshCw size={15} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* KPI Grid (4 ô có thể ấn để chuyển tab) */}
        <View style={styles.kpiRow}>
          <KpiCard
            title="Tổng số log"
            value={kpi?.total_logs_24h !== undefined ? kpi.total_logs_24h.toLocaleString('vi-VN') : '0'}
            icon={Database}
            color={colors.primary}
            subtitle="24h qua • Bấm tra cứu"
            onPress={() => navigation.navigate('QuickAction')}
          />
          <KpiCard
            title="Sự cố bất thường"
            value={kpi?.anomaly_count_1h !== undefined ? kpi.anomaly_count_1h.toString() : '0'}
            icon={AlertTriangle}
            color={colors.danger}
            subtitle="1 giờ qua • Bấm xem"
            onPress={() => navigation.navigate('Anomalies')}
          />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard
            title="Mẫu Drain"
            value={kpi?.template_count !== undefined ? kpi.template_count.toString() : '0'}
            icon={Layers}
            color={colors.secondary}
            subtitle="Tự động tách • Bấm xem"
            onPress={() => navigation.navigate('Templates')}
          />
          <KpiCard
            title="Logs/phút"
            value={getLogsPerMinute()}
            icon={Zap}
            color={colors.warning}
            subtitle="Tốc độ pipeline • Xem log"
            onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* Pipeline Health Card */}
        <View style={styles.sectionMargin}>
          <PipelineHealthCard
            healthData={healthData}
            onOpenDetails={() => setHealthModalOpen(true)}
          />
        </View>

        {/* Level Distribution Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Phân Phối Mức Độ Log (24h)</Text>
          <View style={styles.levelsRow}>
            {['INFO', 'WARN', 'ERROR', 'FATAL'].map((lvl) => {
              const count =
                stats?.by_level?.find((b) => b.level === lvl)?.count ||
                (lvl === 'FATAL' && kpi?.fatal_count_1h ? kpi.fatal_count_1h : 0);
              const lvlColor = getLevelColor(lvl);

              return (
                <View
                  key={lvl}
                  style={[
                    styles.levelBox,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Text style={[styles.levelLabel, { color: lvlColor }]}>{lvl}</Text>
                  <Text style={[styles.levelCount, { color: colors.text }]}>
                    {count.toLocaleString('vi-VN')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bảng Danh Sách Luồng Log Thời Gian Thực (Full Width) */}
        <View style={[styles.logStreamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.logStreamHeader}>
            <View style={styles.titleWithIcon}>
              <FileText size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Luồng Log Thời Gian Thực
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('QuickAction')}
              activeOpacity={0.7}
              style={[styles.viewAllBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {recentLogs.length === 0 ? (
            <View style={styles.emptyLogsBox}>
              <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
                Chưa có log mới nào được ghi nhận.
              </Text>
            </View>
          ) : (
            <View style={styles.logsTable}>
              {recentLogs.slice(0, 10).map((log, index) => {
                const lvlColor = getLevelColor(log.level);
                return (
                  <TouchableOpacity
                    key={log.id || `log-${index}`}
                    style={[
                      styles.logRow,
                      {
                        borderBottomColor: colors.borderSubtle,
                        backgroundColor: index % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      },
                    ]}
                    onPress={() => setSelectedLog(log)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.logRowTop}>
                      <View style={[styles.badgePill, { backgroundColor: `${lvlColor}18`, borderColor: `${lvlColor}40` }]}>
                        <Text style={[styles.badgeText, { color: lvlColor }]}>{log.level || 'INFO'}</Text>
                      </View>
                      <Text style={[styles.serviceNameText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {log.service_name || log.service || 'unknown-service'}
                      </Text>
                      <View style={styles.timeWrapper}>
                        <Clock size={11} color={colors.textMuted} />
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
                          {formatLogTime(log.timestamp)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={2}>
                      {log.message || log.drain_template || '(Trống)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Chi Tiết Một Log */}
      <Modal visible={!!selectedLog} transparent animationType="fade" onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chi Tiết Log Entry</Text>
              <TouchableOpacity onPress={() => setSelectedLog(null)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedLog && (
              <ScrollView style={{ maxHeight: 360 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Mức độ:</Text>
                  <Text style={[styles.detailVal, { color: getLevelColor(selectedLog.level), fontWeight: '700' }]}>
                    {selectedLog.level}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dịch vụ:</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {selectedLog.service_name || selectedLog.service || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Thời gian:</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>{selectedLog.timestamp}</Text>
                </View>
                {selectedLog.drain_template ? (
                  <View style={styles.detailBlock}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Drain Template:</Text>
                    <Text style={[styles.detailCode, { backgroundColor: colors.surfaceVariant, color: colors.primary }]}>
                      {selectedLog.drain_template}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Nội dung log:</Text>
                  <Text style={[styles.detailCode, { backgroundColor: colors.surfaceVariant, color: colors.text }]}>
                    {selectedLog.message}
                  </Text>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
              onPress={() => setSelectedLog(null)}
            >
              <Text style={styles.closeModalBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Sức Khỏe Pipeline Chi Tiết */}
      <Modal visible={healthModalOpen} transparent animationType="fade" onRequestClose={() => setHealthModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.modalTitleRow}>
                <Activity size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Sức Khỏe Pipeline</Text>
              </View>
              <TouchableOpacity onPress={() => setHealthModalOpen(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>1. Log Collector (Port 4000)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  • Hoạt động bình thường — Tiếp nhận HTTP & TCP streams
                </Text>
              </View>

              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>2. Parser Worker (BullMQ + Redis)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  • Đang chạy bóc tách Drain & tính điểm bất thường
                </Text>
              </View>

              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>3. OpenSearch Cluster (Port 9200)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  • Chỉ mục logpulse-logs sẵn sàng tìm kiếm tốc độ cao
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setHealthModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Đóng</Text>
            </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  roleBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  reloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 90,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  sectionMargin: {
    marginVertical: 4,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  levelCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  logStreamCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  logStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyLogsBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 12.5,
  },
  logsTable: {
    width: '100%',
  },
  logRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  serviceNameText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10.5,
  },
  logMessage: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
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
  modalBody: {
    gap: 10,
    marginBottom: 16,
  },
  healthItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  healthItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  healthItemStatus: {
    fontSize: 11.5,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
  },
  detailBlock: {
    marginTop: 8,
  },
  detailCode: {
    marginTop: 4,
    padding: 8,
    borderRadius: 6,
    fontSize: 11.5,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
