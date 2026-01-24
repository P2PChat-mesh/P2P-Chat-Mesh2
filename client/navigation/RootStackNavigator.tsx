import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@/navigation/MainTabNavigator';
import ChatScreen from '@/screens/ChatScreen';
import PeerInfoScreen from '@/screens/PeerInfoScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type RootStackParamList = {
  Main: undefined;
  Chat: { peerId: string; peerName: string };
  PeerInfo: { peerId: string; peerName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTitle: 'Chat',
        }}
      />
      <Stack.Screen
        name="PeerInfo"
        component={PeerInfoScreen}
        options={{
          headerTitle: 'Connection Info',
        }}
      />
    </Stack.Navigator>
  );
}
