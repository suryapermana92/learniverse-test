import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
  onReply?: (parentId: string) => void
  replies?: ChatMessage[]
}

export const ChatMessageItem = ({ message, isOwnMessage, onReply, replies = [] }: ChatMessageItemProps) => {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedDate = new Date(message.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Card className={cn('mb-4 w-full border shadow-sm', {
      'border-primary/20 bg-primary/5': isOwnMessage,
      'border-muted bg-background': !isOwnMessage,
    })}>
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar
          className={cn(
            isOwnMessage ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20 text-muted-foreground'
          )}
          fallback={getInitials(message.user.name)}
        />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{message.user.name} {isOwnMessage ? '(You)' : ''}</span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="text-sm">
          {message.content}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {message.replyCount ? `${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}` : ''}
        </div>
        {onReply && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={() => onReply(message.id)}
          >
            <MessageSquare className="h-3 w-3" />
            Reply
          </Button>
        )}
      </CardFooter>
      {replies.length > 0 && (
        <div className="ml-8 pl-4 border-l border-border">
          {replies.map(reply => (
            <ChatMessageItem 
              key={reply.id}
              message={reply}
              isOwnMessage={reply.user.name === message.user.name}
              showHeader={true}
            />
          ))}
        </div>
      )}
    </Card>
  )
}