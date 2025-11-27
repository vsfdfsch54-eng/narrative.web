"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"

export default function ConversationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  // Routing guard: Check auth and onboarding status
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // USER LOGGED OUT → Redirect to welcome page
    if (!user) {
      router.replace("/")
      return
    }

    // USER LOGGED IN → Check onboarding status
    async function checkOnboarding() {
      if (!user) return
      
      try {
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        // NEVER redirect on API errors - causes redirect loops
        if (apiError) {
          console.warn('[ConversationsPage] ⚠️ API error checking onboarding - allowing access to prevent loop')
          // Allow access - don't redirect on API errors
          return
        }

        if (!completed) {
          // Incomplete onboarding → redirect to onboarding
          // Safety check: prevent redirect loops
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[ConversationsPage] ⚠️ Already on target path, skipping redirect to prevent loop')
            return
          }
          router.replace(redirectPath)
          return
        }

        // Complete onboarding → allow access to conversations page
        // No redirect needed, just render the page
      } catch (error) {
        console.error('[ConversationsPage] Error checking onboarding:', error)
        // On error, allow access - don't redirect to prevent loops
        console.warn('[ConversationsPage] ⚠️ Error in checkOnboarding - allowing access to prevent loop')
      }
    }

    checkOnboarding()
  }, [user, authLoading])

  useEffect(() => {
    if (!user || authLoading || loading) return
    
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
                matchId: match.id,
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
  }, [user, authLoading, loading])

  if (authLoading || loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading conversations...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: '100px'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
          paddingBottom: tokens.spacing[32],
        }}>
          <div style={{
            maxWidth: tokens.layout.maxWidth,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[32],
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: tokens.colors.textPrimaryOnDark,
                margin: '0 0 8px 0',
              }}>
                Conversations
              </h1>
            </div>

            {conversations.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                textAlign: 'center',
                padding: tokens.spacing[32],
              }}>
                <MessageCircle 
                  style={{
                    width: '48px',
                    height: '48px',
                    color: tokens.colors.textSecondary,
                    marginBottom: tokens.spacing[16],
                    opacity: 0.3
                  }}
                />
                <p style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: tokens.colors.textPrimaryOnDark,
                  marginBottom: tokens.spacing[8],
                }}>
                  No conversations yet
                </p>
                <p style={{
                  fontSize: '14px',
                  color: tokens.colors.textSecondary,
                  maxWidth: '300px',
                }}>
                  Your conversations will be saved here once you start chatting with someone.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing[12],
              }}>
                {conversations.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => router.push(`/chat/${person.id}${person.matchId ? `?matchId=${person.matchId}` : ''}`)}
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing[12],
                      padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.05)',
                      color: tokens.colors.textPrimaryOnDark,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    }}
                  >
                    {/* Avatar with status */}
                    <div style={{
                      position: 'relative',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '24px' }}>{person.emoji}</span>
                      {person.status === "online" && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#38B57A',
                          border: '2px solid #0B0B0D',
                        }} />
                      )}
                      {person.status === "away" && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#E69A3B',
                          border: '2px solid #0B0B0D',
                        }} />
                      )}
                    </div>
                    
                    {/* Message Info */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing[8],
                      }}>
                        <p style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: tokens.colors.textPrimaryOnDark,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {person.name}
                        </p>
                        {person.status === "online" && (
                          <span style={{
                            fontSize: '8px',
                            color: '#38B57A',
                            fontWeight: 500,
                          }}>●</span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: tokens.colors.textSecondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {person.lastMessage}
                      </p>
                    </div>
                    
                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}>
                      <p style={{
                        fontSize: '11px',
                        color: tokens.colors.textSecondary,
                        opacity: 0.7,
                      }}>
                        {person.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
