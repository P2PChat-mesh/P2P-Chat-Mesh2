import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import PeersStackNavigator from '@/navigation/PeersStackNavigator';
import ChatsStackNavigator from '@/navigation/ChatsStackNavigator';
import SettingsStackNavigator from '@/navigation/SettingsStackNavigator';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';

export type MainTabParamList = {
  PeersTab: undefined;
  ChatsTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const { chats } = useP2P();
  
  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <Tab.Navigator
      initialRouteName="PeersTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="PeersTab"
        component={PeersStackNavigator}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Feather name="radio" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.primary,
            color: theme.buttonText,
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
