import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

/**
 * Store messages in the database
 * @param messages - The messages to store
 */
export async function storeMessages(messages: ChatMessage[]) {
  const supabase = createClient()
  
  // Only store messages that don't already exist in the database
  // We'll use the message ID to check for duplicates
  const newMessages = messages.map(message => ({
    id: message.id,
    content: message.content,
    user_name: message.user.name,
    created_at: message.createdAt,
  }))
  
  if (newMessages.length === 0) return
  
  // Use upsert to avoid duplicates
  const { error } = await supabase
    .from('messages')
    .upsert(newMessages, { 
      onConflict: 'id',
      ignoreDuplicates: true 
    })
  
  if (error) {
    console.error('Error storing messages:', error)
  }
}
