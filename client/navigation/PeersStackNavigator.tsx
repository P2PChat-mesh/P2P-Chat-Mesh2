import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PeerDiscoveryScreen from '@/screens/PeerDiscoveryScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type PeersStackParamList = {
  PeerDiscovery: undefined;
};

const Stack = createNativeStackNavigator<PeersStackParamList>();

export default function PeersStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PeerDiscovery"
        component={PeerDiscoveryScreen}
        options={{
          headerTitle: () => <HeaderTitle title="MeshChat" />,
        }}
      />
    </Stack.Navigator>
  );
}
