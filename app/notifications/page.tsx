"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/hooks/useNotifications"
import { AppShell } from "@/components/AppShell"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { Notification } from "@/hooks/useNotifications"
import { User } from "lucide-react"

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
  
  // Format as date if older
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

  // Filter out empty groups
  return groups.filter(group => group.notifications.length > 0)
}

// Helper to get navigation URL based on notification type
function getNotificationUrl(notification: Notification): string {
  const { type, metadata } = notification
  
  switch (type) {
    case 'friend_chat_request':
      return metadata?.userId ? `/chat/${metadata.userId}` : '/conversations'
    case 'community_added':
      return metadata?.userId ? `/profile?userId=${metadata.userId}` : '/profile'
    case 'event_invite':
      return metadata?.eventId ? `/calendar/event?id=${metadata.eventId}` : '/calendar'
    case 'match_found':
      return metadata?.matchId ? `/chat?matchId=${metadata.matchId}` : '/conversations'
    case 'message_received':
      return metadata?.threadId ? `/chat?threadId=${metadata.threadId}` : '/conversations'
    default:
      return '/conversations'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

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
        const { completed, step, apiError } = await checkOnboardingStatus(user.id)

        if (apiError) {
          console.warn('[NotificationsPage] ⚠️ API error checking onboarding - allowing access to prevent loop')
          setCheckingOnboarding(false)
          return
        }

        if (!completed) {
          const redirectPath = `/onboarding?step=${step}`
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          if (currentPath === redirectPath) {
            console.warn('[NotificationsPage] ⚠️ Already on target path, skipping redirect')
            setCheckingOnboarding(false)
            return
          }
          router.replace(redirectPath)
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
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    // Navigate based on type
    const url = getNotificationUrl(notification)
    router.push(url)
  }

  const groupedNotifications = groupNotifications(notifications)

  if (authLoading || checkingOnboarding) {
    return (
      <AppShell title="Notifications">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Notifications">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[16],
      }}>
        {/* Mark all as read button */}
        {notifications.length > 0 && notifications.some(n => !n.is_read) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={markAllAsRead}
              style={{
                padding: `${tokens.spacing[8]} ${tokens.spacing[12]}`,
                background: 'transparent',
                border: `1px solid ${tokens.colors.textSecondary}`,
                borderRadius: tokens.radii.button,
                color: tokens.colors.textSecondary,
                fontSize: tokens.typography.label.fontSize,
                fontWeight: tokens.typography.label.fontWeight,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.textPrimaryOnDark
                e.currentTarget.style.color = tokens.colors.textPrimaryOnDark
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.textSecondary
                e.currentTarget.style.color = tokens.colors.textSecondary
              }}
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <p style={{ color: tokens.colors.textSecondary }}>Loading notifications...</p>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            padding: tokens.spacing[32],
          }}>
            <User style={{ 
              width: '48px', 
              height: '48px', 
              color: tokens.colors.textSecondary,
              marginBottom: tokens.spacing[16],
              opacity: 0.3,
            }} />
            <p style={{
              fontSize: tokens.typography.heading.fontSize,
              color: tokens.colors.textPrimaryOnDark,
              marginBottom: tokens.spacing[8],
            }}>
              No notifications yet
            </p>
            <p style={{
              fontSize: tokens.typography.body.fontSize,
              color: tokens.colors.textSecondary,
            }}>
              Your notifications will appear here
            </p>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label} style={{ marginBottom: tokens.spacing[24] }}>
              <h2 style={{
                fontSize: tokens.typography.label.fontSize,
                fontWeight: tokens.typography.label.fontWeight,
                color: tokens.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: tokens.spacing[12],
                paddingLeft: tokens.spacing[4],
              }}>
                {group.label}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[8] }}>
                {group.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: tokens.spacing[12],
                      padding: tokens.spacing[16],
                      background: notification.is_read 
                        ? 'rgba(255,255,255,0.02)' 
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${notification.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.is_read 
                        ? 'rgba(255,255,255,0.02)' 
                        : 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = notification.is_read 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(255,255,255,0.10)'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: notification.sender?.avatar_url 
                        ? `url(${notification.sender.avatar_url})` 
                        : tokens.colors.surface1,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: tokens.colors.textOnPill,
                      fontSize: '16px',
                      fontWeight: 600,
                    }}>
                      {!notification.sender?.avatar_url && notification.sender?.name 
                        ? notification.sender.name.charAt(0).toUpperCase()
                        : <User size={20} />
                      }
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: tokens.spacing[8],
                        marginBottom: tokens.spacing[4],
                      }}>
                        <h3 style={{
                          fontSize: tokens.typography.body.fontSize,
                          fontWeight: 600,
                          color: tokens.colors.textPrimaryOnDark,
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
                            background: tokens.colors.accentBlue,
                            flexShrink: 0,
                            marginTop: '4px',
                          }} />
                        )}
                      </div>
                      
                      <p style={{
                        fontSize: tokens.typography.body.fontSize,
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        marginBottom: tokens.spacing[4],
                        lineHeight: 1.4,
                      }}>
                        {notification.body}
                      </p>
                      
                      <p style={{
                        fontSize: tokens.typography.label.fontSize,
                        color: tokens.colors.textSecondary,
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
    </AppShell>
  )
}

