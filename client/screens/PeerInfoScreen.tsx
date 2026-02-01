import React from 'react';
import { View, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { SignalBars } from '@/components/SignalBars';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type PeerInfoRouteProp = RouteProp<RootStackParamList, 'PeerInfo'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PeerInfoScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<PeerInfoRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { chats, peers, deleteChat } = useP2P();

  const { peerId, peerName } = route.params;
  const chat = chats.find(c => c.peerId === peerId);
  const peer = peers.find(p => p.id === peerId);
  const isOnline = peer?.isConnected || chat?.isOnline || false;
  const signalStrength = peer?.signalStrength || 0.5;
  const messageCount = chat?.messages.length || 0;

  const handleDeleteChat = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will permanently delete all messages with this peer from your device. This cannot be undone.\n\nDelete Conversation?');
      if (confirmed) {
        (async () => {
          await deleteChat(peerId);
          navigation.popToTop();
        })();
      }
      return;
    }

    Alert.alert(
      'Delete Conversation',
      'This will permanently delete all messages with this peer from your device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChat(peerId);
            navigation.popToTop();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={48} color={theme.primary} />
          <View style={styles.avatarBadge}>
            <ConnectionBadge isOnline={isOnline} size={16} />
          </View>
        </View>
        <ThemedText type="h3" style={styles.name}>{peerName}</ThemedText>
        <View style={styles.statusRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {isOnline ? 'Connected' : 'Offline'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          CONNECTION INFO
        </ThemedText>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="wifi" size={18} color={theme.primary} />
            <ThemedText type="body" style={styles.infoLabel}>Signal</ThemedText>
          </View>
          <SignalBars strength={signalStrength} size="medium" />
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="hash" size={18} color={theme.primary} />
            <ThemedText type="body" style={styles.infoLabel}>Device ID</ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {peerId.slice(0, 12)}
          </ThemedText>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="message-circle" size={18} color={theme.primary} />
            <ThemedText type="body" style={styles.infoLabel}>Messages</ThemedText>
          </View>
          <ThemedText type="body">{messageCount}</ThemedText>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          SECURITY
        </ThemedText>
        
        <View style={styles.securityInfo}>
          <Feather name="lock" size={24} color={theme.primary} />
          <View style={styles.securityText}>
            <ThemedText type="body" style={styles.securityTitle}>
              End-to-End Encrypted
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Messages are stored only on connected devices. No server ever sees your messages.
            </ThemedText>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleDeleteChat}
        style={[styles.deleteButton, { backgroundColor: theme.backgroundDefault }]}
        testID="delete-chat-button"
      >
        <Feather name="trash-2" size={18} color={theme.error} />
        <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
          Delete Conversation
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  securityTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
});
