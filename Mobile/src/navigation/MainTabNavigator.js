import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/CustomTabBar';

// Tab Screens
import DashboardScreen from '../screens/home/DashboardScreen';
import AnomaliesScreen from '../screens/anomalies/AnomaliesScreen';
import QuickActionScreen from '../screens/quickAction/QuickActionScreen';
import DrainTemplatesScreen from '../screens/templates/DrainTemplatesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Anomalies" component={AnomaliesScreen} />
      <Tab.Screen name="QuickAction" component={QuickActionScreen} />
      <Tab.Screen name="Templates" component={DrainTemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

