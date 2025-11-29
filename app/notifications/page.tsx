"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/hooks/useNotifications"
import { tokensV2 } from "@/lib/design-tokens-v2"
import { checkV2UserStatus } from "@/lib/user-helpers-v2"
import { Notification } from "@/hooks/useNotifications"
import { User } from "lucide-react"
import { CommunityRequestModal } from "@/components/ui/community-request-modal"
import { NavbarV2 } from "@/components/ui/navbar-v2"

// Helper to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffMs = now.getTime() - notificationDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return notificationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper to group notifications by time
function groupNotifications(notifications: Notification[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const groups: {
    label: string
    notifications: Notification[]
  }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Earlier', notifications: [] },
  ]

  notifications.forEach(notification => {
    const notifDate = new Date(notification.created_at)
    
    if (notifDate >= today) {
      groups[0].notifications.push(notification)
    } else if (notifDate >= yesterday) {
      groups[1].notifications.push(notification)
    } else if (notifDate >= weekAgo) {
      groups[2].notifications.push(notification)
    } else {
      groups[3].notifications.push(notification)
    }
  })

  return groups.filter(group => group.notifications.length > 0)
}

// Helper to get navigation URL based on notification type (V2 routes only)
async function getNotificationUrl(notification: Notification, currentUserId: string): Promise<string> {
  const { type, metadata } = notification
  
  switch (type) {
    case 'friend_chat_request':
      // V2: Navigate to loops
      return '/loops'
    case 'community_added':
      return '/notifications'
    case 'event_invite':
      // V2: Navigate to events
      return metadata?.eventId ? `/events/${metadata.eventId}` : '/events'
    case 'match_found':
      // V2: Navigate to matchmaking or loops
      return '/match-v2'
    case 'message_received':
      // V2: Navigate to loops
      if (metadata?.loopId) {
        return `/loops/${metadata.loopId}`
      }
      return '/loops'
    default:
      return '/home-v2'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [selectedCommunityRequest, setSelectedCommunityRequest] = useState<Notification | null>(null)

  // Routing guard: Check auth and onboarding status
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace("/")
      return
    }

    async function checkOnboarding() {
      if (!user) return
      
      try {
        const status = await checkV2UserStatus(user.id)

        if (status.needsOnboarding) {
          router.replace('/onboarding-v2')
          return
        }

        setCheckingOnboarding(false)
      } catch (error) {
        console.error('[NotificationsPage] Error checking onboarding:', error)
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [user, authLoading, router])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    if (notification.type === 'community_added' && notification.sender_id) {
      setSelectedCommunityRequest(notification)
      return
    }
    
    if (!user) return
    
    const url = await getNotificationUrl(notification, user.id)
    router.push(url)
  }
  
  const handleAcceptCommunityRequest = async () => {
    if (!selectedCommunityRequest || !user) return
    
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1Id: user.id,
          user2Id: selectedCommunityRequest.sender_id,
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSelectedCommunityRequest(null)
      } else {
        alert('Failed to add to community. Please try again.')
      }
    } catch (error) {
      console.error('Error accepting community request:', error)
      alert('Failed to add to community. Please try again.')
    }
  }
  
  const handleDeclineCommunityRequest = () => {
    setSelectedCommunityRequest(null)
  }

  const groupedNotifications = groupNotifications(notifications)

  if (authLoading || checkingOnboarding) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['2xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
        }}>
          Notifications
        </h1>

        {/* Mark all as read button */}
        {notifications.length > 0 && notifications.some(n => !n.is_read) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={markAllAsRead}
              style={{
                padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[12]}`,
                background: 'transparent',
                border: `1px solid ${tokensV2.colors.borderMedium}`,
                borderRadius: tokensV2.borderRadius.medium,
                color: tokensV2.colors.textSecondary,
                fontSize: tokensV2.typography.fontSize.sm,
                fontWeight: tokensV2.typography.fontWeight.medium,
                cursor: 'pointer',
              }}
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <p style={{ color: tokensV2.colors.textSecondary }}>Loading notifications...</p>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            padding: tokensV2.spacing[32],
          }}>
            <User style={{ 
              width: '48px', 
              height: '48px', 
              color: tokensV2.colors.textSecondary,
              marginBottom: tokensV2.spacing[16],
              opacity: 0.3,
            }} />
            <p style={{
              fontSize: tokensV2.typography.fontSize.lg,
              color: tokensV2.colors.textPrimary,
              marginBottom: tokensV2.spacing[8],
            }}>
              No notifications yet
            </p>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
            }}>
              Your notifications will appear here
            </p>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label} style={{ marginBottom: tokensV2.spacing[28] }}>
              <h2 style={{
                fontSize: tokensV2.typography.fontSize.sm,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                color: tokensV2.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: tokensV2.spacing[12],
              }}>
                {group.label}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[8] }}>
                {group.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: tokensV2.spacing[12],
                      padding: tokensV2.spacing[16],
                      background: notification.is_read 
                        ? tokensV2.colors.backgroundWhite
                        : tokensV2.colors.backgroundWhite,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      borderRadius: tokensV2.borderRadius.medium,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: notification.sender?.avatar_url 
                        ? `url(${notification.sender.avatar_url})` 
                        : tokensV2.colors.backgroundWhite,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {!notification.sender?.avatar_url && (
                        <User size={20} color={tokensV2.colors.textSecondary} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: tokensV2.spacing[8],
                        marginBottom: tokensV2.spacing[4],
                      }}>
                        <h3 style={{
                          fontSize: tokensV2.typography.fontSize.base,
                          fontWeight: tokensV2.typography.fontWeight.semibold,
                          color: tokensV2.colors.textPrimary,
                          margin: 0,
                          flex: 1,
                        }}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: tokensV2.colors.accentSky,
                            flexShrink: 0,
                            marginTop: '4px',
                          }} />
                        )}
                      </div>
                      
                      <p style={{
                        fontSize: tokensV2.typography.fontSize.sm,
                        color: tokensV2.colors.textSecondary,
                        margin: 0,
                        marginBottom: tokensV2.spacing[4],
                        lineHeight: 1.4,
                      }}>
                        {notification.body}
                      </p>
                      
                      <p style={{
                        fontSize: tokensV2.typography.fontSize.xs,
                        color: tokensV2.colors.textSecondary,
                        margin: 0,
                        opacity: 0.7,
                      }}>
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <CommunityRequestModal
        isOpen={!!selectedCommunityRequest}
        onClose={handleDeclineCommunityRequest}
        onAccept={handleAcceptCommunityRequest}
        onDecline={handleDeclineCommunityRequest}
        senderName={selectedCommunityRequest?.sender?.name || selectedCommunityRequest?.title || 'User'}
        senderId={selectedCommunityRequest?.sender_id || ''}
      />

      <NavbarV2 />
    </div>
  )
}
