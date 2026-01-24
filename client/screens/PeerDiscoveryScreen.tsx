import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { PeerCard } from '@/components/PeerCard';
import { RadarVisualization } from '@/components/RadarVisualization';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import type { Peer } from '@/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PeerDiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { peers, isScanning, isConnected, startScanning, stopScanning, connectToPeer } = useP2P();
  
  const fabScale = useSharedValue(1);

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  const handleConnectPeer = async (peer: Peer) => {
    await connectToPeer(peer);
    navigation.navigate('Chat', { peerId: peer.id, peerName: peer.name });
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const renderPeer = ({ item }: { item: Peer }) => (
    <PeerCard peer={item} onConnect={() => handleConnectPeer(item)} />
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.radarContainer}>
        <RadarVisualization isScanning={isScanning} size={180} />
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? theme.primary : theme.error }]} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {isConnected ? 'Connected to network' : 'Connecting...'}
        </ThemedText>
      </View>
      <ThemedText type="h4" style={styles.sectionTitle}>
        {peers.length > 0 ? 'Nearby Peers' : 'Scanning...'}
      </ThemedText>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require('../../assets/images/empty-peers.png')}
      title="No peers nearby"
      subtitle="Make sure other devices are running MeshChat and are within range"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={peers}
        keyExtractor={(item) => item.id}
        renderItem={renderPeer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + 100,
          },
          peers.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      />
      
      <AnimatedPressable
        onPress={handleFabPress}
        onPressIn={handleFabPressIn}
        onPressOut={handleFabPressOut}
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + Spacing.xl,
          },
          fabAnimatedStyle,
        ]}
        testID="scan-button"
      >
        <Feather 
          name={isScanning ? 'wifi-off' : 'wifi'} 
          size={24} 
          color={theme.buttonText} 
        />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  radarContainer: {
    marginBottom: Spacing.xl,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
