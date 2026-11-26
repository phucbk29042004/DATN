import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, AlertTriangle, Search, MessageSquare, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activeBlue = colors.link || colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 62 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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

        const renderIcon = (focused) => {
          const iconColor = focused ? activeBlue : colors.textMuted;
          const strokeWidth = focused ? 2.2 : 1.7;

          switch (route.name) {
            case 'Home':
              return <LayoutDashboard size={20} color={iconColor} strokeWidth={strokeWidth} />;
            case 'Anomalies':
              return <AlertTriangle size={20} color={focused ? colors.danger : colors.textMuted} strokeWidth={strokeWidth} />;
            case 'QuickAction':
              return <Search size={20} color={iconColor} strokeWidth={strokeWidth} />;
            case 'SreChat':
              return <MessageSquare size={20} color={iconColor} strokeWidth={strokeWidth} />;
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
            case 'SreChat':
              return 'Trao đổi';
            case 'Profile':
              return 'Tài khoản';
            default:
              return route.name;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            activeOpacity={0.75}
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
                      : activeBlue
                    : colors.textMuted,
                  fontWeight: isFocused ? '600' : '400',
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
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.12,
  },
});

