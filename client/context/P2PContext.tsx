import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import type { Peer, Chat, Message, UserProfile } from '@/types';
import { 
  getUserProfile, 
  saveUserProfile, 
  getChats, 
  saveChats, 
  addMessageToChat,
  markChatAsRead,
  deleteChat as deleteStoredChat,
  generateId,
  generateDeviceId 
} from '@/lib/storage';
import { getApiUrl } from '@/lib/query-client';

interface P2PContextType {
  profile: UserProfile | null;
  peers: Peer[];
  chats: Chat[];
  isScanning: boolean;
  isConnected: boolean;
  updateProfile: (name: string, avatarIndex: number) => Promise<void>;
  startScanning: () => void;
  stopScanning: () => void;
  connectToPeer: (peer: Peer) => Promise<void>;
  sendMessage: (peerId: string, content: string) => Promise<void>;
  markAsRead: (peerId: string) => Promise<void>;
  deleteChat: (peerId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const P2PContext = createContext<P2PContextType | null>(null);

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const baseUrl = getApiUrl();
      const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(`${wsUrl}ws`);

      ws.onopen = () => {
        setIsConnected(true);
        if (profile) {
          ws.send(JSON.stringify({ type: 'register', profile }));
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'peers':
              setPeers(data.peers.filter((p: Peer) => p.id !== profile?.id));
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
  }, [profile]);

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
    };
    init();
  }, []);

  useEffect(() => {
    if (profile) {
      connectWebSocket();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [profile, connectWebSocket]);

  const updateProfile = async (name: string, avatarIndex: number) => {
    if (!profile) return;
    const updated = { ...profile, name, avatarIndex };
    await saveUserProfile(updated);
    setProfile(updated);
    wsRef.current?.send(JSON.stringify({ type: 'register', profile: updated }));
  };

  const startScanning = () => {
    setIsScanning(true);
    wsRef.current?.send(JSON.stringify({ type: 'scan' }));
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const connectToPeer = async (peer: Peer) => {
    wsRef.current?.send(JSON.stringify({ type: 'connect', peerId: peer.id }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const sendMessage = async (peerId: string, content: string) => {
    if (!profile || !content.trim()) return;
    
    const message: Message = {
      id: generateId(),
      peerId,
      content: content.trim(),
      timestamp: Date.now(),
      isSent: true,
      status: 'sending',
    };

    const peer = peers.find(p => p.id === peerId);
    const peerName = peer?.name || chats.find(c => c.peerId === peerId)?.peerName || 'Unknown';
    
    const updatedChats = await addMessageToChat(peerId, peerName, message);
    setChats(updatedChats);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    wsRef.current?.send(JSON.stringify({
      type: 'message',
      to: peerId,
      content: content.trim(),
      from: profile,
    }));

    message.status = 'sent';
    const finalChats = await addMessageToChat(peerId, peerName, { ...message, status: 'sent' });
    setChats(finalChats);
  };

  const markAsRead = async (peerId: string) => {
    await markChatAsRead(peerId);
    setChats(prev => prev.map(c =>
      c.peerId === peerId ? { ...c, unreadCount: 0 } : c
    ));
  };

  const deleteChatHandler = async (peerId: string) => {
    const updated = await deleteStoredChat(peerId);
    setChats(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const refreshChats = async () => {
    const storedChats = await getChats();
    setChats(storedChats);
  };

  return (
    <P2PContext.Provider value={{
      profile,
      peers,
      chats,
      isScanning,
      isConnected,
      updateProfile,
      startScanning,
      stopScanning,
      connectToPeer,
      sendMessage,
      markAsRead,
      deleteChat: deleteChatHandler,
      refreshChats,
    }}>
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
