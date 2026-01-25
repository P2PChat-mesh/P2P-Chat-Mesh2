import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chat, Message, UserProfile, AppSettings } from '@/types';

const STORAGE_KEYS = {
  USER_PROFILE: 'meshchat_user_profile',
  CHATS: 'meshchat_chats',
  SETTINGS: 'meshchat_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  autoDeleteEnabled: false,
  autoDeleteTimer: 10,
  notificationsEnabled: true,
  autoConnect: true,
};

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getChats(): Promise<Chat[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveChats(chats: Chat[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

export async function addMessageToChat(peerId: string, peerName: string, message: Message): Promise<Chat[]> {
  const chats = await getChats();
  const chatIndex = chats.findIndex(c => c.peerId === peerId);
  
  if (chatIndex >= 0) {
    chats[chatIndex].messages.push(message);
    chats[chatIndex].lastMessage = message;
    if (!message.isSent) {
      chats[chatIndex].unreadCount += 1;
    }
  } else {
    chats.push({
      peerId,
      peerName,
      messages: [message],
      lastMessage: message,
      unreadCount: message.isSent ? 0 : 1,
      isOnline: true,
    });
  }
  
  await saveChats(chats);
  return chats;
}

export async function markChatAsRead(peerId: string): Promise<void> {
  const chats = await getChats();
  const chat = chats.find(c => c.peerId === peerId);
  if (chat) {
    chat.unreadCount = 0;
    await saveChats(chats);
  }
}

export async function deleteChat(peerId: string): Promise<Chat[]> {
  const chats = await getChats();
  const filtered = chats.filter(c => c.peerId !== peerId);
  await saveChats(filtered);
  return filtered;
}

export async function updateMessageStatus(peerId: string, messageId: string, status: Message['status']): Promise<Chat[]> {
  const chats = await getChats();
  const chat = chats.find(c => c.peerId === peerId);
  if (chat) {
    const message = chat.messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      if (chat.lastMessage?.id === messageId) {
        chat.lastMessage.status = status;
      }
      await saveChats(chats);
    }
  }
  return chats;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateDeviceId(): string {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function markMessagesAsRead(peerId: string): Promise<{ chats: Chat[], messageIds: string[] }> {
  const chats = await getChats();
  const chat = chats.find(c => c.peerId === peerId);
  const messageIds: string[] = [];
  
  if (chat) {
    const now = Date.now();
    chat.messages.forEach(m => {
      if (!m.isSent && m.status !== 'read') {
        m.status = 'read';
        m.readAt = now;
        messageIds.push(m.id);
      }
    });
    chat.unreadCount = 0;
    await saveChats(chats);
  }
  
  return { chats, messageIds };
}

export async function scheduleAutoDelete(peerId: string, messageIds: string[], deleteInMinutes: number): Promise<Chat[]> {
  const chats = await getChats();
  const chat = chats.find(c => c.peerId === peerId);
  
  if (chat) {
    const deleteAt = Date.now() + (deleteInMinutes * 60 * 1000);
    chat.messages.forEach(m => {
      if (messageIds.includes(m.id)) {
        m.autoDeleteAt = deleteAt;
      }
    });
    await saveChats(chats);
  }
  
  return chats;
}

export async function deleteExpiredMessages(): Promise<Chat[]> {
  const chats = await getChats();
  const now = Date.now();
  let changed = false;
  
  chats.forEach(chat => {
    const originalLength = chat.messages.length;
    chat.messages = chat.messages.filter(m => !m.autoDeleteAt || m.autoDeleteAt > now);
    if (chat.messages.length !== originalLength) {
      changed = true;
      chat.lastMessage = chat.messages[chat.messages.length - 1];
    }
  });
  
  if (changed) {
    await saveChats(chats);
  }
  
  return chats;
}
