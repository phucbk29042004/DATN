import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layers, RefreshCw, Hash, Cpu } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient } from '../../api/client';

export default function DrainTemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiClient('/templates');
      setTemplates(data?.templates || []);
    } catch (err) {
      console.warn('Lỗi tải mẫu Drain:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTemplates();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.titleRow}>
          <Layers size={20} color={colors.secondary} />
          <Text style={[styles.title, { color: colors.text }]}>Mẫu Log Tự Động (Drain)</Text>
        </View>
        <TouchableOpacity
          style={[styles.reloadBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
          onPress={onRefresh}
        >
          <RefreshCw size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>Đang tải mẫu log Drain...</Text>
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.centerBox}>
          <Layers size={46} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có mẫu Drain nào</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Parser Worker sẽ tự động bóc tách các mẫu log khi nhận dữ liệu từ pipeline.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item, idx) => item.template_id || item.cluster_id || idx.toString()}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const count = item.count || item.size || 1;
            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.idRow}>
                    <Hash size={13} color={colors.primary} />
                    <Text style={[styles.idText, { color: colors.primary }]}>
                      {item.template_id || item.cluster_id || 'TPL'}
                    </Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.countText, { color: colors.primary }]}>
                      {count} lần xuất hiện
                    </Text>
                  </View>
                </View>

                {/* Template String Pattern */}
                <View style={[styles.patternBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.patternText, { color: colors.text }]}>
                    {item.template || item.pattern || item.message || '-'}
                  </Text>
                </View>

                {/* Service Tag */}
                {item.service && (
                  <View style={styles.footerRow}>
                    <Cpu size={12} color={colors.textMuted} />
                    <Text style={[styles.footerService, { color: colors.textSecondary }]}>
                      {item.service}
                    </Text>
                  </View>
                )}
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
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 12,
    marginVertical: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  idText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patternBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  patternText: {
    fontSize: 12,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  footerService: {
    fontSize: 11,
  },
});

