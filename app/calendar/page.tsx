"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Info, Plus, Sparkles, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { colors, typography, spacing, components, shadows, motion as motionConfig } from "@/lib/design-system"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const friends = {
  "Inner Circle": [],
  "Close Friends": [],
  Community: [],
} as const

const suggestions: any[] = []

const tagColors: Record<string, { dot: string; label: string; color: string }> = {
  "Inner Circle": {
    dot: colors.accent.orange,
    color: colors.accent.orange,
    label: "Core people",
  },
  "Close Friends": {
    dot: colors.accent.blue,
    color: colors.accent.blue,
    label: "Trusted circle",
  },
  Community: {
    dot: colors.accent.green,
    color: colors.accent.green,
    label: "Extended network",
  },
}

const planTemplates = [
  { title: "Brunch + Walk", detail: "Saturday • 11:00 AM • Elmwood Village", vibe: "Warm" },
  { title: "Night Swim", detail: "Friday • 9:30 PM • North Lake", vibe: "Spontaneous" },
  { title: "Micro Gallery Hop", detail: "Thursday • 6:00 PM • Allen St.", vibe: "Creative" },
]

function generateDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  return { firstDay, totalDays }
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedFriendGroup, setSelectedFriendGroup] = useState<keyof typeof friends>("Inner Circle")
  const [showPlanner, setShowPlanner] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [savingEvent, setSavingEvent] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [plannerFields, setPlannerFields] = useState({
    title: "",
    inviteGroup: "Inner Circle" as keyof typeof friends,
    privacy: "private",
    vibe: "Curious",
    notes: "",
  })

  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  useEffect(() => {
    if (!authLoading && !user) {
      // Don't redirect on calendar page, just show empty state
    }
  }, [user, authLoading])

  const { firstDay, totalDays } = useMemo(
    () => generateDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )

  useEffect(() => {
    if (!user || authLoading) {
      setEvents([])
      setLoadingEvents(false)
      return
    }
    
    const loadEvents = async () => {
      const userId = getUserId()
      if (!userId) {
        setEvents([])
        setLoadingEvents(false)
        return
      }
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      try {
        const response = await fetch(`/api/calendar?userId=${userId}&year=${year}&month=${month}`)
        const data = await response.json()
        if (data.success && data.data) {
          const calendarEvents = data.data.map((event: any) => ({
            day: event.day,
            title: event.title,
            time: event.time_slot || "All day",
            tag: event.group_type === 'inner' ? 'Inner Circle' : 
                 event.group_type === 'close' ? 'Close Friends' : 
                 event.group_type === 'community' ? 'Community' : 'General'
          }))
          setEvents(calendarEvents)
        } else {
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading events:', error)
        setEvents([])
      } finally {
        setLoadingEvents(false)
      }
    }
    
    loadEvents()
  }, [currentDate, user, authLoading])

  const eventsForDay = events.filter((event) => event.day === selectedDay)

  const handleDaySelect = (day: number) => {
    setSelectedDay(day)
    setPanelOpen(true)
  }

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      return next
    })
    setSelectedDay(null)
    setPanelOpen(false)
  }

  const handlePlannerField = (field: keyof typeof plannerFields, value: string) => {
    setPlannerFields((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlannerSubmit = async () => {
    const userId = getUserId()
    if (!userId || !selectedDay) {
      setShowPlanner(false)
      return
    }
    
    if (!plannerFields.title.trim()) {
      setSaveError("Please enter a title for your event")
      return
    }

    setSavingEvent(true)
    setSaveError(null)

    try {
      const groupTypeMap: { [key: string]: 'inner' | 'close' | 'community' } = {
        'Inner Circle': 'inner',
        'Close Friends': 'close',
        'Community': 'community'
      }
      
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          day: selectedDay,
          title: plannerFields.title.trim(),
          location: null,
          timeSlot: null,
          groupType: groupTypeMap[plannerFields.inviteGroup] || 'community'
        })
      })
      
      const data = await response.json()
      if (data.success && data.data) {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const reloadResponse = await fetch(`/api/calendar?userId=${userId}&year=${year}&month=${month}`)
        const reloadData = await reloadResponse.json()
        if (reloadData.success && reloadData.data) {
          const calendarEvents = reloadData.data.map((event: any) => ({
            day: event.day,
            title: event.title,
            time: event.time_slot || "All day",
            tag: event.group_type === 'inner' ? 'Inner Circle' : 
                 event.group_type === 'close' ? 'Close Friends' : 
                 event.group_type === 'community' ? 'Community' : 'General'
          }))
          setEvents(calendarEvents)
        }
        setShowPlanner(false)
        setPlannerFields({
          title: "",
          inviteGroup: "Inner Circle",
          privacy: "private",
          vibe: "Curious",
          notes: "",
        })
        setSaveError(null)
      } else {
        setSaveError(data.error || "Failed to save event. Please try again.")
      }
    } catch (error) {
      console.error('Error saving event:', error)
      setSaveError("Network error. Please check your connection and try again.")
    } finally {
      setSavingEvent(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: colors.background }}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  const CreateMomentCard = ({ compact = false }: { compact?: boolean }) => (
    <Card variant="outlined" padding={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Plus className="w-4 h-4" style={{ color: colors.textSecondary }} />
          <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>Create new moment</p>
        </div>
        {!compact && (
          <p style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>
            Curate a hangout, save a ritual, or plan something spontaneous.
          </p>
        )}
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSaveError(null)
            setShowPlanner(true)
          }}
          className="w-full"
        >
          Start a plan
        </Button>
      </div>
    </Card>
  )

  return (
    <div 
      className="fixed inset-0 overflow-hidden w-full h-full"
      style={{
        background: colors.background,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: spacing.screen,
            paddingBottom: spacing.lg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div>
            <h1 style={{ 
              fontSize: typography.h2.fontSize,
              fontWeight: typography.h2.fontWeight,
              letterSpacing: typography.h2.letterSpacing,
              color: colors.textPrimary 
            }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <motion.button
              type="button"
              onClick={() => changeMonth("prev")}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
              style={{
                padding: spacing.sm,
                borderRadius: components.button.radius,
                background: colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => changeMonth("next")}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
              style={{
                padding: spacing.sm,
                borderRadius: components.button.radius,
                background: colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Category Legend */}
        <div 
          style={{
            padding: `0 ${spacing.screen}`,
            paddingBottom: spacing.lg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Card variant="outlined" padding={true}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Info className="w-4 h-4" style={{ color: colors.textSecondary }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.lg }}>
                {Object.entries(tagColors).map(([tag, meta]) => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.dot }} />
                    <span style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ padding: spacing.screen }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Day Headers */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span 
                  key={day} 
                  style={{ 
                    textAlign: 'center',
                    fontSize: typography.caption.fontSize,
                    color: colors.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: spacing.sm,
              }}
            >
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} />
              ))}
              {Array.from({ length: totalDays }).map((_, index) => {
                const day = index + 1
                const today = new Date()
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === currentDate.getMonth() &&
                  today.getFullYear() === currentDate.getFullYear()
                const dayEvents = events.filter((event) => event.day === day)
                const eventTag = dayEvents.length > 0 ? dayEvents[0].tag : null
                const eventColor = eventTag ? tagColors[eventTag]?.color : null

                return (
                  <motion.button
                    key={day}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleDaySelect(day)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: components.card.radius,
                      border: `1px solid ${selectedDay === day ? colors.textPrimary : isToday ? colors.borderStrong : colors.border}`,
                      background: selectedDay === day 
                        ? colors.textPrimary 
                        : eventColor 
                        ? `${eventColor}15`
                        : colors.background,
                      color: selectedDay === day ? colors.background : colors.textPrimary,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ 
                      fontSize: typography.body.fontSize, 
                      fontWeight: isToday ? 600 : 400,
                    }}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: spacing.xs, 
                        display: 'flex', 
                        gap: '2px',
                      }}>
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              width: '4px', 
                              height: '4px', 
                              borderRadius: '50%', 
                              background: tagColors[event.tag]?.dot || colors.textMuted 
                            }} 
                          />
                        ))}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day Panel */}
      <AnimatePresence>
        {panelOpen && selectedDay && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
            className="fixed inset-0 z-40 flex items-end"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setPanelOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
              className="w-full"
              style={{
                background: colors.background,
                borderTopLeftRadius: components.card.radius,
                borderTopRightRadius: components.card.radius,
                maxHeight: '80vh',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: spacing.screen }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
                  <div>
                    <p style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selected</p>
                    <h2 style={{ 
                      fontSize: typography.h2.fontSize,
                      fontWeight: typography.h2.fontWeight,
                      color: colors.textPrimary,
                    }}>
                      {monthNames[currentDate.getMonth()]} {selectedDay}
                    </h2>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                    onClick={() => setPanelOpen(false)}
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: components.button.radius,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: typography.caption.fontSize,
                    }}
                  >
                    Back
                  </motion.button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, overflowY: 'auto', maxHeight: '60vh' }}>
                  {/* Events Section */}
                  {eventsForDay.length > 0 && (
                    <Card variant="outlined">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                        <span style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>Events</span>
                        <button
                          type="button"
                          onClick={() => console.log("Edit events for day", selectedDay)}
                          style={{
                            fontSize: typography.caption.fontSize,
                            color: colors.textSecondary,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: spacing.md, overflowX: 'auto' }}>
                        {eventsForDay.map((event) => {
                          const eventColor = tagColors[event.tag]?.color || colors.textPrimary
                          return (
                            <Card 
                              key={event.title} 
                              variant="outlined" 
                              padding={true}
                              style={{ 
                                minWidth: '200px',
                                background: `${eventColor}15`,
                                borderColor: `${eventColor}40`,
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                                <div>
                                  <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>{event.title}</p>
                                  <p style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>{event.time}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{
                                    fontSize: typography.caption.fontSize,
                                    padding: `${spacing.xs} ${spacing.sm}`,
                                    borderRadius: components.chip.radius,
                                    background: `${eventColor}30`,
                                    color: colors.textPrimary,
                                    border: `1px solid ${eventColor}50`,
                                  }}>
                                    {event.tag}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Create Moment */}
                  {eventsForDay.length === 0 ? (
                    <CreateMomentCard />
                  ) : (
                    <CreateMomentCard compact />
                  )}
                  
                  {/* Suggested Hangouts */}
                  <Card variant="outlined">
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                      <Sparkles className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>Suggested hangouts</p>
                    </div>
                    {suggestions.length > 0 ? (
                      <div style={{ display: 'flex', gap: spacing.md, overflowX: 'auto' }}>
                        {suggestions.map((suggestion) => (
                          <Card key={suggestion.title} variant="outlined" padding={true} style={{ minWidth: '190px' }}>
                            <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>{suggestion.title}</p>
                            <p style={{ fontSize: typography.caption.fontSize, color: colors.textSecondary }}>{suggestion.detail}</p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl }}>
                        No suggestions available
                      </p>
                    )}
                  </Card>

                  {/* People Section */}
                  <Card variant="outlined">
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                      <Users className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      <p style={{ fontSize: typography.body.fontSize, fontWeight: 500, color: colors.textPrimary }}>People</p>
                    </div>
                    <div style={{ marginBottom: spacing.md }}>
                      <label style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Viewing</label>
                      <select
                        value={selectedFriendGroup}
                        onChange={(e) => setSelectedFriendGroup(e.target.value as keyof typeof friends)}
                        style={{
                          marginTop: spacing.xs,
                          width: '100%',
                          padding: `${spacing.sm} ${spacing.md}`,
                          borderRadius: components.input.radius,
                          background: colors.background,
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                          fontSize: typography.body.fontSize,
                        }}
                      >
                        {Object.keys(friends).map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>
                    {friends[selectedFriendGroup].length > 0 ? (
                      <div style={{ display: 'flex', gap: spacing.md, overflowX: 'auto' }}>
                        {friends[selectedFriendGroup].map((person) => (
                          <Card key={person} variant="outlined" padding={true} style={{ minWidth: '120px' }}>
                            <p style={{ fontSize: typography.body.fontSize, color: colors.textPrimary }}>{person}</p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl }}>
                        No {selectedFriendGroup.toLowerCase()} yet
                      </p>
                    )}
                  </Card>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Planner Modal */}
      <AnimatePresence>
        {showPlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionConfig.duration.normal / 1000 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setShowPlanner(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
              className="w-full"
              style={{ maxWidth: '360px', background: colors.background, borderRadius: components.card.radius, padding: spacing.xxl }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
                <div>
                  <p style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New plan</p>
                  <h3 style={{ fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.textPrimary }}>Design your moment</h3>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                  onClick={() => setShowPlanner(false)}
                  style={{
                    padding: spacing.sm,
                    borderRadius: components.button.radius,
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <div>
                  <label style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing.sm, display: 'block' }}>Title</label>
                  <input
                    value={plannerFields.title}
                    onChange={(e) => handlePlannerField("title", e.target.value)}
                    placeholder="Name this moment"
                    style={{
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: components.input.radius,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: typography.body.fontSize,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing.sm, display: 'block' }}>Invite group</label>
                  <select
                    value={plannerFields.inviteGroup}
                    onChange={(e) => handlePlannerField("inviteGroup", e.target.value)}
                    style={{
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: components.input.radius,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: typography.body.fontSize,
                    }}
                  >
                    {Object.keys(friends).map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing.sm, display: 'block' }}>Privacy</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
                    {["public", "private"].map((mode) => (
                      <motion.button
                        key={mode}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                        onClick={() => handlePlannerField("privacy", mode)}
                        style={{
                          padding: `${spacing.sm} ${spacing.md}`,
                          borderRadius: components.chip.radius,
                          background: plannerFields.privacy === mode ? colors.textPrimary : colors.background,
                          color: plannerFields.privacy === mode ? colors.background : colors.textPrimary,
                          border: `1px solid ${colors.border}`,
                          fontSize: typography.body.fontSize,
                          textTransform: 'capitalize',
                        }}
                      >
                        {mode}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: typography.caption.fontSize, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing.sm, display: 'block' }}>Notes</label>
                  <textarea
                    value={plannerFields.notes}
                    onChange={(e) => handlePlannerField("notes", e.target.value)}
                    placeholder="What makes this special?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: components.input.radius,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: typography.body.fontSize,
                      resize: 'none',
                    }}
                  />
                </div>

                {saveError && (
                  <div style={{
                    padding: spacing.md,
                    borderRadius: components.input.radius,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    fontSize: typography.caption.fontSize,
                    color: colors.textSecondary,
                  }}>
                    {saveError}
                  </div>
                )}

                <Button
                  onClick={handlePlannerSubmit}
                  disabled={savingEvent || !plannerFields.title.trim()}
                  className="w-full"
                >
                  {savingEvent ? "Saving..." : "Save & Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
