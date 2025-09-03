'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

/**
 * Hook to fetch chat messages from the database
 * @returns The messages from the database
 */
export function useMessagesQuery() {
  const [data, setData] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        
        // Fetch messages from the messages table
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
        
        if (error) throw error
        
        // Transform the data to match the ChatMessage interface
        const formattedMessages: ChatMessage[] = messages.map((message) => ({
          id: message.id,
          content: message.content,
          user: {
            name: message.user_name,
          },
          createdAt: message.created_at,
        }))
        
        setData(formattedMessages)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        interface DatabaseMessage {
          id: string;
          content: string;
          user_name: string;
          created_at: string;
        }
        
        const newMessage = payload.new as DatabaseMessage
        
        // Add the new message to the state
        setData((prevMessages) => [
          ...prevMessages,
          {
            id: newMessage.id,
            content: newMessage.content,
            user: {
              name: newMessage.user_name,
            },
            createdAt: newMessage.created_at,
          },
        ])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return { data, isLoading, error }
}
