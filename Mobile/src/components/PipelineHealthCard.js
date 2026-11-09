import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function PipelineHealthCard({ healthData, onOpenDetails }) {
  const { colors } = useTheme();

  const services = [
    {
      name: 'Collector',
      status: healthData?.collector?.status || 'OK',
      desc: 'Cổng 4000',
    },
    {
      name: 'Parser Worker',
      status: healthData?.parser?.status || 'OK',
      desc: 'BullMQ Queue',
    },
    {
      name: 'OpenSearch',
      status: healthData?.opensearch?.status || 'OK',
      desc: 'Cluster 9200',
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={18} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>Sức Khỏe Pipeline Xử Lý</Text>
        </View>
        <TouchableOpacity
          onPress={onOpenDetails}
          style={[styles.btnDetails, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }]}
        >
          <Text style={[styles.btnDetailsText, { color: colors.primary }]}>Chi tiết</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {services.map((s) => {
          const isOk = s.status === 'OK';
          return (
            <View
              key={s.name}
              style={[
                styles.serviceItem,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.serviceStatusRow}>
                {isOk ? (
                  <CheckCircle2 size={13} color={colors.success} />
                ) : (
                  <AlertCircle size={13} color={colors.warning} />
                )}
                <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
              <Text style={[styles.serviceDesc, { color: colors.textMuted }]} numberOfLines={1}>
                {s.desc}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnDetails: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnDetailsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  serviceName: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 10,
  },
});

