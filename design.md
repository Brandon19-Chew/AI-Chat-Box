# Zrytium AI - Mobile App Design

## Overview
Zrytium AI is a mobile chat application that provides an AI assistant experience similar to DeepSeek. The app features Google authentication, intelligent conversation management with auto-generated titles, and a clean, intuitive interface optimized for mobile devices.

## Design Principles
- **Mobile-First**: Optimized for portrait orientation (9:16) with one-handed usage in mind
- **iOS-Native Feel**: Follows Apple Human Interface Guidelines with standard iOS patterns
- **Simplicity**: Clean interface focused on chat experience without clutter
- **Accessibility**: Clear typography, sufficient touch targets, and intuitive navigation

## Screen List

### 1. Authentication Screen (Login)
- **Purpose**: Allow users to sign in using their Google account
- **Content**:
  - Zrytium AI logo and branding
  - App description/tagline
  - "Sign in with Google" button
  - Terms of service link (optional)
- **Functionality**:
  - Redirect to Google OAuth flow
  - Secure token storage after successful login
  - Auto-redirect to Home screen on success

### 2. Home Screen (Chat List)
- **Purpose**: Display all conversations and provide quick access to start new chats
- **Content**:
  - Header with "Zrytium AI" title and user profile/logout button
  - List of recent conversations with:
    - Auto-generated conversation title
    - Last message preview (truncated)
    - Timestamp of last activity
    - Swipe-to-delete or long-press menu for deletion
  - Floating action button (FAB) to start new chat
  - Empty state message when no conversations exist
- **Functionality**:
  - Tap conversation to open chat detail
  - Swipe or long-press to delete conversation
  - Prevent duplicate new chats (only one "New Chat" entry at a time)
  - Pull-to-refresh to sync conversations

### 3. Chat Screen (Conversation Detail)
- **Purpose**: Display individual conversation and handle user-AI interaction
- **Content**:
  - Header with conversation title and options menu
  - Message list showing:
    - User messages (right-aligned, blue/primary color)
    - AI responses (left-aligned, gray/surface color)
    - Timestamps for each message
    - Loading indicator while AI is responding
  - Input area with:
    - Text input field with placeholder "Ask Zrytium AI..."
    - Send button (enabled only when text is present)
    - Optional: attachment button for future expansion
- **Functionality**:
  - Send message and display immediately
  - Show loading state while waiting for AI response
  - Auto-scroll to latest message
  - Keyboard handling (dismiss on send, show on focus)
  - Copy message text (long-press)
  - Delete individual messages (long-press menu)

### 4. Settings Screen (Profile/Logout)
- **Purpose**: User account management and app settings
- **Content**:
  - User profile section:
    - User avatar/initial
    - User email
    - User name
  - Settings options:
    - Theme toggle (Light/Dark mode)
    - Clear all conversations (with confirmation)
  - Logout button with confirmation dialog
- **Functionality**:
  - Toggle between light and dark mode
  - Clear all chat history with confirmation
  - Logout with session cleanup

## Primary Content and Functionality

### Conversation Management
- **Auto-Generated Titles**: First AI response is analyzed to generate a concise title (e.g., "Python Debugging Help", "Travel Recommendations")
- **No Duplicate New Chats**: System prevents creating multiple "New Chat" entries; users can only have one active new conversation
- **Persistent Storage**: Conversations saved locally using AsyncStorage (or backend if user requires sync)
- **Conversation Deletion**: Users can delete individual conversations or clear all history

### Chat Functionality
- **Message History**: Full conversation history displayed in chronological order
- **AI Integration**: Messages sent to backend LLM for processing
- **Real-time Feedback**: Loading indicators and typing states
- **Message Actions**: Copy, delete, or retry failed messages

### Authentication
- **Google OAuth**: Secure login using Google account
- **Session Management**: Persistent login with secure token storage
- **Logout**: Clean session termination and local data cleanup

## Key User Flows

### Flow 1: First-Time User Login
1. User launches app → sees Login screen
2. Taps "Sign in with Google" → redirected to Google OAuth
3. Completes Google authentication → returns to app
4. App stores authentication token securely
5. Redirected to Home screen (empty state)

### Flow 2: Start New Conversation
1. User on Home screen → taps FAB or "New Chat" button
2. Navigates to Chat screen with empty message list
3. Types message in input field → taps Send
4. Message appears immediately (user-side)
5. Loading indicator shows while AI processes
6. AI response appears in chat
7. System generates title based on first exchange
8. Conversation appears in Home screen list

### Flow 3: Continue Existing Conversation
1. User on Home screen → taps conversation from list
2. Chat screen opens with full message history
3. User types new message → taps Send
4. Message appended to conversation
5. AI responds with new message
6. Conversation timestamp updates

### Flow 4: Delete Conversation
1. User on Home screen → swipes or long-presses conversation
2. Delete option appears
3. User confirms deletion
4. Conversation removed from list

### Flow 5: Logout
1. User taps profile/settings icon
2. Navigates to Settings screen
3. Taps "Logout" button
4. Confirmation dialog appears
5. User confirms → session cleared
6. Redirected to Login screen

## Color Choices

### Primary Brand Colors
- **Primary Accent**: `#0a7ea4` (Teal/Blue) - Used for buttons, links, and highlights
- **Background**: Light mode: `#ffffff` | Dark mode: `#151718`
- **Surface**: Light mode: `#f5f5f5` | Dark mode: `#1e2022`
- **Foreground (Text)**: Light mode: `#11181C` | Dark mode: `#ECEDEE`
- **Muted (Secondary Text)**: Light mode: `#687076` | Dark mode: `#9BA1A6`
- **Border**: Light mode: `#E5E7EB` | Dark mode: `#334155`

### Message Colors
- **User Message**: `#0a7ea4` (Primary teal, right-aligned)
- **AI Message**: `#f5f5f5` (Surface color, left-aligned)
- **System Message**: `#687076` (Muted, center-aligned)

### Status Colors
- **Success**: `#22C55E` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)
- **Loading**: `#0a7ea4` (Primary teal)

## Layout Specifications

### Typography
- **App Title**: 28px, Bold
- **Screen Titles**: 24px, Semibold
- **Section Headers**: 18px, Semibold
- **Body Text**: 16px, Regular
- **Small Text**: 14px, Regular
- **Captions**: 12px, Regular

### Spacing
- **Screen Padding**: 16px (standard)
- **Section Gap**: 24px
- **Component Gap**: 12px
- **Message Spacing**: 8px vertical

### Components
- **Button Height**: 48px (touch-friendly)
- **Input Field Height**: 44px
- **List Item Height**: 72px (conversation card)
- **Message Bubble Max Width**: 85% of screen width
- **Corner Radius**: 12px (standard), 24px (buttons)

## Navigation Structure

```
Login Screen
    ↓ (on successful auth)
Home Screen (Tab 1)
    ├→ Chat Screen (detail view)
    └→ Settings Screen (Tab 2)
         ├→ Theme Settings
         └→ Logout
```

## Future Enhancements (Out of Scope for MVP)
- Voice input/output
- Image sharing in chat
- Conversation search
- Conversation folders/organization
- Custom AI model selection
- Conversation export
- Collaborative chat sharing
