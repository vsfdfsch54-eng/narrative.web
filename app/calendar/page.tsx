"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, Sparkles, Users, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { Button } from "@/components/ui/button"
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

      setLoadingEvents(true)
      try {
        const response = await fetch(`/api/calendar?userId=${userId}&month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`)
        const data = await response.json()
        if (data.success && data.data) {
          setEvents(data.data.map((e: any) => ({
            ...e,
            day: new Date(e.date).getDate(),
          })))
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
  }, [user, currentDate, authLoading])

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDaySelect = (day: number) => {
    if (selectedDay === day) {
      setSelectedDay(null)
      setPanelOpen(false)
    } else {
      setSelectedDay(day)
      setPanelOpen(true)
    }
  }

  const eventsForDay = events.filter((event) => event.day === selectedDay)

  const handlePlannerField = (field: keyof typeof plannerFields, value: any) => {
    setPlannerFields((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlannerSubmit = async () => {
    const userId = getUserId()
    if (!userId || !selectedDay || !plannerFields.title.trim()) {
      setSaveError("Please fill in all required fields")
      return
    }

    setSavingEvent(true)
    setSaveError(null)

    try {
      const eventDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDay,
      )

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: plannerFields.title,
          date: eventDate.toISOString(),
          tag: plannerFields.inviteGroup,
          privacy: plannerFields.privacy,
          notes: plannerFields.notes,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowPlanner(false)
        setPlannerFields({
          title: "",
          inviteGroup: "Inner Circle",
          privacy: "private",
          vibe: "Curious",
          notes: "",
        })
        const newEvents = [...events, {
          id: data.data.id,
          title: plannerFields.title,
          day: selectedDay,
          tag: plannerFields.inviteGroup,
          time: eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }]
        setEvents(newEvents)
      } else {
        setSaveError(data.error || "Failed to save event")
      }
    } catch (error) {
      console.error('Error saving event:', error)
      setSaveError("Failed to save event")
    } finally {
      setSavingEvent(false)
    }
  }

  if (authLoading || loadingEvents) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  const CreateMomentCard = ({ compact = false }: { compact?: boolean }) => {
    return (
      <div style={{ padding: tokens.layout.elementSpacing, borderRadius: tokens.radii.pill, background: tokens.colors.pillUnselected, boxShadow: tokens.shadows.pillUnselected}}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <Plus className="w-4 h-4" style={{ color: tokens.colors.textOnPill }} />
            <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textOnPill, margin: 0 }}>Create new moment</p>
          </div>
          {!compact && (
            <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, margin: 0 }}>
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
      </div>
    )
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing, paddingTop: tokens.layout.topTitleSpacing, paddingBottom: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.layout.sectionSpacing }}>
          <h1 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            textAlign: 'center',
            flex: 1,
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12] }}>
            <motion.button
              type="button"
              onClick={() => changeMonth("prev")}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: tokens.shadows.pillUnselected,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => changeMonth("next")}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: tokens.shadows.pillUnselected,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Day Headers */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: tokens.spacing[16],
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
          gap: tokens.spacing[16],
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
            const isSelected = selectedDay === day

            return (
              <motion.button
                key={day}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleDaySelect(day)}
                style={{
                  width: '43px',
                  height: '43px',
                  borderRadius: '50%',
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'visible',
                  cursor: 'pointer',
                  outline: isSelected ? '2px solid #000000' : 'none',
                  outlineOffset: '2px',
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
                    bottom: '4px', 
                    display: 'flex', 
                    gap: '2px',
                  }}>
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: tokens.colors.pillUnselected,
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
                background: tokens.colors.backgroundApp,
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                maxHeight: '80vh',
                overflow: 'hidden',
                padding: tokens.spacing[20],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.layout.sectionSpacing }}>
                <div>
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Selected</p>
                  <h2 style={{ 
                    ...tokens.typography.heading,
                    color: tokens.colors.textPrimaryOnDark,
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
                    padding: `12px ${tokens.spacing[18]}`,
                    borderRadius: tokens.radii.button,
                    background: tokens.colors.pillUnselected,
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    boxShadow: tokens.shadows.pillUnselected,
                    ...tokens.typography.label,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.elementSpacing, overflowY: 'auto', maxHeight: '60vh' }}>
                {eventsForDay.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing[16] }}>
                      <span style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimaryOnDark }}>Events</span>
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
                        const eventColor = tagColors[event.tag]?.color || tokens.colors.accentBlue
                        return (
                          <div 
                            key={event.title}
                            style={{ 
                              minWidth: '200px',
                              padding: tokens.spacing[16],
                              borderRadius: tokens.radii.pill,
                              background: tokens.colors.pillUnselected,
                              boxShadow: tokens.shadows.pillUnselected,
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
                              <div>
                                <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textOnPill, margin: 0 }}>{event.title}</p>
                                <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, margin: 0 }}>{event.time}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                  ...tokens.typography.label,
                                  padding: `${tokens.spacing[4]} ${tokens.spacing[12]}`,
                                  borderRadius: tokens.radii.button,
                                  background: `${eventColor}30`,
                                  color: tokens.colors.textOnPill,
                                  border: 'none',
                                }}>
                                  {event.tag}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {eventsForDay.length === 0 ? (
                  <CreateMomentCard />
                ) : (
                  <CreateMomentCard compact />
                )}
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], marginBottom: tokens.spacing[16] }}>
                    <Sparkles className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
                    <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimaryOnDark, margin: 0 }}>Suggested hangouts</p>
                  </div>
                  {suggestions.length > 0 ? (
                    <div style={{ display: 'flex', gap: tokens.spacing[16], overflowX: 'auto' }}>
                      {suggestions.map((suggestion) => (
                        <div key={suggestion.title} style={{ minWidth: '190px', padding: tokens.spacing[16], borderRadius: tokens.radii.pill, background: tokens.colors.pillUnselected, boxShadow: tokens.shadows.pillUnselected}}>
                          <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textOnPill, margin: 0 }}>{suggestion.title}</p>
                          <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, margin: 0 }}>{suggestion.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.layout.sectionSpacing, margin: 0 }}>
                      No suggestions available
                    </p>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[12], marginBottom: tokens.spacing[16] }}>
                    <Users className="w-4 h-4" style={{ color: tokens.colors.textSecondary }} />
                    <p style={{ ...tokens.typography.body, fontWeight: 500, color: tokens.colors.textPrimaryOnDark, margin: 0 }}>People</p>
                  </div>
                  <div style={{ marginBottom: tokens.spacing[16] }}>
                    <label style={{ ...tokens.typography.label, color: tokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[8], display: 'block' }}>Viewing</label>
                    <select
                      value={selectedFriendGroup}
                      onChange={(e) => setSelectedFriendGroup(e.target.value as keyof typeof friends)}
                      style={{
                        marginTop: tokens.spacing[8],
                        width: '100%',
                        padding: `12px ${tokens.spacing[18]}`,
                        borderRadius: tokens.radii.input,
                        background: tokens.colors.pillUnselected,
                        border: 'none',
                        color: tokens.colors.textOnPill,
                        boxShadow: tokens.shadows.pillUnselected,
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
                        <div key={person} style={{ minWidth: '120px', padding: tokens.spacing[16], borderRadius: tokens.radii.pill, background: tokens.colors.pillUnselected, boxShadow: tokens.shadows.pillUnselected}}>
                          <p style={{ ...tokens.typography.body, color: tokens.colors.textOnPill, margin: 0 }}>{person}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ ...tokens.typography.body, color: tokens.colors.textSecondary, textAlign: 'center', padding: tokens.layout.sectionSpacing, margin: 0 }}>
                      No {selectedFriendGroup.toLowerCase()} yet
                    </p>
                  )}
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
              style={{ maxWidth: '360px', background: tokens.colors.pillUnselected, borderRadius: '28px', padding: tokens.layout.sectionSpacing, boxShadow: tokens.shadows.pillUnselected}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.layout.sectionSpacing }}>
                <div>
                  <p style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>New plan</p>
                  <h3 style={{ ...tokens.typography.heading, color: tokens.colors.textOnPill, margin: 0 }}>Design your moment</h3>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPlanner(false)}
                  style={{
                    padding: tokens.spacing[12],
                    borderRadius: tokens.radii.button,
                    background: tokens.colors.pillUnselected,
                    border: 'none',
                    color: tokens.colors.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.elementSpacing }}>
                <div>
                  <label style={{ ...tokens.typography.label, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacing[12], display: 'block' }}>Title</label>
                  <input
                    value={plannerFields.title}
                    onChange={(e) => handlePlannerField("title", e.target.value)}
                    placeholder="Name this moment"
                    style={{
                      width: '100%',
                      padding: `12px ${tokens.spacing[18]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.pillUnselected,
                      border: 'none',
                      color: tokens.colors.textOnPill,
                      boxShadow: tokens.shadows.pillUnselected,
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
                      padding: `12px ${tokens.spacing[18]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.pillUnselected,
                      border: 'none',
                      color: tokens.colors.textOnPill,
                      boxShadow: tokens.shadows.pillUnselected,
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
                          padding: `12px ${tokens.spacing[18]}`,
                          borderRadius: tokens.radii.button,
                          background: plannerFields.privacy === mode ? tokens.colors.backgroundApp : tokens.colors.pillUnselected,
                          color: plannerFields.privacy === mode ? tokens.colors.textPrimaryOnDark : tokens.colors.textOnPill,
                          border: 'none',
                          boxShadow: plannerFields.privacy !== mode ? tokens.shadows.pillUnselected: 'none',
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
                      padding: `12px ${tokens.spacing[18]}`,
                      borderRadius: tokens.radii.input,
                      background: tokens.colors.pillUnselected,
                      border: 'none',
                      color: tokens.colors.textOnPill,
                      boxShadow: tokens.shadows.pillUnselected,
                      ...tokens.typography.body,
                      resize: 'none',
                    }}
                  />
                </div>

                {saveError && (
                  <div style={{
                    padding: tokens.spacing[16],
                    borderRadius: tokens.radii.input,
                    border: 'none',
                    background: tokens.colors.pillUnselected,
                    boxShadow: tokens.shadows.pillUnselected,
                    ...tokens.typography.label,
                    color: tokens.colors.textMuted,
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
