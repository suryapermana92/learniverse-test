# Realtime Chat Setup

This document provides instructions for setting up the realtime chat functionality in the Learniverse application.

## Database Setup

The chat functionality requires a `messages` table in your Supabase database. Follow these steps to set it up:

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy and paste the contents of `lib/supabase/schema.sql` into the SQL editor
4. Run the SQL commands to create the necessary tables and policies

## Environment Variables

Make sure your `.env.local` file includes the following Supabase environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Enabling Realtime

To enable realtime functionality in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Database → Replication
3. Enable the "Realtime" option
4. Add the `messages` table to the realtime publication

## Features

The chat functionality includes:

- Realtime messaging between users
- Persistent message storage in Supabase
- User identification based on authentication
- Message history loading
- Automatic scrolling to new messages

## Components

- `RealtimeChat`: The main chat component
- `ChatMessageItem`: Individual message display
- `use-realtime-chat`: Hook for realtime messaging
- `use-messages-query`: Hook for fetching message history
- `use-chat-scroll`: Hook for automatic scrolling
- `store-messages`: Utility for saving messages to the database

## Usage

To add the chat to a page:

```tsx
import { RealtimeChat } from '@/components/realtime-chat'
import { useMessagesQuery } from '@/hooks/use-messages-query'
import { storeMessages } from '@/lib/store-messages'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

export default function ChatPage() {
  const { data: messages } = useMessagesQuery()
  
  const handleMessage = async (messages: ChatMessage[]) => {
    await storeMessages(messages)
  }
 
  return (
    <RealtimeChat 
      roomName="room-name" 
      username="user-name" 
      onMessage={handleMessage}
      messages={messages} 
    />
  )
}
```
