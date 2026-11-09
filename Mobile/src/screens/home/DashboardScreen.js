import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Database,
  ShieldAlert,
  Layers,
  Zap,
  RefreshCw,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import KpiCard from '../../components/KpiCard';
import PipelineHealthCard from '../../components/PipelineHealthCard';

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const statsRes = await apiClient('/logs/stats').catch(() => null);
      if (statsRes) setStats(statsRes);

      const healthRes = await apiClient('/pipeline/health').catch(() => null);
      if (healthRes) setHealthData(healthRes);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Dashboard:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Xin chào, {currentUser?.displayName || currentUser?.username}
          </Text>
          <Text style={[styles.roleBadge, { color: currentUser?.role === 'admin' ? colors.primary : colors.secondary }]}>
            {currentUser?.role === 'admin' ? '🛡️ Quản Trị Viên (Admin)' : '👁️ Giám Sát Viên (Viewer)'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.reloadBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
          onPress={onRefresh}
        >
          <RefreshCw size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* KPI Grid (4 ô) */}
        <View style={styles.kpiRow}>
          <KpiCard
            title="Tổng số log"
            value={stats?.total_logs ? stats.total_logs.toLocaleString('vi-VN') : '—'}
            icon={Database}
            color={colors.primary}
            subtitle="24h qua"
          />
          <KpiCard
            title="Sự cố bất thường"
            value={stats?.anomalies_count !== undefined ? stats.anomalies_count.toString() : '—'}
            icon={ShieldAlert}
            color={colors.danger}
            subtitle="Cần kiểm tra"
          />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard
            title="Mẫu Drain"
            value={stats?.templates_count !== undefined ? stats.templates_count.toString() : '—'}
            icon={Layers}
            color={colors.secondary}
            subtitle="Mẫu tự động"
          />
          <KpiCard
            title="Logs/phút"
            value={stats?.ingestion_rate !== undefined ? `${stats.ingestion_rate}` : '—'}
            icon={Zap}
            color={colors.warning}
            subtitle="Tốc độ pipeline"
          />
        </View>

        {/* Pipeline Health Card */}
        <View style={styles.sectionWrapper}>
          <PipelineHealthCard
            healthData={healthData}
            onOpenDetails={() => setHealthModalOpen(true)}
          />
        </View>

        {/* Level Distribution Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Phân Phối Mức Độ Log</Text>
          <View style={styles.levelsRow}>
            {['INFO', 'WARN', 'ERROR', 'FATAL'].map((lvl) => {
              const count = stats?.level_distribution?.[lvl] || 0;
              const lvlColor =
                lvl === 'ERROR' || lvl === 'FATAL'
                  ? colors.danger
                  : lvl === 'WARN'
                  ? colors.warning
                  : colors.primary;

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
      </ScrollView>

      {/* Modal Sức Khỏe Pipeline Chi Tiết */}
      <Modal visible={healthModalOpen} transparent animationType="fade" onRequestClose={() => setHealthModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.modalTitleRow}>
                <Activity size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Chi Tiết Sức Khỏe Pipeline</Text>
              </View>
              <TouchableOpacity onPress={() => setHealthModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>1. Log Collector (Port 4000)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  ● Đang lắng nghe luồng log từ các dịch vụ
                </Text>
              </View>

              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>2. Parser Worker (BullMQ + Redis)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  ● Tự động bóc tách mẫu Drain & phân loại bất thường
                </Text>
              </View>

              <View style={[styles.healthItem, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.healthItemTitle, { color: colors.text }]}>3. OpenSearch Cluster (Port 9200)</Text>
                <Text style={[styles.healthItemStatus, { color: colors.success }]}>
                  ● Chỉ mục logpulse-logs sẵn sàng tìm kiếm tốc độ cao
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
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleBadge: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  sectionWrapper: {
    marginHorizontal: 4,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 4,
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
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  levelCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 18,
    borderWidth: 1,
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
    gap: 10,
    marginBottom: 18,
  },
  healthItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  healthItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  healthItemStatus: {
    fontSize: 11.5,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

