import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { MessageBubble } from '@/components/MessageBubble';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { SignalBars } from '@/components/SignalBars';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import type { Message } from '@/types';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { chats, peers, sendMessage, markAsRead } = useP2P();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useSharedValue(1);

  const { peerId, peerName } = route.params;
  const chat = chats.find(c => c.peerId === peerId);
  const peer = peers.find(p => p.id === peerId);
  const isOnline = peer?.isConnected || chat?.isOnline || false;
  const signalStrength = peer?.signalStrength || 0.5;

  const messages = chat?.messages || [];
  const reversedMessages = [...messages].reverse();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <ThemedText type="body" style={styles.headerName}>{peerName}</ThemedText>
          <View style={styles.headerStatus}>
            <ConnectionBadge isOnline={isOnline} size={6} />
            <ThemedText type="small" style={[styles.headerStatusText, { color: theme.textSecondary }]}>
              {isOnline ? 'Connected' : 'Offline'}
            </ThemedText>
            <SignalBars strength={signalStrength} size="small" />
          </View>
        </View>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('PeerInfo', { peerId, peerName })}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Feather name="info" size={20} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, peerName, isOnline, signalStrength, theme, peerId]);

  useEffect(() => {
    if (chat && chat.unreadCount > 0) {
      markAsRead(peerId);
    }
  }, [chat, peerId, markAsRead]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(peerId, inputText);
    setInputText('');
  };

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSendPressIn = () => {
    sendScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handleSendPressOut = () => {
    sendScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="lock" size={48} color={theme.primary} style={styles.emptyIcon} />
      <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
        Messages are encrypted and stored only on your devices
      </ThemedText>
    </View>
  );

  const canSend = inputText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted={messages.length > 0}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: Spacing.lg,
          },
          messages.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />
      
      <View 
        style={[
          styles.inputContainer, 
          { 
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.sm,
            borderTopColor: theme.border,
          }
        ]}
      >
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            multiline
            maxLength={1000}
            testID="message-input"
          />
        </View>
        <AnimatedPressable
          onPress={handleSend}
          onPressIn={handleSendPressIn}
          onPressOut={handleSendPressOut}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.primary : theme.backgroundSecondary,
            },
            sendAnimatedStyle,
          ]}
          testID="send-button"
        >
          <Feather 
            name="send" 
            size={18} 
            color={canSend ? theme.buttonText : theme.textSecondary} 
          />
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    alignItems: 'center',
  },
  headerName: {
    fontWeight: '600',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatusText: {
    fontSize: 11,
    marginRight: 4,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xs,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    transform: [{ scaleY: -1 }],
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
});
