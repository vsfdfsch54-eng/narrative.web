"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { checkV2UserStatus } from '@/lib/user-helpers-v2'
import { Plus, Calendar, MapPin, Clock } from 'lucide-react'
import { CreateEventModal } from '@/components/ui/create-event-modal'

export default function EventsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loops, setLoops] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  // Load events and loops
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [eventsRes, loopsRes] = await Promise.all([
          fetch(`/api/events?userId=${user.id}`),
          fetch(`/api/loops?userId=${user.id}`),
        ])

        const eventsData = await eventsRes.json()
        const loopsData = await loopsRes.json()

        if (eventsData.success) {
          setEvents(eventsData.data || [])
        }

        if (loopsData.success) {
          setLoops((loopsData.data || []).map((loop: any) => ({
            id: loop.id,
            title: loop.title,
          })))
        }
      } catch (error) {
        console.error('[EventsPage] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const handleCreateEvent = async (data: {
    title: string
    description: string
    dateTime: string
    location: string
    visibility: string
    growthEnabled: boolean
    loopId?: string
  }) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: data.title,
          description: data.description,
          dateTime: data.dateTime,
          location: data.location,
          visibilityLayer: data.visibility,
          growthEnabled: data.growthEnabled,
          loopId: data.loopId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload events
        const eventsResponse = await fetch(`/api/events?userId=${user.id}`)
        const eventsData = await eventsResponse.json()
        if (eventsData.success) {
          setEvents(eventsData.data || [])
        }
      } else {
        throw new Error(result.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('[EventsPage] Error creating event:', error)
      throw error
    }
  }

  const handleOpenEvent = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  )

  // Separate upcoming and past events
  const now = new Date()
  const upcomingEvents = sortedEvents.filter(e => new Date(e.date_time) >= now)
  const pastEvents = sortedEvents.filter(e => new Date(e.date_time) < now)

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

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[32]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['3xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            margin: 0,
          }}>
            Events
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.full,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} color={tokensV2.colors.textOnDark} />
          </motion.button>
        </div>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          margin: 0,
          marginTop: tokensV2.spacing[8],
          opacity: 0.9,
        }}>
          Upcoming and past events
        </p>
      </div>

      {/* Events List */}
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}>
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section>
            <h2 style={{
              fontSize: tokensV2.typography.fontSize.xl,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[16],
            }}>
              Upcoming
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokensV2.spacing[16],
            }}>
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  {...animations.fadeUp}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenEvent(event.id)}
                  style={{
                    padding: tokensV2.spacing[24],
                    borderRadius: tokensV2.borderRadius.medium,
                    background: tokensV2.colors.backgroundWhite,
                    boxShadow: tokensV2.shadows.small,
                    cursor: 'pointer',
                  }}
                >
                  <h3 style={{
                    fontSize: tokensV2.typography.fontSize.xl,
                    fontWeight: tokensV2.typography.fontWeight.semibold,
                    color: tokensV2.colors.textPrimary,
                    margin: 0,
                    marginBottom: tokensV2.spacing[12],
                  }}>
                    {event.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokensV2.spacing[8],
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokensV2.spacing[8],
                    }}>
                      <Clock size={16} color={tokensV2.colors.textSecondary} />
                      <span style={{
                        fontSize: tokensV2.typography.fontSize.sm,
                        color: tokensV2.colors.textSecondary,
                      }}>
                        {new Date(event.date_time).toLocaleString()}
                      </span>
                    </div>
                    {event.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokensV2.spacing[8],
                      }}>
                        <MapPin size={16} color={tokensV2.colors.textSecondary} />
                        <span style={{
                          fontSize: tokensV2.typography.fontSize.sm,
                          color: tokensV2.colors.textSecondary,
                        }}>
                          {event.location}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 style={{
              fontSize: tokensV2.typography.fontSize.xl,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[16],
            }}>
              Past
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokensV2.spacing[16],
            }}>
              {pastEvents.map((event) => (
                <motion.div
                  key={event.id}
                  {...animations.fadeUp}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenEvent(event.id)}
                  style={{
                    padding: tokensV2.spacing[24],
                    borderRadius: tokensV2.borderRadius.medium,
                    background: tokensV2.colors.backgroundWhite,
                    boxShadow: tokensV2.shadows.small,
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                >
                  <h3 style={{
                    fontSize: tokensV2.typography.fontSize.xl,
                    fontWeight: tokensV2.typography.fontWeight.semibold,
                    color: tokensV2.colors.textPrimary,
                    margin: 0,
                    marginBottom: tokensV2.spacing[12],
                  }}>
                    {event.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokensV2.spacing[8],
                  }}>
                    <Clock size={16} color={tokensV2.colors.textSecondary} />
                    <span style={{
                      fontSize: tokensV2.typography.fontSize.sm,
                      color: tokensV2.colors.textSecondary,
                    }}>
                      {new Date(event.date_time).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <motion.div
            {...animations.fadeUp}
            style={{
              padding: tokensV2.spacing[48],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundWhite,
              boxShadow: tokensV2.shadows.small,
              textAlign: 'center',
            }}
          >
            <Calendar size={48} color={tokensV2.colors.textMuted} style={{ marginBottom: tokensV2.spacing[16] }} />
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
              marginBottom: tokensV2.spacing[8],
            }}>
              No events yet
            </p>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textMuted,
              margin: 0,
            }}>
              Create an event to get started!
            </p>
          </motion.div>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateEvent}
        availableLoops={loops}
      />

      <NavbarV2 />
    </div>
  )
}

