"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { EndConvoModal } from "@/components/ui/end-convo-modal"
import { ChatSearch } from "@/components/ui/chat-search"
import { Message } from "@/lib/types"
import { Send, ArrowLeft, Users, Image as ImageIcon, Paperclip } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { tokens } from "@/lib/design-tokens"
import { AppShell } from "@/components/AppShell"
import { useRealtimeChat } from "@/hooks/use-realtime-chat"
import { useTypingIndicator } from "@/hooks/use-typing-indicator"
import { usePresence } from "@/hooks/use-presence"
import { supabase } from "@/lib/supabaseClient"

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const [message, setMessage] = useState("")
  const [showEndModal, setShowEndModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [profileName, setProfileName] = useState("User")
  const [profileGender, setProfileGender] = useState<"male" | "female">("male")
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [otherUserPresence, setOtherUserPresence] = useState<{ isOnline: boolean; lastSeenAt: Date | null }>({
    isOnline: false,
    lastSeenAt: null,
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        const response = await fetch(`/api/users?userId=${chatId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setProfileName(data.data.name || "User")
          setProfileGender("male")
        } else {
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
    
    const urlParams = new URLSearchParams(window.location.search)
    const matchIdFromUrl = urlParams.get('matchId')
    if (matchIdFromUrl) {
      return matchIdFromUrl
    }
    
    try {
      const response = await fetch(`/api/matches?userId=${currentUserId}`)
      const data = await response.json()
      if (data.success && data.data) {
        const match = data.data
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

  // Real-time chat hook
  const { messages, setMessages } = useRealtimeChat(matchId, currentUserId)
  
  // Listen for match status changes (when other user ends conversation)
  useEffect(() => {
    if (!matchId || !currentUserId) return
    
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMatch = payload.new as any
          if (updatedMatch.status === 'ended') {
            // Other user ended the conversation - redirect to feedback
            console.log('[ChatDetailPage] Match ended by other user')
            localStorage.setItem("feedbackChatId", chatId)
            localStorage.setItem("feedbackProfileName", profileName)
            setTimeout(() => {
              router.push("/feedback")
            }, 100)
          }
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [matchId, currentUserId, chatId, profileName, router])

  // Typing indicator hook
  const { isOtherUserTyping, setTyping } = useTypingIndicator(matchId, currentUserId, chatId)

  // Presence hook
  const { presence, getOtherUserPresence } = usePresence(currentUserId)

  // Load other user's presence
  useEffect(() => {
    if (!chatId) return
    const loadPresence = async () => {
      const presenceData = await getOtherUserPresence(chatId)
      setOtherUserPresence(presenceData)
    }
    loadPresence()
    const interval = setInterval(loadPresence, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [chatId, getOtherUserPresence])

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!matchId || !currentUserId || messages.length === 0) return

    const unreadMessages = messages.filter(
      msg => msg.senderId !== currentUserId && !msg.read && !msg.readAt
    )

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id)
      fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId: currentUserId,
          messageIds,
        }),
      }).catch(console.error)
    }
  }, [messages, matchId, currentUserId])

  // Update presence when match changes
  useEffect(() => {
    if (!currentUserId || !matchId) return
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        isOnline: true,
        currentMatchId: matchId,
      }),
    }).catch(console.error)
  }, [currentUserId, matchId])

  // Track recent chat
  useEffect(() => {
    if (!chatId || !profileName) return
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
      const updatedChats = recentChats.slice(0, 10)
      localStorage.setItem("recentChats", JSON.stringify(updatedChats))
    }
  }, [chatId, profileName, profileGender])

  // Get time limit from localStorage
  useEffect(() => {
    const savedTimeLimit = localStorage.getItem("timeLimit")
    if (savedTimeLimit) {
      const timeLimitMinutes = Number(savedTimeLimit)
      if (!isNaN(timeLimitMinutes) && timeLimitMinutes > 0) {
        const timeLimitMs = timeLimitMinutes * 60 * 1000
        setTimeRemaining(timeLimitMs)
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOtherUserTyping])

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    
    // Set typing status
    if (e.target.value.trim() && matchId) {
      setTyping(true)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false)
      }, 2000)
    } else {
      setTyping(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !message.trim() || !matchId) return
    
    setTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    const messageText = message.trim()
    setMessage("")
    
    // Optimistically add message to UI
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: messageText,
      timestamp: new Date(),
      read: false,
      messageType: 'text',
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
          messageType: 'text',
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
                read: !!data.data.read_at,
                readAt: data.data.read_at ? new Date(data.data.read_at) : null,
                reactions: data.data.reactions || {},
                messageType: data.data.message_type || 'text',
                fileUrl: data.data.file_url,
                fileName: data.data.file_name,
                fileSize: data.data.file_size,
              }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error saving message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!matchId || !currentUserId) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('matchId', matchId)
      formData.append('userId', currentUserId)

      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const { url, fileName, fileSize, fileType } = uploadData.data

      // Send message with file
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: currentUserId,
          text: fileName,
          messageType: fileType,
          fileUrl: url,
          fileName,
          fileSize,
        })
      })

      const messageData = await messageResponse.json()
      if (!messageData.success) {
        throw new Error('Failed to send file message')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleReactionToggle = async (messageId: string, emoji: string) => {
    if (!currentUserId) return

    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userId: currentUserId,
          emoji,
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update message reactions in local state
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
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
        alert(`${profileName} will receive a notification to add you back!`)
      } else {
        alert('Failed to send community request. Please try again.')
      }
    } catch (error) {
      console.error('Error adding to community:', error)
      alert('Failed to send community request. Please try again.')
    }
  }

  const handleEndConvo = async () => {
    if (!matchId) {
      console.error('[ChatDetailPage] No matchId to end conversation')
      return
    }
    
    setShowEndModal(false)
    
    try {
      // Update match status to 'ended' in database
      // This will be detected by the other user via realtime
      const response = await fetch('/api/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status: 'ended' }),
      })
      
      if (!response.ok) {
        console.error('[ChatDetailPage] Failed to end conversation')
        alert('Failed to end conversation. Please try again.')
        return
      }
      
      // Store feedback info and redirect
      localStorage.setItem("feedbackChatId", chatId)
      localStorage.setItem("feedbackProfileName", profileName)
      setTimeout(() => {
        router.push("/feedback")
      }, 100)
    } catch (error) {
      console.error('[ChatDetailPage] Error ending conversation:', error)
      alert('Failed to end conversation. Please try again.')
    }
  }

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getStatusText = () => {
    if (otherUserPresence.isOnline) return "Active now"
    if (otherUserPresence.lastSeenAt) {
      const diff = Date.now() - otherUserPresence.lastSeenAt.getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return "Active now"
      if (minutes < 60) return `Last seen ${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `Last seen ${hours}h ago`
      return `Last seen ${Math.floor(hours / 24)}d ago`
    }
    return "Offline"
  }

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.style.background = 'rgba(255,255,255,0.1)'
      setTimeout(() => {
        element.style.background = 'transparent'
      }, 2000)
    }
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
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: tokens.spacing[20],
        paddingBottom: tokens.spacing[20],
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing[20],
          paddingBottom: tokens.spacing[16],
          // No border - using spacing only
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
            <ChatSearch messages={messages} onMessageSelect={scrollToMessage} />
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
                border: 'none',
                boxShadow: tokens.shadows.pillUnselected,
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
          overflowX: 'hidden',
          padding: `${tokens.spacing[12]} 0`,
          minHeight: 0,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[12],
          WebkitOverflowScrolling: 'touch',
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
                <div key={msg.id} id={`message-${msg.id}`}>
                  <ChatBubble
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                    currentUserId={currentUserId || ''}
                    onReactionToggle={handleReactionToggle}
                  />
                </div>
              ))}
              {isOtherUserTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          paddingTop: tokens.spacing[16],
          // No border - using spacing only
          marginTop: tokens.spacing[16],
        }}>
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            gap: tokens.spacing[12],
            alignItems: 'center',
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileUpload(file)
                }
              }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              style={{
                padding: tokens.spacing[10],
                borderRadius: tokens.radii.button,
                background: 'transparent',
                border: 'none',
                color: tokens.colors.textPrimaryOnDark,
                cursor: uploadingFile ? 'not-allowed' : 'pointer',
                opacity: uploadingFile ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
              }}
            >
              <Paperclip style={{ width: '18px', height: '18px' }} />
            </motion.button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
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
              disabled={!message.trim() || uploadingFile}
              style={{
                padding: tokens.spacing[10],
                borderRadius: tokens.radii.button,
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                boxShadow: tokens.shadows.pillUnselected,
                cursor: (!message.trim() || uploadingFile) ? 'not-allowed' : 'pointer',
                opacity: (!message.trim() || uploadingFile) ? 0.5 : 1,
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
