import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function KpiCard({ title, value, icon: Icon, color, subtitle, onPress }) {
  const { colors } = useTheme();

  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        {Icon && (
          <View style={[styles.iconWrapper, { backgroundColor: color ? `${color}14` : colors.primaryLight }]}>
            <Icon size={15} color={color || colors.link || colors.primary} />
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    margin: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.374,
  },
  subtitle: {
    fontSize: 10.5,
    marginTop: 4,
  },
});

