export interface Peer {
  id: string;
  name: string;
  deviceId: string;
  signalStrength: number;
  isConnected: boolean;
  lastSeen: number;
}

export interface Message {
  id: string;
  peerId: string;
  content: string;
  timestamp: number;
  isSent: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readAt?: number;
  autoDeleteAt?: number;
}

export interface Chat {
  peerId: string;
  peerName: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarIndex: number;
}

export interface AppSettings {
  autoDeleteEnabled: boolean;
  autoDeleteTimer: 10 | 30;
  notificationsEnabled: boolean;
  autoConnect: boolean;
}
