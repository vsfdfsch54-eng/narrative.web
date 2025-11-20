"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { BottomNav } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function ConversationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || loading) return
    
    const loadConversations = async () => {
      const userId = getUserId()
      if (!userId) return
      
      try {
        // Get recent chats from database
        const response = await fetch(`/api/chats?userId=${userId}&type=recent&limit=10`)
        const data = await response.json()
        if (data.success && data.data) {
          // Get last message for each match
          const conversationsWithMessages = await Promise.all(
            data.data.map(async (match: any) => {
              const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
              // Get last message
              const msgResponse = await fetch(`/api/messages?matchId=${match.id}`)
              const msgData = await msgResponse.json()
              const lastMessage = msgData.success && msgData.data && msgData.data.length > 0
                ? msgData.data[msgData.data.length - 1]
                : null
              
              // Format time
              const timeAgo = (date: string) => {
                const now = new Date()
                const msgDate = new Date(date)
                const diffMs = now.getTime() - msgDate.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMs / 3600000)
                const diffDays = Math.floor(diffMs / 86400000)
                
                if (diffMins < 1) return "Just now"
                if (diffMins < 60) return `${diffMins}m ago`
                if (diffHours < 24) return `${diffHours}h ago`
                return `${diffDays}d ago`
              }

              return {
                id: otherUserId,
                name: `User ${otherUserId.slice(0, 5)}`,
                emoji: "👤",
                lastMessage: lastMessage?.text || "Start conversation",
                time: lastMessage ? timeAgo(lastMessage.created_at) : "New",
                status: "online" as const
              }
            })
          )
          setConversations(conversationsWithMessages)
        } else {
          // Fallback to empty or mock data
          setConversations([])
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    
    loadConversations()
  }, [user, loading])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content pb-4 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between px-3 py-2",
                "border-b border-white/10 bg-black",
                "sticky top-0 z-10 flex-shrink-0"
              )}>
                <button
                  onClick={() => router.push("/vibe")}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white/80" />
                </button>
                
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Conversations
                </h1>
                
                <div className="w-9" /> {/* Spacer */}
              </div>

              {/* Content - Modern List */}
              <div className="flex-1 p-3 space-y-1.5 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-sm">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60 text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => router.push(`/chat/${person.id}`)}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg",
                      "bg-white/5 border border-white/10",
                      "hover:bg-white/8 hover:border-white/15",
                      "transition-all duration-200",
                      "touch-manipulation cursor-pointer pointer-events-auto relative z-10"
                    )}
                  >
                    {/* Avatar with status */}
                    <div className="relative flex-shrink-0">
                      <span className="text-2xl">{person.emoji}</span>
                      {person.status === "online" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black" />
                      )}
                      {person.status === "away" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-black" />
                      )}
                    </div>
                    
                    {/* Message Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-white/90 truncate">{person.name}</p>
                        {person.status === "online" && (
                          <span className="text-[9px] text-green-400 font-medium">●</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 truncate">{person.lastMessage}</p>
                    </div>
                    
                    {/* Time */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-[10px] text-white/50">{person.time}</p>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
