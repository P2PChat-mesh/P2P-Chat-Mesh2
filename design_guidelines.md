# P2P Chat App - Design Guidelines

## Brand Identity

**Purpose**: Decentralized peer-to-peer messaging with zero server storage. Messages exist only on connected devices, ensuring true privacy.

**Aesthetic Direction**: **Brutally minimal with encrypted-vault feel** - stark interfaces, maximum clarity, trust through transparency. Dark-first design with technical precision. The memorable element: **real-time peer connection visualization** showing the mesh network status.

**Differentiation**: Visual representation of P2P connections. Users SEE who they're connected to, signal strength, and that no server exists between them.

## Navigation Architecture

**Root Navigation**: Drawer + Stack
- Drawer contains: Active chats list, Nearby peers, Settings
- Main view: Current chat or peer discovery screen
- Floating action: "New Connection" (scan QR/Bluetooth discovery)

## Screen-by-Screen Specifications

### 1. Peer Discovery Screen (Landing)
**Purpose**: Find and connect to nearby peers
- **Header**: Transparent, title "Nearby Peers", right button: Settings gear icon
- **Layout**: 
  - Scrollable root view (top inset: headerHeight + Spacing.xl, bottom: Spacing.xl)
  - Radar-style visualization showing discovered peers (animated pulses)
  - List of available peers below with signal strength indicators
- **Components**: Peer cards (avatar, name, signal strength bars, "Connect" button), empty state when no peers found
- **Floating**: Large "Scan QR Code" button (bottom right, bottom inset: Spacing.xl)

### 2. Chat List (Drawer Content)
**Purpose**: Access active conversations
- **Layout**: FlatList of chat items
- **Components**: Chat row (avatar, name, last message preview, connection status dot, timestamp), empty state illustration
- **States**: Green dot = peer online/reachable, gray dot = offline

### 3. Chat Screen
**Purpose**: Send/receive messages with connected peer
- **Header**: Custom header with peer name, connection status subtitle ("Connected • 2 bars"), left: back, right: info icon
- **Layout**: 
  - Inverted FlatList for messages (top inset: headerHeight + Spacing.xl, bottom: 60 + Spacing.xl)
  - Message bubbles (sent: right-aligned, received: left-aligned)
  - Input bar fixed at bottom (text input + send icon button)
- **Components**: Message bubbles with timestamps, typing indicator, "Reconnecting..." banner when peer disconnects
- **Visual**: Subtle encryption lock icon on each sent message

### 4. Peer Info Screen
**Purpose**: View connection details and manage chat
- **Header**: Transparent, title "Connection Info", left: back
- **Layout**: ScrollView form (top inset: headerHeight + Spacing.xl, bottom: insets.bottom + Spacing.xl)
- **Components**: 
  - Peer avatar (large, centered)
  - Name and device ID
  - Connection stats (signal strength, packets sent/received)
  - Share QR code button
  - Delete conversation (red, bottom of form)

### 5. Settings Screen
**Purpose**: Configure profile and app preferences
- **Header**: Transparent, title "Settings", left: drawer menu icon
- **Layout**: ScrollView form (top inset: headerHeight + Spacing.xl, bottom: insets.bottom + Spacing.xl)
- **Components**:
  - Profile section: Avatar picker, display name field
  - Preferences: Notifications toggle, auto-connect to known peers toggle
  - About section: How P2P works explanation, open source licenses

## Color Palette

**Primary**: #00FF88 (electric green - encrypted/connected state)
**Background**: #0A0A0A (near-black, not pure black)
**Surface**: #1A1A1A (cards, input fields)
**Surface Elevated**: #2A2A2A (drawer, modals)
**Text Primary**: #FFFFFF
**Text Secondary**: #888888
**Error/Disconnect**: #FF3B30
**Warning**: #FFD60A

## Typography

**Font**: System (SF Pro for iOS, Roboto for Android)
**Scale**:
- **Large Title**: 34pt, Bold (screen titles)
- **Title**: 20pt, Semibold (headers)
- **Body**: 16pt, Regular (messages, chat previews)
- **Caption**: 13pt, Regular (timestamps, metadata)
- **Label**: 11pt, Medium, ALL CAPS (section headers)

## Visual Design

- **Message Bubbles**: Sent (Primary color with 10% opacity), Received (Surface color), 16px border radius, no shadows
- **Peer Cards**: Surface color, 12px border radius, 1px border (#2A2A2A)
- **Connection Indicators**: Animated pulse for radar, solid dots for status
- **Floating Button**: Primary color, 56px diameter, shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- **Icons**: Feather icon set, consistent 24px size

## Assets to Generate

1. **icon.png** - App icon: Abstract mesh network nodes in primary green on dark background
2. **splash-icon.png** - Same as app icon, used during launch
3. **empty-peers.png** - Illustration: Simple radar circles with "No peers nearby" - WHERE USED: Peer Discovery empty state
4. **empty-chats.png** - Illustration: Two disconnected nodes - WHERE USED: Chat List drawer when no conversations
5. **avatar-default-1.png** - Geometric pattern avatar (green/dark) - WHERE USED: Default user avatar option
6. **avatar-default-2.png** - Geometric pattern avatar (alternative) - WHERE USED: Default user avatar option
7. **p2p-explainer.png** - Simple diagram showing phone-to-phone connection without server - WHERE USED: Settings > About section