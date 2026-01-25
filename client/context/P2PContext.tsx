import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import type { Peer, Chat, Message, UserProfile, AppSettings } from '@/types';
import { 
  getUserProfile, 
  saveUserProfile, 
  getChats, 
  saveChats, 
  addMessageToChat,
  updateMessageStatus,
  markChatAsRead,
  deleteChat as deleteStoredChat,
  generateId,
  generateDeviceId,
  getSettings,
  saveSettings,
  markMessagesAsRead,
  scheduleAutoDelete,
  deleteExpiredMessages
} from '@/lib/storage';
import { getApiUrl } from '@/lib/query-client';

interface P2PContextType {
  profile: UserProfile | null;
  peers: Peer[];
  chats: Chat[];
  settings: AppSettings;
  isScanning: boolean;
  isConnected: boolean;
  updateProfile: (name: string, avatarIndex: number) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  startScanning: () => void;
  stopScanning: () => void;
  connectToPeer: (peer: Peer) => Promise<void>;
  sendMessage: (peerId: string, content: string) => Promise<void>;
  markAsRead: (peerId: string) => Promise<void>;
  deleteChat: (peerId: string, notifyPeer?: boolean) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const P2PContext = createContext<P2PContextType | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  autoDeleteEnabled: false,
  autoDeleteTimer: 10,
  notificationsEnabled: true,
  autoConnect: true,
};

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDeleteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const peersRef = useRef<Peer[]>([]);
  const chatsRef = useRef<Chat[]>([]);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  profileRef.current = profile;
  peersRef.current = peers;
  chatsRef.current = chats;
  settingsRef.current = settings;

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    try {
      const baseUrl = getApiUrl();
      const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(`${wsUrl}ws`);

      ws.onopen = () => {
        setIsConnected(true);
        const currentProfile = profileRef.current;
        if (currentProfile) {
          ws.send(JSON.stringify({ type: 'register', profile: currentProfile }));
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const currentProfile = profileRef.current;
          
          switch (data.type) {
            case 'peers':
              setPeers(data.peers.filter((p: Peer) => p.id !== currentProfile?.id));
              break;
            case 'message':
              const newMessage: Message = {
                id: generateId(),
                peerId: data.from.id,
                content: data.content,
                timestamp: Date.now(),
                isSent: false,
                status: 'delivered',
              };
              const updatedChats = await addMessageToChat(
                data.from.id,
                data.from.name,
                newMessage
              );
              setChats(updatedChats);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              break;
            case 'peer_connected':
              setPeers(prev => {
                const existing = prev.find(p => p.id === data.peer.id);
                if (existing) {
                  return prev.map(p => p.id === data.peer.id ? { ...p, isConnected: true } : p);
                }
                return [...prev, { ...data.peer, isConnected: true }];
              });
              break;
            case 'peer_disconnected':
              setPeers(prev => prev.map(p => 
                p.id === data.peerId ? { ...p, isConnected: false } : p
              ));
              setChats(prev => prev.map(c =>
                c.peerId === data.peerId ? { ...c, isOnline: false } : c
              ));
              break;
            case 'messages_read':
              const senderId = data.from;
              const readMessageIds = data.messageIds || [];
              const autoDeleteAt = data.autoDeleteAt;
              
              setChats(prev => prev.map(chat => {
                if (chat.peerId === senderId) {
                  return {
                    ...chat,
                    messages: chat.messages.map(m => {
                      if (m.isSent && readMessageIds.includes(m.id)) {
                        return { 
                          ...m, 
                          status: 'read' as const, 
                          readAt: Date.now(),
                          autoDeleteAt: autoDeleteAt || undefined
                        };
                      }
                      return m;
                    }),
                  };
                }
                return chat;
              }));
              break;
            case 'delete_chat':
              const fromPeerId = data.from;
              const deletedChats = await deleteStoredChat(fromPeerId);
              setChats(deletedChats);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              break;
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket connection error:', e);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      let userProfile = await getUserProfile();
      if (!userProfile) {
        userProfile = {
          id: generateDeviceId(),
          name: `User_${generateDeviceId().slice(0, 4)}`,
          avatarIndex: Math.floor(Math.random() * 4),
        };
        await saveUserProfile(userProfile);
      }
      setProfile(userProfile);
      
      const storedChats = await getChats();
      setChats(storedChats);
      
      const storedSettings = await getSettings();
      setSettings(storedSettings);
    };
    init();
    
    autoDeleteIntervalRef.current = setInterval(async () => {
      const updatedChats = await deleteExpiredMessages();
      setChats(updatedChats);
    }, 30000);
    
    return () => {
      if (autoDeleteIntervalRef.current) {
        clearInterval(autoDeleteIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (profile) {
      connectWebSocket();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [profile, connectWebSocket]);

  const updateProfile = useCallback(async (name: string, avatarIndex: number) => {
    const currentProfile = profileRef.current;
    if (!currentProfile) return;
    const updated = { ...currentProfile, name, avatarIndex };
    await saveUserProfile(updated);
    setProfile(updated);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'register', profile: updated }));
    }
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'scan' }));
    }
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const connectToPeer = useCallback(async (peer: Peer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'connect', peerId: peer.id }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const sendMessage = useCallback(async (peerId: string, content: string) => {
    const currentProfile = profileRef.current;
    const currentPeers = peersRef.current;
    const currentChats = chatsRef.current;
    
    if (!currentProfile || !content.trim()) return;
    
    const message: Message = {
      id: generateId(),
      peerId,
      content: content.trim(),
      timestamp: Date.now(),
      isSent: true,
      status: 'sending',
    };

    const peer = currentPeers.find(p => p.id === peerId);
    const peerName = peer?.name || currentChats.find(c => c.peerId === peerId)?.peerName || 'Unknown';
    
    // Add message once with 'sending' status
    const updatedChats = await addMessageToChat(peerId, peerName, message);
    setChats(updatedChats);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        to: peerId,
        content: content.trim(),
        from: currentProfile,
      }));
    }

    // Update status to 'sent' instead of adding duplicate message
    const finalChats = await updateMessageStatus(peerId, message.id, 'sent');
    setChats(finalChats);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const currentSettings = settingsRef.current;
    const updated = { ...currentSettings, ...newSettings };
    await saveSettings(updated);
    setSettings(updated);
  }, []);

  const markAsRead = useCallback(async (peerId: string) => {
    const currentSettings = settingsRef.current;
    const { chats: updatedChats, messageIds } = await markMessagesAsRead(peerId);
    setChats(updatedChats);
    
    if (messageIds.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const autoDeleteAt = currentSettings.autoDeleteEnabled 
        ? Date.now() + (currentSettings.autoDeleteTimer * 60 * 1000) 
        : undefined;
      
      wsRef.current.send(JSON.stringify({
        type: 'messages_read',
        to: peerId,
        messageIds,
        autoDeleteAt,
      }));
      
      if (currentSettings.autoDeleteEnabled) {
        const scheduled = await scheduleAutoDelete(peerId, messageIds, currentSettings.autoDeleteTimer);
        setChats(scheduled);
      }
    }
  }, []);

  const deleteChatHandler = useCallback(async (peerId: string, notifyPeer: boolean = true) => {
    if (notifyPeer && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'delete_chat',
        to: peerId,
      }));
    }
    
    const updated = await deleteStoredChat(peerId);
    setChats(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const refreshChats = useCallback(async () => {
    const storedChats = await getChats();
    setChats(storedChats);
  }, []);

  const value = useMemo(() => ({
    profile,
    peers,
    chats,
    settings,
    isScanning,
    isConnected,
    updateProfile,
    updateSettings,
    startScanning,
    stopScanning,
    connectToPeer,
    sendMessage,
    markAsRead,
    deleteChat: deleteChatHandler,
    refreshChats,
  }), [
    profile,
    peers,
    chats,
    settings,
    isScanning,
    isConnected,
    updateProfile,
    updateSettings,
    startScanning,
    stopScanning,
    connectToPeer,
    sendMessage,
    markAsRead,
    deleteChatHandler,
    refreshChats,
  ]);

  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error('useP2P must be used within a P2PProvider');
  }
  return context;
}
