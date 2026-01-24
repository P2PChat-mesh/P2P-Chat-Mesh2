import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Chat } from '@/types';

interface ChatRowProps {
  chat: Chat;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function ChatRow({ chat, onPress }: ChatRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(42, 42, 42, ${bgOpacity.value})`,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    bgOpacity.value = withSpring(0.5);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    bgOpacity.value = withSpring(0);
  };

  const lastMessagePreview = chat.lastMessage?.content || 'No messages yet';
  const truncatedMessage = lastMessagePreview.length > 40 
    ? `${lastMessagePreview.slice(0, 40)}...` 
    : lastMessagePreview;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
      testID={`chat-row-${chat.peerId}`}
    >
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={22} color={theme.primary} />
          <View style={styles.badgeContainer}>
            <ConnectionBadge isOnline={chat.isOnline} size={10} />
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <ThemedText type="body" style={styles.name}>{chat.peerName}</ThemedText>
            {chat.lastMessage ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatTime(chat.lastMessage.timestamp)}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.messageRow}>
            <ThemedText 
              type="small" 
              style={{ color: theme.textSecondary, flex: 1 }}
              numberOfLines={1}
            >
              {chat.lastMessage?.isSent ? 'You: ' : ''}{truncatedMessage}
            </ThemedText>
            {chat.unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <ThemedText type="small" style={[styles.unreadText, { color: theme.buttonText }]}>
                  {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
