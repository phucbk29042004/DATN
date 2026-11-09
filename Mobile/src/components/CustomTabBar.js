import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, AlertTriangle, Search, Layers, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 68 + Math.max(insets.bottom, 8),
          shadowColor: isDark ? '#000000' : colors.cardShadow,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenterAction = route.name === 'QuickAction';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Render Icons
        const renderIcon = (focused) => {
          const iconColor = focused ? colors.primary : colors.textMuted;
          const strokeWidth = focused ? 2.4 : 1.8;

          switch (route.name) {
            case 'Home':
              return <LayoutDashboard size={20} color={iconColor} strokeWidth={strokeWidth} />;
            case 'Anomalies':
              return <AlertTriangle size={20} color={focused ? colors.danger : colors.textMuted} strokeWidth={strokeWidth} />;
            case 'QuickAction':
              return <Search size={22} color="#ffffff" strokeWidth={2.4} />;
            case 'Templates':
              return <Layers size={20} color={iconColor} strokeWidth={strokeWidth} />;
            case 'Profile':
              return <User size={20} color={iconColor} strokeWidth={strokeWidth} />;
            default:
              return null;
          }
        };

        const getLabel = () => {
          switch (route.name) {
            case 'Home':
              return 'Tổng quan';
            case 'Anomalies':
              return 'Sự cố';
            case 'QuickAction':
              return 'Tra cứu';
            case 'Templates':
              return 'Mẫu log';
            case 'Profile':
              return 'Tài khoản';
            default:
              return route.name;
          }
        };

        // Nút Trung Tâm Nhô Cao (Elevated Action Button)
        if (isCenterAction) {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.88}
              style={styles.centerTabWrapper}
            >
              <View
                style={[
                  styles.centerButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
              >
                {renderIcon(isFocused)}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.textMuted,
                    fontWeight: isFocused ? '700' : '500',
                    marginTop: 3,
                  },
                ]}
              >
                {getLabel()}
              </Text>
            </TouchableOpacity>
          );
        }

        // 4 Tabs chuẩn có Pill Active Indicator
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            activeOpacity={0.82}
            style={styles.tabItem}
          >
            <View
              style={[
                styles.iconPill,
                isFocused && {
                  backgroundColor: route.name === 'Anomalies' ? colors.dangerLight : colors.primaryLight,
                },
              ]}
            >
              {renderIcon(isFocused)}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused
                    ? route.name === 'Anomalies'
                      ? colors.danger
                      : colors.primary
                    : colors.textMuted,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {getLabel()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    // Upward Elevation Shadow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -10, // Nhô cao hơn thanh bar
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

