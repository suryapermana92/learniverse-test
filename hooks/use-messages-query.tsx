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
          parentId: message.parent_id || undefined,
        }))
        
        // Calculate reply counts for each message
        const messagesWithReplyCounts = formattedMessages.map(message => {
          const replyCount = formattedMessages.filter(m => m.parentId === message.id).length
          return {
            ...message,
            replyCount: replyCount > 0 ? replyCount : undefined
          }
        })
        
        setData(messagesWithReplyCounts)
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
          parent_id?: string;
        }
        
        const newMessage = payload.new as DatabaseMessage
        
        // Create the new message object
        const messageObj: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          user: {
            name: newMessage.user_name,
          },
          createdAt: newMessage.created_at,
          parentId: newMessage.parent_id || undefined,
          replyCount: undefined
        }
        
        // Add the new message to the state and update reply counts
        setData((prevMessages) => {
          const updatedMessages = [...prevMessages, messageObj]
          
          // If this is a reply, update the parent's reply count
          if (messageObj.parentId) {
            return updatedMessages.map(msg => {
              if (msg.id === messageObj.parentId) {
                const currentReplyCount = msg.replyCount || 0
                return {
                  ...msg,
                  replyCount: currentReplyCount + 1
                }
              }
              return msg
            })
          }
          
          return updatedMessages
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return { data, isLoading, error }
}
