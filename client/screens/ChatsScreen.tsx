import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChatRow } from '@/components/ChatRow';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';
import { Spacing } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import type { Chat } from '@/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { chats, refreshChats } = useP2P();

  const sortedChats = [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || 0;
    const bTime = b.lastMessage?.timestamp || 0;
    return bTime - aTime;
  });

  const handleChatPress = (chat: Chat) => {
    navigation.navigate('Chat', { peerId: chat.peerId, peerName: chat.peerName });
  };

  const renderChat = ({ item }: { item: Chat }) => (
    <ChatRow chat={item} onPress={() => handleChatPress(item)} />
  );

  const renderEmpty = () => (
    <EmptyState
      image={require('../../assets/images/empty-chats.png')}
      title="No conversations yet"
      subtitle="Connect with nearby peers to start a private conversation"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={sortedChats}
        keyExtractor={(item) => item.peerId}
        renderItem={renderChat}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.lg,
          },
          sortedChats.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshChats}
        refreshing={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
});
