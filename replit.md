# MeshChat - Replit.md

## Overview

MeshChat is a peer-to-peer (P2P) messaging application built with React Native/Expo for the frontend and Express.js for the backend. The app enables decentralized communication where users can discover nearby peers, establish connections, and exchange messages through WebSocket-based real-time communication. The design philosophy emphasizes privacy with a dark, minimal "encrypted-vault" aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54, using the new architecture
- **Navigation**: React Navigation with a hybrid pattern - bottom tabs for main sections (Peers, Chats, Settings) with native stack navigators nested within each tab
- **State Management**: React Context (P2PContext) for P2P connection state, TanStack React Query for server state
- **UI Components**: Custom themed components (ThemedText, ThemedView, Button, Card) with consistent dark theme styling
- **Animations**: React Native Reanimated for smooth animations and gestures
- **Local Storage**: AsyncStorage for persisting user profiles, chats, and messages on-device

### Backend Architecture
- **Server**: Express.js with TypeScript, running on Node.js
- **Real-time Communication**: WebSocket server (ws library) for peer discovery and message relay
- **API Pattern**: RESTful endpoints with WebSocket for real-time features
- **Storage**: In-memory storage class (MemStorage) with Drizzle ORM schema defined for PostgreSQL (database not yet provisioned)

### Directory Structure
- `client/` - React Native/Expo frontend code
  - `components/` - Reusable UI components
  - `screens/` - Screen components for navigation
  - `navigation/` - Navigation configuration
  - `context/` - React Context providers
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and API client
  - `constants/` - Theme and styling constants
- `server/` - Express.js backend code
- `shared/` - Shared types and schemas between client and server
- `assets/` - Static assets (images, icons)

### Key Design Patterns
- **Path Aliases**: `@/` maps to `client/`, `@shared/` maps to `shared/`
- **Theme System**: Centralized Colors, Spacing, Typography, and BorderRadius constants
- **Screen Options Hook**: Consistent header styling via `useScreenOptions()` hook
- **Error Boundaries**: React error boundary with development-mode error details

## External Dependencies

### Real-time Communication
- **WebSocket (ws)**: Server-side WebSocket implementation for peer discovery and message relay
- **Connection Pattern**: Clients connect via WebSocket to discover peers and exchange messages in real-time

### Database
- **Drizzle ORM**: Schema defined in `shared/schema.ts` for PostgreSQL
- **Current State**: Using in-memory storage; PostgreSQL integration prepared but not provisioned
- **Schema**: Users table with id, username, password fields

### Key Libraries
- **Expo SDK 54**: Core mobile framework with plugins for splash screen, haptics, blur effects
- **React Navigation 7**: Navigation framework with native-stack and bottom-tabs
- **TanStack React Query**: Server state management and caching
- **React Native Reanimated**: Animation library
- **Zod**: Schema validation (integrated via drizzle-zod)

### Build & Development
- **Metro Bundler**: Expo's JavaScript bundler for React Native
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development server

## Building Native Apps

### Testing in Expo Go
The app is fully compatible with Expo Go. Scan the QR code from the Replit URL bar menu to test on your physical device.

### Building Android APK
To build an Android APK for distribution, use Expo Application Services (EAS):

1. **Install EAS CLI** (run outside Replit):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS Build** (create eas.json):
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

4. **Build APK**:
   ```bash
   eas build -p android --profile preview
   ```

### Building for iOS TestFlight
To build for iOS TestFlight testing:

1. **Apple Developer Account**: Required ($99/year)

2. **Configure EAS for iOS**:
   ```json
   {
     "build": {
       "production": {
         "ios": {
           "simulator": false
         }
       }
     }
   }
   ```

3. **Build for iOS**:
   ```bash
   eas build -p ios --profile production
   ```

4. **Submit to TestFlight**:
   ```bash
   eas submit -p ios
   ```

### Important Notes
- EAS builds run in the cloud and don't require a Mac for iOS builds
- The bundle identifiers are already configured in app.json:
  - Android: `com.meshchat.app`
  - iOS: `com.meshchat.app`
- For production, update the backend URL in the environment to point to your published Replit deployment

## Recent Changes

### January 2026
- Fixed WebSocket connection state handling to prevent INVALID_STATE_ERR
- Memoized all context functions with useCallback to prevent infinite re-renders
- Added proper WebSocket readyState checks before sending messages
- Rebuilt static bundle for Expo Go compatibility