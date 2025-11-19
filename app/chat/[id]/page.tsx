"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { EndConvoModal } from "@/components/ui/end-convo-modal"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Message } from "@/lib/types"
import { Send, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [profileName, setProfileName] = useState("User")
  const [profileGender, setProfileGender] = useState<"male" | "female">("male")
  const [loadingProfile, setLoadingProfile] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { user, loading: authLoading } = useAuth()
  
  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  const currentUserId = getUserId()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])
  
  // Load profile information
  useEffect(() => {
    if (!chatId || !currentUserId) return

    const loadProfile = async () => {
      setLoadingProfile(true)
      try {
        // Try to get profile from match or user ID
        const response = await fetch(`/api/users?userId=${chatId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setProfileName(data.data.name || "User")
          // Default to male if gender not available
          setProfileGender("male")
        } else {
          // Fallback: use chatId as name
          setProfileName(`User ${chatId.slice(0, 5)}`)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setProfileName(`User ${chatId.slice(0, 5)}`)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [chatId, currentUserId])
  
  // Get or create match ID
  const getMatchId = () => {
    if (!currentUserId || !chatId) return null
    
    let matchId = localStorage.getItem(`match_${chatId}`)
    if (!matchId) {
      // Try to find existing match in database
      // For now, create a temporary match ID
      matchId = `temp_${currentUserId}_${chatId}_${Date.now()}`
      localStorage.setItem(`match_${chatId}`, matchId)
    }
    return matchId
  }
  
  const matchId = getMatchId()

  useEffect(() => {
    if (!user || !currentUserId || !matchId) return
    
    // Load messages from database
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${matchId}`)
        const data = await response.json()
        if (data.success && data.data) {
          // Convert database messages to UI format
          const dbMessages: Message[] = data.data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            content: msg.text,
            timestamp: new Date(msg.created_at),
            read: true,
          }))
          setMessages(dbMessages)
        } else {
          // No messages yet - start with empty array
          setMessages([])
        }
      } catch (error) {
        console.error('Error loading messages:', error)
        setMessages([])
      }
    }
    
    loadMessages()
    
    // Track recent chat
    const recentChats = JSON.parse(localStorage.getItem("recentChats") || "[]")
    const chatExists = recentChats.find((chat: { id: string }) => chat.id === chatId)
    
    if (!chatExists) {
      const newChat = {
        id: chatId,
        name: profileName,
        emoji: profileGender === "male" ? "👨" : "👩",
        time: "Just now",
        timestamp: new Date().toISOString(),
      }
      recentChats.unshift(newChat)
      // Keep only last 10 chats
      const updatedChats = recentChats.slice(0, 10)
      localStorage.setItem("recentChats", JSON.stringify(updatedChats))
    }

    // Get time limit from localStorage
    const savedTimeLimit = localStorage.getItem("timeLimit")
    if (savedTimeLimit) {
      const timeLimitMinutes = parseInt(savedTimeLimit, 10)
      const timeLimitMs = timeLimitMinutes * 60 * 1000
      setTimeRemaining(timeLimitMs)
    }
  }, [chatId, matchId, currentUserId, user, profileName, profileGender])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          // Time's up - navigate to feedback
          localStorage.setItem("feedbackChatId", chatId)
          localStorage.setItem("feedbackProfileName", profileName)
          router.push("/feedback")
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, chatId, profileName, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !message.trim() || !matchId) return
    
    const messageText = message.trim()
    setMessage("")
    
    // Optimistically add message to UI
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: messageText,
      timestamp: new Date(),
      read: false,
    }
    setMessages(prev => [...prev, newMessage])
    
    // Save to database
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: currentUserId,
          text: messageText,
        })
      })
    } catch (error) {
      console.error('Error saving message:', error)
      // Optionally revert optimistic update
    }
  }

  const handleEndConvo = () => {
    // Close modal first
    setShowEndModal(false)
    // Save chat info for feedback page
    localStorage.setItem("feedbackChatId", chatId)
    localStorage.setItem("feedbackProfileName", profileName)
    // Navigate to feedback
    setTimeout(() => {
      router.push("/feedback")
    }, 100)
  }

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getStatusText = () => {
    if (isOnline) return "Active now"
    return "Last seen 5m ago"
  }

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black">
      {/* Phone Frame Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[375px] mx-auto"
      >
        {/* Phone Frame - Black & White */}
        <div className="relative bg-[#0A0A0A] rounded-[24px] p-1 border border-white/10">
          {/* Phone Screen */}
          <div className="bg-black rounded-[22px] relative flex flex-col h-[600px] sm:h-[800px] overflow-hidden">
            <div className="flex flex-col flex-1 pb-20 overflow-y-auto scrollbar-hide min-h-0">
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3",
                "border-b border-white/10 bg-black",
                "sticky top-0 z-10 flex-shrink-0"
              )}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push("/vibe")}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-white/80" />
                  </motion.button>
                  
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-2xl">
                      {profileGender === "male" ? "👨" : "👩"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-white truncate">
                        {profileName}
                      </h2>
                      <p className="text-xs text-white/60">
                        {timeRemaining !== null && timeRemaining > 0
                          ? `Time left: ${formatTimeRemaining(timeRemaining)}`
                          : getStatusText()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEndModal(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold",
                    "border border-white/10 bg-white/5",
                    "text-white hover:bg-white/10",
                    "transition-all duration-200",
                    "touch-manipulation cursor-pointer"
                  )}
                >
                  End Convo
                </motion.button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <p className="text-white/60 text-sm mb-1">
                        Start the conversation!
                      </p>
                      <p className="text-white/50 text-xs">
                        Say hello to {profileName}
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: index * 0.015,
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        style={{ willChange: "transform, opacity" }}
                      >
                        <ChatBubble
                          message={msg}
                          isOwn={msg.senderId === currentUserId}
                        />
                      </motion.div>
                    ))}
                    {isTyping && <TypingIndicator />}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={cn(
                "px-4 py-3 border-t border-white/10",
                "bg-black",
                "sticky bottom-0 flex-shrink-0"
              )}>
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className={cn(
                        "w-full px-4 py-2.5 rounded-full",
                        "bg-white/5 border border-white/10",
                        "text-white placeholder:text-white/50",
                        "transition-all duration-200",
                        "focus:outline-none focus:border-white/20",
                        "focus:ring-1 focus:ring-white/20",
                        "text-sm"
                      )}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!message.trim()}
                    className={cn(
                      "p-2.5 rounded-full",
                      "bg-white text-black",
                      "border border-white",
                      "transition-all duration-200",
                      "hover:bg-white/95",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "touch-manipulation cursor-pointer"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </form>
              </div>
            </div>
            
            {/* Bottom Navigation - Inside phone screen, part of layout */}
            <BottomNav />
          </div>
        </div>
      </motion.div>

      {/* End Conversation Modal */}
      <EndConvoModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndConvo}
        profileName={profileName}
      />
    </div>
  )
}
