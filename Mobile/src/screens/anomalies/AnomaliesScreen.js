import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Filter,
  Plus,
  X,
  BarChart2,
  ListFilter,
  Database,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Calendar,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import AnomalyCard from '../../components/AnomalyCard';

const LEVEL_COLORS = {
  INFO: '#3b82f6',
  WARN: '#f59e0b',
  ERROR: '#ef4444',
  FATAL: '#dc2626',
};

const LEVEL_NAMES_VI = {
  INFO: 'Thông tin',
  WARN: 'Cảnh báo',
  ERROR: 'Lỗi',
  FATAL: 'Nghiêm trọng',
};

export default function AnomaliesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuth();

  // Sub-Tab Switcher: 'list' | 'charts'
  const [subTab, setSubTab] = useState('list');

  // List State
  const [filter, setFilter] = useState('ALL');
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Note Modal State
  const [noteModalItem, setNoteModalItem] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Analytics Tab State
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('1h');
  const [analyticsService, setAnalyticsService] = useState('');
  const [analyticsLevel, setAnalyticsLevel] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Fetch Anomalies List ──
  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await apiClient('/anomalies');
      setAnomalies(data?.anomalies || []);
    } catch (err) {
      console.warn('Lỗi tải danh sách sự cố:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Fetch Analytics Data ──
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const rangeMap = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
      const ms = rangeMap[analyticsTimeRange] || 3600000;
      const from = new Date(Date.now() - ms).toISOString();
      const to = new Date().toISOString();
      let endpoint = `/anomalies/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      if (analyticsService) endpoint += `&service=${encodeURIComponent(analyticsService)}`;
      if (analyticsLevel) endpoint += `&level=${encodeURIComponent(analyticsLevel)}`;

      const data = await apiClient(endpoint);
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu phân tích:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsTimeRange, analyticsService, analyticsLevel]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  useEffect(() => {
    if (subTab === 'charts') {
      fetchAnalytics();
    }
  }, [subTab, fetchAnalytics]);

  const onRefreshList = () => {
    setRefreshing(true);
    fetchAnomalies();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient(`/anomalies/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          user: currentUser?.displayName || currentUser?.username || 'Người dùng',
        }),
      });

      setAnomalies((prev) =>
        prev.map((item) =>
          item.id === id || item.hash_id === id
            ? {
                ...item,
                incident_status: newStatus,
                ...(newStatus === 'RESOLVED' ? { resolved_by: currentUser?.displayName } : {}),
                ...(newStatus === 'ACKNOWLEDGED' ? { acknowledged_by: currentUser?.displayName } : {}),
              }
            : item
        )
      );
      Alert.alert('Thành công', `Đã cập nhật trạng thái sự cố sang: ${newStatus}`);
    } catch (err) {
      Alert.alert('Lỗi cập nhật', err.message);
    }
  };

  const handleAddNoteSubmit = async () => {
    if (!noteText.trim() || !noteModalItem) return;
    setSubmittingNote(true);
    try {
      const id = noteModalItem.id || noteModalItem.hash_id;
      await apiClient(`/anomalies/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          note: noteText.trim(),
          user: currentUser?.displayName || currentUser?.username || 'Người dùng',
        }),
      });

      Alert.alert('Thành công', 'Đã lưu ghi chú xử lý sự cố.');
      setNoteModalItem(null);
      setNoteText('');
      fetchAnomalies();
    } catch (err) {
      Alert.alert('Lỗi ghi chú', err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const filteredList = anomalies.filter((a) => {
    if (filter === 'ALL') return true;
    return (a.incident_status || 'NEW') === filter;
  });

  const filterButtons = [
    { key: 'ALL', label: 'TẤT CẢ' },
    { key: 'NEW', label: 'MỚI' },
    { key: 'ACKNOWLEDGED', label: 'TIẾP NHẬN' },
    { key: 'RESOLVED', label: 'ĐÃ XỬ LÝ' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.titleRow}>
          <AlertTriangle size={20} color={colors.danger} />
          <Text style={[styles.title, { color: colors.text }]}>Sự Cố Bất Thường</Text>
        </View>
        <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
          {anomalies.length} sự cố
        </Text>
      </View>

      {/* Sub-Tab Navigation Switcher */}
      <View style={[styles.subTabBarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={[styles.subTabBarPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.subTabButton,
              subTab === 'list' && { backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 4 },
            ]}
            onPress={() => setSubTab('list')}
            activeOpacity={0.8}
          >
            <ListFilter size={14} color={subTab === 'list' ? '#ffffff' : colors.textSecondary} />
            <Text
              style={[
                styles.subTabText,
                { color: subTab === 'list' ? '#ffffff' : colors.textSecondary, fontWeight: subTab === 'list' ? '700' : '500' },
              ]}
            >
              Danh Sách Sự Cố
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabButton,
              subTab === 'charts' && { backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 4 },
            ]}
            onPress={() => setSubTab('charts')}
            activeOpacity={0.8}
          >
            <BarChart2 size={14} color={subTab === 'charts' ? '#ffffff' : colors.textSecondary} />
            <Text
              style={[
                styles.subTabText,
                { color: subTab === 'charts' ? '#ffffff' : colors.textSecondary, fontWeight: subTab === 'charts' ? '700' : '500' },
              ]}
            >
              Biểu Đồ Phân Tích
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SUB-TAB 1: DANH SÁCH (LIST) ── */}
      {subTab === 'list' && (
        <>
          {/* Status Filter Buttons */}
          <View style={[styles.filterBar, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
            {filterButtons.map((btn) => {
              const isSelected = filter === btn.key;
              return (
                <TouchableOpacity
                  key={btn.key}
                  onPress={() => setFilter(btn.key)}
                  style={[
                    styles.filterTab,
                    isSelected && {
                      backgroundColor: btn.key === 'RESOLVED' ? colors.successLight : colors.primaryLight,
                      borderColor: btn.key === 'RESOLVED' ? colors.success : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: isSelected
                          ? btn.key === 'RESOLVED'
                            ? colors.success
                            : colors.primary
                          : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Đang tải danh sách sự cố...
              </Text>
            </View>
          ) : filteredList.length === 0 ? (
            <View style={styles.centerContainer}>
              <AlertTriangle size={42} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Không có sự cố nào</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Bộ lọc "{filter}" hiện không có dữ liệu cần xử lý.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredList}
              keyExtractor={(item, index) => item.id || item.hash_id || index.toString()}
              renderItem={({ item }) => (
                <AnomalyCard
                  item={item}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNote={(it) => setNoteModalItem(it)}
                  onPress={() => navigation.navigate('IncidentDetail', { anomaly: item })}
                />
              )}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: 110 }}
              refreshing={refreshing}
              onRefresh={onRefreshList}
            />
          )}
        </>
      )}

      {/* ── SUB-TAB 2: BIỂU ĐỒ PHÂN TÍCH (ANALYTICS) ── */}
      {subTab === 'charts' && (
        <ScrollView
          style={styles.chartsScroll}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HÀNG 1: Bộ Lọc Chung */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.filterSectionHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Bộ Lọc Phân Tích</Text>
              <TouchableOpacity
                onPress={fetchAnalytics}
                disabled={analyticsLoading}
                style={[styles.smallRefreshBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <RefreshCw size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time range pills */}
            <View style={styles.timePillsRow}>
              {['1h', '6h', '24h', '7d'].map((r) => {
                const isActive = analyticsTimeRange === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setAnalyticsTimeRange(r)}
                    style={[
                      styles.timePill,
                      isActive
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePillText,
                        { color: isActive ? '#ffffff' : colors.textSecondary, fontWeight: isActive ? '700' : '500' },
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Level filter chips */}
            <View style={styles.chipsRow}>
              {['ALL', 'INFO', 'WARN', 'ERROR', 'FATAL'].map((lvl) => {
                const isSelected = (lvl === 'ALL' && !analyticsLevel) || analyticsLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setAnalyticsLevel(lvl === 'ALL' ? '' : lvl)}
                    style={[
                      styles.chip,
                      isSelected
                        ? { backgroundColor: lvl === 'ERROR' || lvl === 'FATAL' ? colors.dangerLight : colors.primaryLight, borderColor: lvl === 'ERROR' || lvl === 'FATAL' ? colors.danger : colors.primary }
                        : { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? (lvl === 'ERROR' || lvl === 'FATAL' ? colors.danger : colors.primary) : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cross-filter badge (if active) */}
            {analyticsService ? (
              <View style={styles.activeFilterRow}>
                <Text style={[styles.filterSubLabel, { color: colors.textSecondary }]}>Lọc theo dịch vụ:</Text>
                <TouchableOpacity
                  style={[styles.serviceFilterBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setAnalyticsService('')}
                >
                  <Text style={[styles.serviceFilterText, { color: colors.primary }]}>{analyticsService}</Text>
                  <X size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* 4 THẺ KPI (Grid 2x2) */}
          {(() => {
            const kpi = analyticsData?.kpi;
            const totalLogs = kpi?.total_logs ?? 0;
            const errorCount = kpi?.error_count ?? kpi?.error_fatal_count ?? 0;
            const anomalyCount = kpi?.anomaly_count ?? 0;
            const throughput = kpi?.throughput != null ? kpi.throughput.toFixed(1) : '0.0';
            const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : '0.0';

            return (
              <View style={styles.kpiGrid}>
                {/* KPI 1: Tổng Log */}
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Tổng Số Log</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                      <Database size={15} color="#6366f1" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>
                    {analyticsLoading ? '...' : totalLogs.toLocaleString()}
                  </Text>
                  <Text style={[styles.kpiSubText, { color: colors.textMuted }]}>Khung {analyticsTimeRange} gần nhất</Text>
                </View>

                {/* KPI 2: Log Lỗi ERROR/FATAL */}
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>ERROR / FATAL</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                      <AlertTriangle size={15} color="#ef4444" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.danger }]}>
                    {analyticsLoading ? '...' : errorCount.toLocaleString()}
                  </Text>
                  <Text style={[styles.kpiSubText, { color: errorCount > 0 ? colors.danger : colors.textMuted }]}>
                    {errorRate}% tổng số log
                  </Text>
                </View>

                {/* KPI 3: Bất Thường Phát Hiện */}
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Bất Thường</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                      <ShieldAlert size={15} color="#f59e0b" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
                    {analyticsLoading ? '...' : anomalyCount.toLocaleString()}
                  </Text>
                  <Text style={[styles.kpiSubText, { color: anomalyCount > 0 ? '#f59e0b' : colors.textMuted }]}>
                    {anomalyCount > 0 ? 'Ngưỡng > 70%' : 'Không có sự cố'}
                  </Text>
                </View>

                {/* KPI 4: Thông Lượng Logs/s */}
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Logs / Giây</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                      <Zap size={15} color="#10b981" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.success }]}>
                    {analyticsLoading ? '...' : throughput}
                  </Text>
                  <Text style={[styles.kpiSubText, { color: colors.textMuted }]}>Tốc độ trung bình</Text>
                </View>
              </View>
            );
          })()}

          {/* HÀNG 2: Timeline Log Theo Thời Gian */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Activity size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Lượng Log & Bất Thường Theo Thời Gian</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : analyticsData?.timeline && analyticsData.timeline.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {analyticsData.timeline.slice(-8).map((point, idx) => {
                  const maxLogs = Math.max(...analyticsData.timeline.map((p) => p.total || 1), 1);
                  const total = point.total || 0;
                  const ratio = Math.min(total / maxLogs, 1);
                  const hasAnomaly = (point.anomaly_count || 0) > 0;

                  return (
                    <View key={idx} style={styles.timelineRow}>
                      <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>{point.time}</Text>
                      <View style={[styles.timelineBarTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.timelineBarFill, { width: `${Math.max(ratio * 100, 6)}%`, backgroundColor: hasAnomaly ? colors.danger : colors.primary }]} />
                      </View>
                      <Text style={[styles.timelineTotal, { color: colors.text }]}>{total}</Text>
                      {hasAnomaly && (
                        <View style={styles.anomalyDotBadge}>
                          <Text style={styles.anomalyDotText}>🚨 {point.anomaly_count}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Chưa có dữ liệu timeline trong khung giờ này</Text>
            )}
          </View>

          {/* HÀNG 3a: Phân Bố Theo Mức Độ */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <ShieldAlert size={16} color={colors.danger} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Phân Bố Mức Độ Nghiêm Trọng</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (analyticsData?.levelDistribution || analyticsData?.level_distribution || []).length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {(analyticsData?.levelDistribution || analyticsData?.level_distribution || []).map((item, idx) => {
                  const total = (analyticsData?.levelDistribution || analyticsData?.level_distribution || []).reduce((acc, cur) => acc + (cur.value || 0), 0) || 1;
                  const pct = ((item.value / total) * 100).toFixed(1);
                  const color = LEVEL_COLORS[item.name] || colors.primary;

                  return (
                    <View key={idx} style={styles.levelProgressRow}>
                      <View style={styles.levelLabelGroup}>
                        <View style={[styles.levelColorDot, { backgroundColor: color }]} />
                        <Text style={[styles.levelName, { color: colors.text }]}>{LEVEL_NAMES_VI[item.name] || item.name}</Text>
                      </View>
                      <View style={[styles.levelBarTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.levelBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={[styles.levelValue, { color: colors.textSecondary }]}>{item.value} ({pct}%)</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Chưa có phân bố log</Text>
            )}
          </View>

          {/* HÀNG 3b: Top Dịch Vụ Nhiều Lỗi Nhất (Click để lọc chéo) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Database size={16} color={colors.secondary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Dịch Vụ Nào Lỗi Nhiều Nhất?</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (analyticsData?.topErrorServices || analyticsData?.top_services || []).length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {(analyticsData?.topErrorServices || analyticsData?.top_services || []).slice(0, 5).map((svc, idx) => {
                  const maxCount = Math.max(...(analyticsData?.topErrorServices || analyticsData?.top_services || []).map((s) => s.count || 1), 1);
                  const pct = ((svc.count / maxCount) * 100).toFixed(0);

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.serviceRow, analyticsService === svc.service && { backgroundColor: colors.primaryLight, borderRadius: 8 }]}
                      onPress={() => setAnalyticsService(analyticsService === svc.service ? '' : svc.service)}
                    >
                      <Text style={[styles.serviceName, { color: colors.text }]}>{svc.service}</Text>
                      <View style={[styles.serviceBarTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.serviceBarFill, { width: `${pct}%`, backgroundColor: colors.danger }]} />
                      </View>
                      <Text style={[styles.serviceCount, { color: colors.danger }]}>{svc.count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Không có dịch vụ nào phát sinh lỗi</Text>
            )}
          </View>

          {/* HÀNG 3c: Diễn Biến Điểm Bất Thường */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, overflow: 'hidden' }]}>
            <View style={styles.cardHeader}>
              <TrendingUp size={16} color="#f59e0b" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Điểm Bất Thường</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (analyticsData?.anomalyScores || analyticsData?.score_timeline || []).length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {(analyticsData?.anomalyScores || analyticsData?.score_timeline || []).slice(-6).map((item, idx) => {
                  const score = item.score ?? 0;
                  const pct = Math.min(Math.round(score * 100), 100);
                  const isHigh = score >= 0.7;

                  return (
                    <View key={idx} style={styles.scoreRow}>
                      <Text style={[styles.scoreTime, { color: colors.textSecondary }]}>{item.time || item.timestamp?.slice(11, 16)}</Text>
                      <Text style={[styles.scoreService, { color: colors.text }]} numberOfLines={1}>{item.service || 'unknown'}</Text>
                      <View style={[styles.scoreTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.scoreFill, { width: `${pct}%`, backgroundColor: isHigh ? colors.danger : '#f59e0b' }]} />
                        <View style={styles.thresholdMarker} />
                      </View>
                      <Text style={[styles.scoreText, { color: isHigh ? colors.danger : '#f59e0b' }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Không có điểm bất thường nào ghi nhận</Text>
            )}
          </View>

          {/* HÀNG 4a: Heatmap Giờ × Ngày (Cuộn Ngang) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Calendar size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mật Độ Lỗi Theo Khung Giờ (Heatmap)</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : analyticsData?.heatmap && analyticsData.heatmap.length > 0 ? (
              (() => {
                const dates = [...new Set(analyticsData.heatmap.map((h) => h.date))].sort().reverse();
                const hours = Array.from({ length: 24 }, (_, i) => i);
                const heatmapMap = {};
                let maxCount = 1;
                analyticsData.heatmap.forEach((h) => {
                  const key = `${h.date}-${h.hour}`;
                  heatmapMap[key] = h.count;
                  if (h.count > maxCount) maxCount = h.count;
                });

                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginTop: 8 }}>
                    <View style={{ minWidth: 640 }}>
                      {/* Hours header row */}
                      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4, alignItems: 'center' }}>
                        <Text style={{ width: 56, fontSize: 10, fontWeight: '600', color: colors.textMuted }}>
                          Ngày \ Giờ
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 3 }}>
                          {hours.map((h) => (
                            <Text key={h} style={{ width: 22, textAlign: 'center', fontSize: 9, color: colors.textMuted }}>
                              {String(h).padStart(2, '0')}
                            </Text>
                          ))}
                        </View>
                      </View>

                      {/* Date rows */}
                      {dates.map((date) => (
                        <View key={date} style={{ flexDirection: 'row', gap: 3, alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ width: 56, fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>
                            {date}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 3 }}>
                            {hours.map((h) => {
                              const count = heatmapMap[`${date}-${h}`] || 0;
                              const intensity = count / maxCount;
                              let bg = colors.surfaceVariant;
                              if (count > 0) {
                                if (intensity < 0.25) bg = 'rgba(245,158,11,0.25)';
                                else if (intensity < 0.5) bg = 'rgba(245,158,11,0.5)';
                                else if (intensity < 0.75) bg = 'rgba(239,68,68,0.55)';
                                else bg = 'rgba(220,38,38,0.85)';
                              }
                              return (
                                <View key={h} style={[styles.heatmapCellCompact, { backgroundColor: bg }]}>
                                  <Text style={{ fontSize: 8, fontWeight: '700', color: count > 0 ? '#ffffff' : colors.textMuted }}>
                                    {count > 0 ? count : ''}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ))}

                      {/* Legend footer */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>Ít lỗi</Text>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.surfaceVariant }} />
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(245,158,11,0.3)' }} />
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.55)' }} />
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(220,38,38,0.85)' }} />
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>Nhiều lỗi</Text>
                      </View>
                    </View>
                  </ScrollView>
                );
              })()
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Chưa có dữ liệu heatmap khung giờ</Text>
            )}
          </View>

          {/* HÀNG 4b: Top Template Log (Drain Mining) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Layers size={16} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Top Mẫu Log (Drain Mining)</Text>
            </View>
            {analyticsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (analyticsData?.topTemplates || analyticsData?.top_templates || []).length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {(analyticsData?.topTemplates || analyticsData?.top_templates || []).slice(0, 5).map((tpl, idx) => (
                  <View key={idx} style={[styles.templateCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
                    <View style={styles.templateHeader}>
                      <Text style={[styles.templateId, { color: colors.primary }]}>{tpl.template_id || `T${idx + 1}`}</Text>
                      <View style={[styles.templateBadge, { backgroundColor: LEVEL_COLORS[tpl.level] || colors.primary }]}>
                        <Text style={styles.templateBadgeText}>{tpl.level || 'INFO'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.templateText, { color: colors.text }]} numberOfLines={2}>
                      {tpl.template}
                    </Text>
                    <Text style={[styles.templateCount, { color: colors.textSecondary }]}>
                      Xuất hiện: <Text style={{ fontWeight: '700', color: colors.text }}>{(tpl.count || 0).toLocaleString()}</Text> lần
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Chưa có dữ liệu template mining</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Note Modal */}
      <Modal visible={!!noteModalItem} transparent animationType="fade" onRequestClose={() => setNoteModalItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm Ghi Chú Xử Lý</Text>
              <TouchableOpacity onPress={() => setNoteModalItem(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
              placeholder="Nhập nội dung biên bản xử lý, nguyên nhân hoặc hành động khắc phục..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity
              style={[styles.btnSubmitNote, { backgroundColor: colors.primary }]}
              onPress={handleAddNoteSubmit}
              disabled={submittingNote || !noteText.trim()}
            >
              {submittingNote ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnSubmitNoteText}>Lưu Ghi Chú</Text>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    fontSize: 12,
  },
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  subTabBarContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subTabBarPill: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    gap: 6,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  subTabText: {
    fontSize: 12,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartsScroll: {
    flex: 1,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smallRefreshBtn: {
    padding: 6,
    borderRadius: 6,
  },
  timePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timePillText: {
    fontSize: 11,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  filterSubLabel: {
    fontSize: 11,
  },
  serviceFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  serviceFilterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: (Dimensions.get('window').width - 34) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  kpiSubText: {
    fontSize: 10,
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 11,
    width: 44,
  },
  timelineBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timelineBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timelineTotal: {
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
  anomalyDotBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anomalyDotText: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '700',
  },
  levelProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 65,
  },
  levelColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelName: {
    fontSize: 11,
    fontWeight: '600',
  },
  levelBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelValue: {
    fontSize: 11,
    width: 75,
    textAlign: 'right',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  serviceName: {
    fontSize: 11,
    width: 85,
  },
  serviceBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  serviceCount: {
    fontSize: 11,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scoreTime: {
    fontSize: 10,
    width: 40,
  },
  scoreService: {
    fontSize: 11,
    width: 75,
  },
  scoreTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ef4444',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    width: 35,
    textAlign: 'right',
  },
  heatmapHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heatmapHourLabel: {
    fontSize: 10,
    width: 40,
  },
  heatmapCellsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapCell: {
    width: 26,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCellText: {
    fontSize: 9,
    fontWeight: '700',
  },
  templateCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateId: {
    fontSize: 11,
    fontWeight: '700',
  },
  templateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templateBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
  },
  templateText: {
    fontSize: 12,
    marginBottom: 4,
  },
  templateCount: {
    fontSize: 11,
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '700',
  },
  noteInput: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  btnSubmitNote: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmitNoteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
