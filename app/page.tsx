'use client'

// realtime chat page between users
import { RealtimeChat } from '@/components/realtime-chat'
import { useMessagesQuery } from '@/hooks/use-messages-query'
import { storeMessages } from '@/lib/store-messages'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { useEffect, useState } from 'react'
import { ClientAuthButton } from '@/components/client-auth-button'

export default function ChatPage() {
  const { data: messages } = useMessagesQuery()
  const [username, setUsername] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const supabase = createClient()
  
  // Get current user's name and authentication status
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Try to get the name from user metadata
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
        setUsername(name)
        setIsAuthenticated(true)
      } else {
        setUsername('Guest')
        setIsAuthenticated(false)
      }
    }
    
    fetchUserProfile()
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Anonymous'
        setUsername(name)
        setIsAuthenticated(true)
      } else {
        setUsername('Guest')
        setIsAuthenticated(false)
      }
    })
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])
  
  const handleMessage = async (messages: ChatMessage[]) => {
    // Store messages in your database
    await storeMessages(messages)
  }
 
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Chat Room</h1>
        <ClientAuthButton />
      </div>
      <div className="flex-1 overflow-hidden">
        <RealtimeChat 
          roomName="my-chat-room" 
          username={username || 'Guest'} 
          onMessage={handleMessage}
          messages={messages}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}