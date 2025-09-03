'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Lock, MessageSquare, PlusCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
  isAuthenticated?: boolean
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
  isAuthenticated = false,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  })
  const [newMessage, setNewMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [authState, setAuthState] = useState(isAuthenticated)
  const supabase = createClient()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthState(!!user)
    }
    
    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthState(!!session?.user)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // Merge messages and group by parent/child relationships for thread structure
  const allMessages = useMemo(() => {
    const msgs = [...initialMessages, ...realtimeMessages]
    
    // Count replies for each parent message
    const replyCountMap = msgs.reduce((acc, msg) => {
      if (msg.parentId) {
        acc[msg.parentId] = (acc[msg.parentId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    // Add reply counts to parent messages
    return msgs.map(msg => ({
      ...msg,
      replyCount: replyCountMap[msg.id] || 0
    }))
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected || !authState) return

      // Include parentId in the message object if replying to a message
      sendMessage(newMessage, replyingTo)
      console.log(replyingTo)
      setNewMessage('')
      setReplyingTo(null)
    },
    [newMessage, isConnected, sendMessage, authState, replyingTo]
  )
  
  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId)
    // Focus the input field
    const inputField = document.getElementById('message-input')
    if (inputField) {
      inputField.focus()
    }
  }, [])

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Forum Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion Forum
          </h2>
          <div className="text-xs text-muted-foreground">
            {allMessages.length} {allMessages.length === 1 ? 'post' : 'posts'}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <div className="text-muted-foreground mb-2">No posts yet</div>
            <div className="text-sm">Be the first to start the discussion!</div>
          </div>
        ) : (
          <div className="space-y-6">
            {allMessages.filter(msg => !msg.parentId).map((message: ChatMessage) => {
              return (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <ChatMessageItem
                    message={message}
                    isOwnMessage={message.user.name === username}
                    showHeader={true}
                    onReply={authState ? handleReply : undefined}
                    replies={allMessages.filter(msg => msg.parentId === message.id)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        {!authState ? (
          <div className="flex w-full items-center justify-center gap-2 py-4 text-muted-foreground bg-muted/20 rounded-lg">
            <Lock className="size-4" />
            <span>Please sign in to create a post</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              <h3 className="font-medium">
                {replyingTo ? (
                  <>
                    Reply to post
                    <span className="text-xs text-muted-foreground ml-2">
                      {allMessages.find(msg => msg.id === replyingTo)?.content.substring(0, 30)}...
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 text-xs"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : 'Create a new post'}
              </h3>
            </div>
            <Input
              id="message-input"
              className="w-full bg-background text-sm min-h-[100px] resize-y"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? "Write your reply..." : "What's on your mind?"}
              disabled={!isConnected || !authState}
            />
            <div className="flex justify-end">
              <Button
                className={cn(
                  "gap-2",
                  (!isConnected || !newMessage.trim() || !authState) && "opacity-50"
                )}
                type="submit"
                disabled={!isConnected || !newMessage.trim() || !authState}
              >
                <Send className="size-4" />
                {replyingTo ? 'Reply' : 'Post'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}