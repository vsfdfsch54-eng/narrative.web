"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { EndConvoModal } from "@/components/ui/end-convo-modal"
import { Message } from "@/lib/types"
import { Send, ArrowLeft, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { tokens } from "@/lib/design-tokens"
import { AppShell } from "@/components/AppShell"

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
      router.push("/")
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
  
  // Get match ID from URL params or find existing match
  const getMatchId = async () => {
    if (!currentUserId || !chatId) return null
    
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search)
    const matchIdFromUrl = urlParams.get('matchId')
    if (matchIdFromUrl) {
      return matchIdFromUrl
    }
    
      // Try to find existing match in database
    try {
      const response = await fetch(`/api/matches?userId=${currentUserId}`)
      const data = await response.json()
      if (data.success && data.data) {
        const match = data.data
        // Check if this match involves the chatId user
        if ((match.user1_id === currentUserId && match.user2_id === chatId) ||
            (match.user2_id === currentUserId && match.user1_id === chatId)) {
          return match.id
        }
      }
    } catch (error) {
      console.error('Error finding match:', error)
    }
    
    return null
  }
  
  const [matchId, setMatchId] = useState<string | null>(null)
  
  useEffect(() => {
    if (currentUserId && chatId) {
      getMatchId().then(setMatchId)
    }
  }, [currentUserId, chatId])

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
    
    // Poll for new messages every 2 seconds
    const messagePollInterval = setInterval(loadMessages, 2000)
    
    return () => clearInterval(messagePollInterval)
    
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
      const timeLimitMinutes = Number(savedTimeLimit)
      if (!isNaN(timeLimitMinutes) && timeLimitMinutes > 0) {
      const timeLimitMs = timeLimitMinutes * 60 * 1000
      setTimeRemaining(timeLimitMs)
      }
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
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: currentUserId,
          text: messageText,
        })
      })
      
      const data = await response.json()
      if (data.success && data.data) {
        // Replace optimistic message with real one from database
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? {
                id: data.data.id,
                senderId: data.data.sender_id,
                content: data.data.text,
                timestamp: new Date(data.data.created_at),
                read: true,
              }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error saving message:', error)
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
    }
  }

  const handleAddToCommunity = async () => {
    if (!currentUserId || !chatId) return
    
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1Id: currentUserId,
          user2Id: chatId,
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // Show success feedback (could add a toast notification here)
        console.log('Added to community!')
      }
    } catch (error) {
      console.error('Error adding to community:', error)
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
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 140px)',
        maxHeight: 'calc(100vh - 140px)',
        paddingTop: tokens.spacing[20],
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing[20],
          paddingBottom: tokens.spacing[16],
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], flex: 1, minWidth: 0 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/vibe")}
              style={{
                padding: tokens.spacing[8],
                borderRadius: tokens.radii.pill,
                background: 'transparent',
                border: 'none',
                color: tokens.colors.textPrimaryOnDark,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
            </motion.button>
            
            <div style={{ fontSize: '32px' }}>
              {profileGender === "male" ? "👨" : "👩"}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                ...tokens.typography.heading,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[4],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {profileName}
              </h2>
              <p style={{
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
                fontSize: '12px',
              }}>
                {timeRemaining !== null && timeRemaining > 0
                  ? `Time left: ${formatTimeRemaining(timeRemaining)}`
                  : getStatusText()}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[10] }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCommunity}
              style={{
                padding: `8px ${tokens.spacing[14]}`,
                borderRadius: tokens.radii.pill,
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                boxShadow: tokens.shadows.pillUnselected,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[8],
              }}
            >
              <Users style={{ width: '14px', height: '14px' }} />
              Add
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEndModal(true)}
              style={{
                padding: `8px ${tokens.spacing[14]}`,
                borderRadius: tokens.radii.pill,
                background: 'transparent',
                border: `1px solid rgba(255,255,255,0.12)`,
                color: tokens.colors.textPrimaryOnDark,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              End
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${tokens.spacing[12]} 0`,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[12],
        }}>
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center',
            }}>
              <div>
                <p style={{
                  ...tokens.typography.body,
                  color: tokens.colors.textSecondary,
                  margin: 0,
                  marginBottom: tokens.spacing[8],
                }}>
                  Start the conversation!
                </p>
                <p style={{
                  ...tokens.typography.label,
                  color: tokens.colors.textMuted,
                  margin: 0,
                }}>
                  Say hello to {profileName}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <ChatBubble
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                  />
                </div>
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          paddingTop: tokens.spacing[16],
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          marginTop: tokens.spacing[16],
        }}>
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            gap: tokens.spacing[12],
            alignItems: 'center',
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  width: '100%',
                  padding: `10px ${tokens.spacing[14]}`,
                  borderRadius: tokens.radii.input,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 400,
                  letterSpacing: '0',
                  outline: 'none',
                }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!message.trim()}
              style={{
                padding: tokens.spacing[10],
                borderRadius: tokens.radii.button,
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                boxShadow: tokens.shadows.pillUnselected,
                cursor: !message.trim() ? 'not-allowed' : 'pointer',
                opacity: !message.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
              }}
            >
              <Send style={{ width: '18px', height: '18px' }} />
            </motion.button>
          </form>
        </div>
      </div>

      {/* End Conversation Modal */}
      <EndConvoModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndConvo}
        profileName={profileName}
      />
    </AppShell>
  )
}
