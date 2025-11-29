"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { checkV2UserStatus } from '@/lib/user-helpers-v2'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Check, X, HelpCircle } from 'lucide-react'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [event, setEvent] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [userStatus, setUserStatus] = useState<'invited' | 'accepted' | 'declined' | 'maybe' | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Routing guard
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/onboarding-v2')
      return
    }

    const checkStatus = async () => {
      const status = await checkV2UserStatus(user.id)
      if (status.needsOnboarding) {
        router.replace('/onboarding-v2')
      }
    }

    checkStatus()
  }, [user, authLoading, router])

  // Load event data
  useEffect(() => {
    if (!user?.id || !eventId) return

    const loadEvent = async () => {
      try {
        setLoading(true)
        const [eventRes, participantsRes] = await Promise.all([
          fetch(`/api/events/${eventId}?userId=${user.id}`),
          fetch(`/api/events/${eventId}/participants`),
        ])

        const eventData = await eventRes.json()
        const participantsData = await participantsRes.json()

        if (eventData.success) {
          setEvent(eventData.data)
        }
        if (participantsData.success) {
          const parts = participantsData.data || []
          setParticipants(parts)
          // Find user's status
          const userPart = parts.find((p: any) => p.user_id === user.id)
          setUserStatus(userPart?.status || null)
        }
      } catch (error) {
        console.error('[EventDetailPage] Error loading event:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [user?.id, eventId])

  const handleUpdateStatus = async (status: 'accepted' | 'declined' | 'maybe') => {
    if (!user?.id || updating) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status,
          action: userStatus ? 'update' : 'invite',
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUserStatus(status)
        // Reload participants
        const participantsRes = await fetch(`/api/events/${eventId}/participants`)
        const participantsData = await participantsRes.json()
        if (participantsData.success) {
          setParticipants(participantsData.data || [])
        }
      }
    } catch (error) {
      console.error('[EventDetailPage] Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || loading) {
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

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Event not found</p>
      </div>
    )
  }

  const eventDate = new Date(event.date_time)
  const isPast = eventDate < new Date()

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[24]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokensV2.spacing[16],
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            style={{
              padding: tokensV2.spacing[8],
              borderRadius: tokensV2.borderRadius.full,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={tokensV2.colors.textOnDark} />
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: tokensV2.typography.fontSize['2xl'],
              fontWeight: tokensV2.typography.fontWeight.bold,
              margin: 0,
            }}>
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}>
        {/* Event Info Card */}
        <motion.div
          {...animations.fadeUp}
          style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokensV2.spacing[16],
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokensV2.spacing[12],
            }}>
              <Clock size={20} color={tokensV2.colors.textSecondary} />
              <div>
                <p style={{
                  fontSize: tokensV2.typography.fontSize.sm,
                  color: tokensV2.colors.textMuted,
                  margin: 0,
                }}>
                  Date & Time
                </p>
                <p style={{
                  fontSize: tokensV2.typography.fontSize.base,
                  fontWeight: tokensV2.typography.fontWeight.medium,
                  color: tokensV2.colors.textPrimary,
                  margin: 0,
                }}>
                  {eventDate.toLocaleString()}
                </p>
              </div>
            </div>

            {event.location && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokensV2.spacing[12],
              }}>
                <MapPin size={20} color={tokensV2.colors.textSecondary} />
                <div>
                  <p style={{
                    fontSize: tokensV2.typography.fontSize.sm,
                    color: tokensV2.colors.textMuted,
                    margin: 0,
                  }}>
                    Location
                  </p>
                  <p style={{
                    fontSize: tokensV2.typography.fontSize.base,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    margin: 0,
                  }}>
                    {event.location}
                  </p>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokensV2.spacing[12],
            }}>
              <Users size={20} color={tokensV2.colors.textSecondary} />
              <div>
                <p style={{
                  fontSize: tokensV2.typography.fontSize.sm,
                  color: tokensV2.colors.textMuted,
                  margin: 0,
                }}>
                  Participants
                </p>
                <p style={{
                  fontSize: tokensV2.typography.fontSize.base,
                  fontWeight: tokensV2.typography.fontWeight.medium,
                  color: tokensV2.colors.textPrimary,
                  margin: 0,
                }}>
                  {participants.length} {participants.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RSVP Actions */}
        {!isPast && (
          <motion.div
            {...animations.fadeUp}
            style={{
              padding: tokensV2.spacing[24],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundWhite,
              boxShadow: tokensV2.shadows.small,
            }}
          >
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.lg,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[16],
            }}>
              Will you attend?
            </h3>
            <div style={{
              display: 'flex',
              gap: tokensV2.spacing[12],
            }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStatus('accepted')}
                disabled={updating || userStatus === 'accepted'}
                style={{
                  flex: 1,
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  background: userStatus === 'accepted' 
                    ? tokensV2.gradients.primary 
                    : tokensV2.colors.backgroundEggshell,
                  color: userStatus === 'accepted' 
                    ? tokensV2.colors.textOnDark 
                    : tokensV2.colors.textPrimary,
                  border: 'none',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokensV2.spacing[8],
                  fontWeight: tokensV2.typography.fontWeight.medium,
                }}
              >
                <Check size={20} />
                Going
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStatus('maybe')}
                disabled={updating || userStatus === 'maybe'}
                style={{
                  flex: 1,
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  background: userStatus === 'maybe' 
                    ? tokensV2.gradients.subtle 
                    : tokensV2.colors.backgroundEggshell,
                  color: tokensV2.colors.textPrimary,
                  border: 'none',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokensV2.spacing[8],
                  fontWeight: tokensV2.typography.fontWeight.medium,
                }}
              >
                <HelpCircle size={20} />
                Maybe
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStatus('declined')}
                disabled={updating || userStatus === 'declined'}
                style={{
                  flex: 1,
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  background: userStatus === 'declined' 
                    ? tokensV2.colors.backgroundEggshell 
                    : tokensV2.colors.backgroundEggshell,
                  color: tokensV2.colors.textPrimary,
                  border: 'none',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokensV2.spacing[8],
                  fontWeight: tokensV2.typography.fontWeight.medium,
                }}
              >
                <X size={20} />
                Can&apos;t Go
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Participants List */}
        {event.participant_list_visible && participants.length > 0 && (
          <motion.div
            {...animations.fadeUp}
            style={{
              padding: tokensV2.spacing[24],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundWhite,
              boxShadow: tokensV2.shadows.small,
            }}
          >
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.lg,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[16],
            }}>
              Participants
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokensV2.spacing[12],
            }}>
              {participants.map((participant) => (
                <div
                  key={participant.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokensV2.spacing[12],
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: tokensV2.borderRadius.full,
                    background: tokensV2.gradients.subtle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '20px' }}>
                      {participant.user?.nickname?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: tokensV2.typography.fontSize.base,
                      fontWeight: tokensV2.typography.fontWeight.medium,
                      color: tokensV2.colors.textPrimary,
                      margin: 0,
                    }}>
                      {participant.user?.nickname || 'User'}
                    </p>
                    <p style={{
                      fontSize: tokensV2.typography.fontSize.sm,
                      color: tokensV2.colors.textSecondary,
                      margin: 0,
                    }}>
                      {participant.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <NavbarV2 />
    </div>
  )
}

