import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import IncidentDetailScreen from '../screens/anomalies/IncidentDetailScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import AdminSettingsScreen from '../screens/profile/AdminSettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* 5 Tabs chính */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Các màn hình phụ (khi push vào đây, TabBar sẽ tự động ẩn) */}
      <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Stack.Navigator>
  );
}

