"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { Message } from "@/lib/types"
import { Send } from "lucide-react"

interface ChatInterfaceProps {
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  loading?: boolean
}

export function ChatInterface({
  messages,
  currentUserId,
  onSendMessage,
  loading = false,
}: ChatInterfaceProps) {
  const [message, setMessage] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              currentUserId={currentUserId}
              onReactionToggle={async (messageId, emoji) => {
                // Handle reaction toggle if needed
                console.log('Reaction toggle:', messageId, emoji)
              }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-4 flex gap-2"
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" variant="primary" size="icon" disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

