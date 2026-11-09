import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, RotateCcw, Radio, Clock, ShieldAlert } from 'lucide-react-native';
import io from 'socket.io-client';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient } from '../../api/client';
import { getServerUrl } from '../../api/config';

export default function QuickActionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRealtime, setIsRealtime] = useState(true);

  // Socket realtime stream
  useEffect(() => {
    let socket;
    (async () => {
      const serverUrl = await getServerUrl();
      socket = io(serverUrl, { transports: ['websocket'] });

      socket.on('connect', () => {
        console.log('[Mobile Socket] Đã kết nối Socket.IO');
      });

      socket.on('new_log', (newLog) => {
        if (isRealtime) {
          setLogs((prev) => [newLog, ...prev].slice(0, 50));
        }
      });
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isRealtime]);

  // Tìm kiếm logs qua API
  const handleSearch = async () => {
    setLoading(true);
    setIsRealtime(false);
    try {
      let endpoint = `/logs/search?size=30`;
      if (query.trim()) endpoint += `&q=${encodeURIComponent(query.trim())}`;
      if (level !== 'ALL') endpoint += `&level=${level}`;

      const res = await apiClient(endpoint);
      setLogs(res.logs || []);
    } catch (err) {
      console.warn('Lỗi tìm kiếm log:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setLevel('ALL');
    setIsRealtime(true);
    setLogs([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.titleRow}>
          <Search size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Tra Cứu & Giám Sát Log</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.realtimePill,
            { backgroundColor: isRealtime ? colors.successLight : colors.surfaceVariant },
          ]}
          onPress={() => setIsRealtime(!isRealtime)}
        >
          <Radio size={12} color={isRealtime ? colors.success : colors.textMuted} />
          <Text
            style={[
              styles.realtimeText,
              { color: isRealtime ? colors.success : colors.textMuted },
            ]}
          >
            {isRealtime ? 'Realtime Bật' : 'Tạm dừng'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Tìm theo từ khóa log (VD: error, timeout)..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <RotateCcw size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Level Filters */}
        <View style={styles.levelsRow}>
          {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => {
            const isSelected = level === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                onPress={() => setLevel(lvl)}
                style={[
                  styles.lvlBtn,
                  isSelected && {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.lvlBtnText,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
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

        {/* Actions Row */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.btnReset, { borderColor: colors.border }]}
            onPress={handleReset}
          >
            <RotateCcw size={12} color={colors.textSecondary} />
            <Text style={[styles.btnResetText, { color: colors.textSecondary }]}>Đặt lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSearch, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
          >
            <Search size={14} color="#ffffff" />
            <Text style={styles.btnSearchText}>Truy vấn ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Stream List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>Đang tìm kiếm logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerBox}>
          <Clock size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {isRealtime ? 'Đang chờ luồng log realtime...' : 'Không tìm thấy log phù hợp'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {isRealtime
              ? 'Log mới từ Collector sẽ tự động hiển thị ở đây.'
              : 'Hãy thử thay đổi từ khóa hoặc bộ lọc mức độ.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, idx) => item.id || `${item.timestamp}-${idx}`}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const lvl = (item.level || 'INFO').toUpperCase();
            const score = item.anomaly_score ?? 0;
            return (
              <View
                style={[
                  styles.logRow,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.logMetaRow}>
                  <Text style={[styles.logService, { color: colors.secondary }]}>
                    {item.service || item.service_name || 'Hệ thống'}
                  </Text>
                  <View style={[styles.lvlPill, { backgroundColor: lvl === 'ERROR' ? colors.dangerLight : colors.primaryLight }]}>
                    <Text style={[styles.lvlPillText, { color: lvl === 'ERROR' ? colors.danger : colors.primary }]}>
                      {lvl}
                    </Text>
                  </View>
                  {score > 0 && (
                    <Text style={[styles.logScore, { color: colors.danger }]}>
                      {(score * 100).toFixed(0)}%
                    </Text>
                  )}
                  <Text style={[styles.logTime, { color: colors.textMuted }]}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('vi-VN') : ''}
                  </Text>
                </View>
                <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={3}>
                  {item.message || item.content || '-'}
                </Text>
              </View>
            );
          }}
        />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  realtimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    padding: 12,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  lvlBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  lvlBtnText: {
    fontSize: 11,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btnReset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnResetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSearchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingLabel: {
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
  logRow: {
    padding: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  logService: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  lvlPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lvlPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  logScore: {
    fontSize: 11,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 10.5,
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
});

