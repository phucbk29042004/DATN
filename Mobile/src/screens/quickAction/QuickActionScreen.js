import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, RotateCcw, Radio, Clock, ShieldAlert, X, Filter } from 'lucide-react-native';
import io from 'socket.io-client';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import { getServerUrl } from '../../api/config';

const TIME_RANGES = [
  { key: '1h', label: '1 giờ' },
  { key: '24h', label: '24 giờ' },
  { key: '7d', label: '7 ngày' },
  { key: 'ALL', label: 'Tất cả' },
];

export default function QuickActionScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');
  const [timeRange, setTimeRange] = useState('24h');
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const initialSearchDone = useRef(false);

  // Tìm kiếm logs qua API
  const executeSearch = useCallback(async (isManual = false) => {
    setLoading(true);
    setIsRealtime(false);
    try {
      let endpoint = `/logs/search?size=40`;
      if (query.trim()) endpoint += `&q=${encodeURIComponent(query.trim())}`;
      if (level !== 'ALL') endpoint += `&level=${level}`;

      // Time range
      if (timeRange !== 'ALL') {
        const msMap = { '1h': 3600000, '24h': 86400000, '7d': 7 * 86400000 };
        const ms = msMap[timeRange] || 86400000;
        const fromIso = new Date(Date.now() - ms).toISOString();
        const toIso = new Date().toISOString();
        endpoint += `&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
      }

      const res = await apiClient(endpoint);
      setLogs(res.logs || []);
      setTotalCount(res.total || 0);

      if (isManual) {
        showToast(`Tìm thấy ${(res.total || 0).toLocaleString()} kết quả`, 'success');
      }
    } catch (err) {
      if (isManual) {
        showToast('Lỗi khi tra cứu log', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [query, level, timeRange, showToast]);

  // Initial load
  useEffect(() => {
    if (!initialSearchDone.current) {
      initialSearchDone.current = true;
      executeSearch(false);
    }
  }, [executeSearch]);

  // ── Debounce Live Search (300ms) ──
  useEffect(() => {
    if (!initialSearchDone.current) return;
    const timer = setTimeout(() => {
      executeSearch(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [query, level, timeRange, executeSearch]);

  // Socket realtime stream (chỉ khi bật chế độ Realtime)
  useEffect(() => {
    if (!isRealtime) return;
    let socket;
    (async () => {
      try {
        const serverUrl = await getServerUrl();
        socket = io(serverUrl, { transports: ['websocket'] });

        socket.on('new_log', (newLog) => {
          if (isRealtime) {
            setLogs((prev) => [newLog, ...prev].slice(0, 50));
            setTotalCount((c) => c + 1);
          }
        });
      } catch (e) {
        console.warn('Socket connect error:', e);
      }
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isRealtime]);

  const handleReset = () => {
    setQuery('');
    setLevel('ALL');
    setTimeRange('24h');
    setIsRealtime(false);
    showToast('Đã đặt lại bộ lọc tìm kiếm', 'info');
  };

  const toggleRealtime = () => {
    const next = !isRealtime;
    setIsRealtime(next);
    showToast(next ? 'Đã bật luồng log realtime' : 'Đã tạm dừng realtime', 'info');
  };

  const getLevelColor = (lvl) => {
    switch (lvl) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.titleRow}>
          <Search size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Tra Cứu Log Trực Tuyến</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.realtimePill,
            { backgroundColor: isRealtime ? 'rgba(16, 185, 129, 0.15)' : colors.surfaceVariant, borderColor: isRealtime ? '#10b981' : colors.borderSubtle },
          ]}
          onPress={toggleRealtime}
          activeOpacity={0.7}
        >
          <Radio size={11} color={isRealtime ? '#10b981' : colors.textMuted} />
          <Text
            style={[
              styles.realtimeText,
              { color: isRealtime ? '#10b981' : colors.textMuted },
            ]}
          >
            {isRealtime ? 'Realtime Bật' : 'Tạm dừng'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        {/* Input input search */}
        <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Tìm theo từ khóa, dịch vụ (VD: auth, error, 404)..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Khung Giờ (Time Range Filter) */}
        <View style={styles.filterRow}>
          <View style={styles.filterLabelCol}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Thời gian:</Text>
          </View>
          <View style={styles.chipsRow}>
            {TIME_RANGES.map((tr) => {
              const isSelected = timeRange === tr.key;
              return (
                <TouchableOpacity
                  key={tr.key}
                  onPress={() => setTimeRange(tr.key)}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                      borderColor: isSelected ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      {
                        color: isSelected ? '#ffffff' : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tr.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Level Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterLabelCol}>
            <Filter size={12} color={colors.textSecondary} />
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Mức độ:</Text>
          </View>
          <View style={styles.chipsRow}>
            {['ALL', 'INFO', 'WARN', 'ERROR', 'FATAL'].map((lvl) => {
              const isSelected = level === lvl;
              const lvlColor = getLevelColor(lvl);
              return (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setLevel(lvl)}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor: isSelected
                        ? (lvl === 'ALL' ? colors.primary : `${lvlColor}20`)
                        : colors.surfaceVariant,
                      borderColor: isSelected
                        ? (lvl === 'ALL' ? colors.primary : lvlColor)
                        : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      {
                        color: isSelected
                          ? (lvl === 'ALL' ? '#ffffff' : lvlColor)
                          : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <Text style={[styles.resultCountText, { color: colors.textSecondary }]}>
            {loading ? 'Đang tìm kiếm...' : `Hiển thị ${logs.length} / ${totalCount.toLocaleString()} logs`}
          </Text>

          <View style={styles.actionButtonsRight}>
            <TouchableOpacity
              style={[styles.btnReset, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceVariant }]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <RotateCcw size={12} color={colors.textSecondary} />
              <Text style={[styles.btnResetText, { color: colors.textSecondary }]}>Đặt lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSearch, { backgroundColor: colors.primary }]}
              onPress={() => executeSearch(true)}
              activeOpacity={0.75}
            >
              <Search size={13} color="#ffffff" />
              <Text style={styles.btnSearchText}>Tìm kiếm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Log Stream List */}
      {loading && logs.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>Đang truy vấn dữ liệu...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerBox}>
          <Clock size={36} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {isRealtime ? 'Đang chờ luồng log realtime...' : 'Không tìm thấy kết quả phù hợp'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {isRealtime
              ? 'Log mới từ máy chủ sẽ tự động hiển thị tại đây.'
              : 'Hãy thử đổi từ khóa, mở rộng khung giờ hoặc mức độ.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, idx) => item.id || `${item.timestamp}-${idx}`}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 95 }}
          renderItem={({ item, index }) => {
            const lvl = (item.level || 'INFO').toUpperCase();
            const lvlColor = getLevelColor(lvl);
            const score = item.anomaly_score ?? 0;

            return (
              <TouchableOpacity
                style={[
                  styles.logRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedLog(item)}
                activeOpacity={0.75}
              >
                <View style={styles.logMetaRow}>
                  <View style={[styles.badgePill, { backgroundColor: `${lvlColor}18`, borderColor: `${lvlColor}40` }]}>
                    <Text style={[styles.badgeText, { color: lvlColor }]}>{lvl}</Text>
                  </View>
                  <Text style={[styles.logService, { color: colors.text }]} numberOfLines={1}>
                    {item.service_name || item.service || 'unknown-service'}
                  </Text>
                  {score >= 0.7 && (
                    <View style={[styles.scoreBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <ShieldAlert size={10} color="#ef4444" />
                      <Text style={styles.scoreText}>{(score * 100).toFixed(0)}%</Text>
                    </View>
                  )}
                  <Text style={[styles.logTime, { color: colors.textMuted }]}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('vi-VN') : ''}
                  </Text>
                </View>
                <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={2}>
                  {item.message || item.drain_template || '-'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal Xem Chi Tiết Log */}
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
              <ScrollView style={{ maxHeight: 380 }}>
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
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 4,
  },
  realtimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    height: 42,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12.5,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 78,
  },
  filterLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 11,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  resultCountText: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  btnReset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  btnResetText: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  btnSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  btnSearchText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 12.5,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  logRow: {
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  logService: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scoreText: {
    color: '#ef4444',
    fontSize: 9.5,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 10.5,
  },
  logMessage: {
    fontSize: 11.5,
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
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
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
