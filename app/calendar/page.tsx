"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Info, Plus, Sparkles, Users, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { tokens } from "@/lib/design-tokens"

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
    dot: tokens.colors.accentOrange,
    color: tokens.colors.accentOrange,
    label: "Core people",
  },
  "Close Friends": {
    dot: tokens.colors.accentBlue,
    color: tokens.colors.accentBlue,
    label: "Trusted circle",
  },
  Community: {
    dot: tokens.colors.accentGreen,
    color: tokens.colors.accentGreen,
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
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  const CreateMomentCard = ({ compact = false }: { compact?: boolean }) => (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
          <Plus className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
          <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimary, margin: 0 }}>Create new moment</p>
        </div>
        {!compact && (
          <p style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, margin: 0 }}>
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
          style={{ width: '100%' }}
        >
          Start a plan
        </Button>
      </div>
    </Card>
  )

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[20] }}>
        {/* Calendar Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.layout.verticalSpacingLarge }}>
            <h1 style={{ 
              ...tokens.typography.heading,
              color: tokens.colors.textPrimary,
              margin: 0,
            }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
              <motion.button
                type="button"
                onClick={() => changeMonth("prev")}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: tokens.spacing[12],
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.surfacePrimary,
                  border: `1px solid ${tokens.colors.borderSubtle}`,
                  color: tokens.colors.textPrimary,
                  cursor: 'pointer',
                  boxShadow: tokens.shadows.card,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                type="button"
                onClick={() => changeMonth("next")}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: tokens.spacing[12],
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.surfacePrimary,
                  border: `1px solid ${tokens.colors.borderSubtle}`,
                  color: tokens.colors.textPrimary,
                  cursor: 'pointer',
                  boxShadow: tokens.shadows.card,
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Category Legend */}
          <div style={{ 
            padding: tokens.spacing[16],
            background: tokens.colors.surfaceSecondary,
            borderRadius: tokens.radii.input,
            border: `1px solid ${tokens.colors.borderSubtle}`,
            marginBottom: tokens.layout.verticalSpacingMedium,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], marginBottom: tokens.spacing[8] }}>
              <Info className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.layout.verticalSpacingMedium }}>
                {Object.entries(tagColors).map(([tag, meta]) => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[8] }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.dot }} />
                    <span style={{ ...tokens.typography.label, color: tokens.colors.textSecondary }}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Headers */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: tokens.spacing[12],
            marginBottom: tokens.spacing[16],
          }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span 
                key={day} 
                style={{ 
                  textAlign: 'center',
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: tokens.spacing[12],
          }}>
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
                    borderRadius: tokens.radii.pill,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    background: selectedDay === day 
                      ? tokens.colors.surfacePrimary 
                      : '#F7F7F8',
                    color: selectedDay === day ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ 
                    ...tokens.typography.body, 
                    fontWeight: isToday ? 600 : 400,
                  }}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: tokens.spacing[8], 
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
                            background: tagColors[event.tag]?.dot || tokens.colors.textMuted 
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Day Panel */}
      <AnimatePresence>
        {panelOpen && selectedDay && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-end"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setPanelOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2 }}
              className="w-full"
              style={{
                background: tokens.colors.surfacePrimary,
                borderTopLeftRadius: tokens.radii.card,
                borderTopRightRadius: tokens.radii.card,
                maxHeight: '80vh',
                overflow: 'hidden',
                padding: tokens.spacing[20],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing[28] }}>
                <div>
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Selected</p>
                  <h2 style={{ 
                    ...tokens.typography.heading,
                    color: tokens.colors.textPrimary,
                    margin: 0,
                  }}>
                    {monthNames[currentDate.getMonth()]} {selectedDay}
                  </h2>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPanelOpen(false)}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                    borderRadius: tokens.radii.button,
                    background: tokens.colors.surfacePrimary,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    color: tokens.colors.textPrimary,
                    ...tokens.typography.label,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.verticalSpacingMedium, overflowY: 'auto', maxHeight: '60vh' }}>
                {eventsForDay.length > 0 && (
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing[16] }}>
                      <span style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimary }}>Events</span>
                      <button
                        type="button"
                        onClick={() => console.log("Edit events for day", selectedDay)}
                        style={{
                          ...tokens.typography.label,
                          color: tokens.colors.textSecondary,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: tokens.spacing[16], overflowX: 'auto' }}>
                      {eventsForDay.map((event) => {
                        const eventColor = tagColors[event.tag]?.color || tokens.colors.textPrimary
                        return (
                          <Card 
                            key={event.title} 
                            style={{ 
                              minWidth: '200px',
                              background: `${eventColor}15`,
                              borderColor: `${eventColor}40`,
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
                              <div>
                                <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textDark, margin: 0 }}>{event.title}</p>
                                <p style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, margin: 0 }}>{event.time}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                  ...tokens.typography.label,
                                  padding: `${tokens.spacing[4]} ${tokens.spacing[12]}`,
                                  borderRadius: tokens.radii.button,
                                  background: `${eventColor}30`,
                                  color: tokens.colors.textPrimary,
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

                {eventsForDay.length === 0 ? (
                  <CreateMomentCard />
                ) : (
                  <CreateMomentCard compact />
                )}
                
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], marginBottom: tokens.spacing[16] }}>
                    <Sparkles className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
                    <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textDark, margin: 0 }}>Suggested hangouts</p>
                  </div>
                  {suggestions.length > 0 ? (
                    <div style={{ display: 'flex', gap: tokens.spacing[16], overflowX: 'auto' }}>
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.title} style={{ minWidth: '190px' }}>
                          <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textDark, margin: 0 }}>{suggestion.title}</p>
                          <p style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, margin: 0 }}>{suggestion.detail}</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.layout.verticalSpacingLarge, margin: 0 }}>
                      No suggestions available
                    </p>
                  )}
                </Card>

                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], marginBottom: tokens.spacing[16] }}>
                    <Users className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
                    <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimary, margin: 0 }}>People</p>
                  </div>
                  <div style={{ marginBottom: tokens.spacing[16] }}>
                    <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[8], display: 'block' }}>Viewing</label>
                    <select
                      value={selectedFriendGroup}
                      onChange={(e) => setSelectedFriendGroup(e.target.value as keyof typeof friends)}
                      style={{
                        marginTop: tokens.spacing[8],
                        width: '100%',
                        padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                        borderRadius: tokens.radii.input,
                        background: tokens.colors.surfacePrimary,
                        border: `1px solid ${tokens.colors.borderSubtle}`,
                        color: tokens.colors.textPrimary,
                        ...tokens.typography.body,
                        cursor: 'pointer',
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
                    <div style={{ display: 'flex', gap: tokens.spacing[16], overflowX: 'auto' }}>
                      {friends[selectedFriendGroup].map((person) => (
                        <Card key={person} style={{ minWidth: '120px' }}>
                          <p style={{ ...tokens.typography.body, color: tokens.colors.textPrimary, margin: 0 }}>{person}</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.layout.verticalSpacingLarge, margin: 0 }}>
                      No {selectedFriendGroup.toLowerCase()} yet
                    </p>
                  )}
                </Card>
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setShowPlanner(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
              style={{ maxWidth: '360px', background: tokens.colors.surfacePrimary, borderRadius: tokens.radii.card, padding: tokens.layout.verticalSpacingLarge, boxShadow: tokens.shadows.elevated }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.layout.verticalSpacingLarge }}>
                <div>
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>New plan</p>
                  <h3 style={{ ...tokens.typography.heading, color: tokens.colors.textPrimary, margin: 0 }}>Design your moment</h3>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPlanner(false)}
                  style={{
                    padding: tokens.spacing[12],
                    borderRadius: tokens.radii.button,
                    background: tokens.colors.surfacePrimary,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    color: tokens.colors.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.verticalSpacingMedium }}>
                <div>
                  <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[12], display: 'block' }}>Title</label>
                  <input
                    value={plannerFields.title}
                    onChange={(e) => handlePlannerField("title", e.target.value)}
                    placeholder="Name this moment"
                    style={{
                      width: '100%',
                      padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.surfacePrimary,
                      border: `1px solid ${tokens.colors.borderSubtle}`,
                      color: tokens.colors.textPrimary,
                      ...tokens.typography.body,
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[12], display: 'block' }}>Invite group</label>
                  <select
                    value={plannerFields.inviteGroup}
                    onChange={(e) => handlePlannerField("inviteGroup", e.target.value)}
                    style={{
                      width: '100%',
                      padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.surfacePrimary,
                      border: `1px solid ${tokens.colors.borderSubtle}`,
                      color: tokens.colors.textPrimary,
                      ...tokens.typography.body,
                      cursor: 'pointer',
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
                  <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[12], display: 'block' }}>Privacy</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing[16] }}>
                    {["public", "private"].map((mode) => (
                      <motion.button
                        key={mode}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlannerField("privacy", mode)}
                        style={{
                          padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                          borderRadius: tokens.radii.button,
                          background: plannerFields.privacy === mode ? tokens.colors.backgroundApp : tokens.colors.surfacePrimary,
                          color: plannerFields.privacy === mode ? tokens.colors.textPrimaryOnDark : tokens.colors.textPrimary,
                          border: `1px solid ${tokens.colors.borderSubtle}`,
                          ...tokens.typography.body,
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                        }}
                      >
                        {mode}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[12], display: 'block' }}>Notes</label>
                  <textarea
                    value={plannerFields.notes}
                    onChange={(e) => handlePlannerField("notes", e.target.value)}
                    placeholder="What makes this special?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.surfacePrimary,
                      border: `1px solid ${tokens.colors.borderSubtle}`,
                      color: tokens.colors.textPrimary,
                      ...tokens.typography.body,
                      resize: 'none',
                    }}
                  />
                </div>

                {saveError && (
                  <div style={{
                    padding: tokens.spacing[16],
                    borderRadius: tokens.radii.input,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    background: tokens.colors.surfacePrimary,
                    ...tokens.typography.label,
                    color: tokens.colors.textSecondary,
                  }}>
                    {saveError}
                  </div>
                )}

                <Button
                  onClick={handlePlannerSubmit}
                  disabled={savingEvent || !plannerFields.title.trim()}
                  style={{ width: '100%' }}
                >
                  {savingEvent ? "Saving..." : "Save & Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
