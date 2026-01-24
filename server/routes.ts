import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

interface Peer {
  id: string;
  name: string;
  deviceId: string;
  signalStrength: number;
  isConnected: boolean;
  lastSeen: number;
}

interface ConnectedClient {
  ws: WebSocket;
  peer: Peer;
}

const connectedClients = new Map<string, ConnectedClient>();

function broadcastPeerList() {
  const peerList = Array.from(connectedClients.values()).map(client => ({
    ...client.peer,
    signalStrength: 0.5 + Math.random() * 0.5,
    isConnected: true,
  }));

  const message = JSON.stringify({ type: 'peers', peers: peerList });
  
  connectedClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

function notifyPeerConnected(peer: Peer, excludeId?: string) {
  const message = JSON.stringify({ type: 'peer_connected', peer });
  
  connectedClients.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

function notifyPeerDisconnected(peerId: string) {
  const message = JSON.stringify({ type: 'peer_disconnected', peerId });
  
  connectedClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', connectedPeers: connectedClients.size });
  });

  app.get('/api/peers', (_req, res) => {
    const peers = Array.from(connectedClients.values()).map(client => ({
      ...client.peer,
      signalStrength: 0.5 + Math.random() * 0.5,
    }));
    res.json(peers);
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let clientId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'register': {
            const profile = message.profile;
            if (!profile?.id) break;

            clientId = profile.id;
            
            const peer: Peer = {
              id: profile.id,
              name: profile.name || `User_${profile.id.slice(0, 4)}`,
              deviceId: profile.id.slice(0, 12).toUpperCase(),
              signalStrength: 0.7 + Math.random() * 0.3,
              isConnected: true,
              lastSeen: Date.now(),
            };

            connectedClients.set(clientId, { ws, peer });
            console.log(`Peer registered: ${peer.name} (${peer.id})`);
            
            notifyPeerConnected(peer, clientId);
            broadcastPeerList();
            break;
          }

          case 'scan': {
            broadcastPeerList();
            break;
          }

          case 'connect': {
            const targetId = message.peerId;
            const targetClient = connectedClients.get(targetId);
            
            if (targetClient && clientId) {
              const sourceClient = connectedClients.get(clientId);
              if (sourceClient) {
                targetClient.ws.send(JSON.stringify({
                  type: 'connection_request',
                  from: sourceClient.peer,
                }));
              }
            }
            break;
          }

          case 'message': {
            const targetId = message.to;
            const targetClient = connectedClients.get(targetId);
            
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'message',
                from: message.from,
                content: message.content,
                timestamp: Date.now(),
              }));
              console.log(`Message relayed from ${message.from?.name} to ${targetId}`);
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (clientId) {
        const client = connectedClients.get(clientId);
        if (client) {
          console.log(`Peer disconnected: ${client.peer.name}`);
        }
        connectedClients.delete(clientId);
        notifyPeerDisconnected(clientId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized for P2P signaling');

  return httpServer;
}
