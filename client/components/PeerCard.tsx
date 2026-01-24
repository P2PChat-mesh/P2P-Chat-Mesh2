import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { SignalBars } from '@/components/SignalBars';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Peer } from '@/types';

interface PeerCardProps {
  peer: Peer;
  onConnect: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PeerCard({ peer, onConnect }: PeerCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onConnect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
      testID={`peer-card-${peer.id}`}
    >
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={20} color={theme.primary} />
          <View style={styles.badgeContainer}>
            <ConnectionBadge isOnline={peer.isConnected} size={8} />
          </View>
        </View>
        <View style={styles.info}>
          <ThemedText type="body" style={styles.name}>{peer.name}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {peer.deviceId}
          </ThemedText>
        </View>
      </View>
      <View style={styles.rightSection}>
        <SignalBars strength={peer.signalStrength} size="small" />
        <View style={[styles.connectButton, { backgroundColor: theme.primary }]}>
          <Feather name="link" size={14} color={theme.buttonText} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  connectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
