"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Info, Plus, Sparkles, Users, X } from "lucide-react"
import { BottomNav } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const friends = {
  "Inner Circle": [],
  "Close Friends": [],
  Community: [],
} as const

// No mock events - all events come from database

const suggestions: any[] = []

const tagColors: Record<string, { gradient: string; dot: string; label: string; color: string }> = {
  "Inner Circle": {
    gradient: "from-orange-400/90 via-orange-300/70 to-orange-400/50",
    dot: "bg-orange-400",
    color: "orange-400",
    label: "Core people",
  },
  "Close Friends": {
    gradient: "from-blue-400/90 via-blue-300/70 to-blue-400/50",
    dot: "bg-blue-400",
    color: "blue-400",
    label: "Trusted circle",
  },
  Community: {
    gradient: "from-green-400/90 via-green-300/70 to-green-400/50",
    dot: "bg-green-400",
    color: "green-400",
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

  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Don't redirect on calendar page, just show empty state
    }
  }, [user, authLoading])

  const { firstDay, totalDays } = useMemo(
    () => generateDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )

  // Load events from database
  useEffect(() => {
    if (!user || authLoading) {
      setEvents([]) // Empty events while loading
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
          // Convert database events to calendar format
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
          // No events in database
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading events:', error)
        // Empty events on error
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
      // Map inviteGroup to group_type
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
        // Reload events for current month
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
        // Close planner and reset
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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  const CreateMomentCard = ({ compact = false }: { compact?: boolean }) => (
    <section
      className={cn(
        "rounded-[20px] border border-white/10 p-4 text-white space-y-3 sleek-module",
      )}
    >
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-white/80" />
        <p className="font-semibold text-white/90">Create new moment</p>
      </div>
      <p className="text-[11px] text-white/70">
        Curate a hangout, save a ritual, or plan something spontaneous.
      </p>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setSaveError(null)
          setShowPlanner(true)
        }}
        className="w-full py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/95 transition cursor-pointer pointer-events-auto relative z-10"
      >
        Start a plan
      </motion.button>
    </section>
  )

  return (
    <div className="fixed inset-0 bg-black overflow-hidden sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6 w-screen h-screen m-0 p-0">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <AnimatePresence>
              {panelOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-20 bg-black/80 rounded-[22px] pointer-events-none"
                />
              )}
            </AnimatePresence>

            <div className={cn(
              "flex flex-col flex-1 p-5 pb-24 transition-all duration-500 relative z-10",
              panelOpen ? "scale-[0.97] blur-[1.5px] brightness-75 pointer-events-none" : "scale-100 blur-0 pointer-events-auto",
            )}>
              <div className="flex items-center justify-between text-white mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">Narrative</p>
                  <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth("prev")}
                    className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth("next")}
                    className="p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-3 flex items-center gap-3 text-[11px] text-white/80 mb-4">
                <Info className="h-4 w-4 text-white/80" />
                <div className="flex flex-wrap gap-3 text-xs">
                  {Object.entries(tagColors).map(([tag, meta]) => (
                    <div key={tag} className="flex items-center gap-1.5">
                      <span className={cn("w-3 h-3 rounded-full", meta.dot)} />
                      <span className="text-white/90">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day} className="text-center">{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 flex-1">
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
                  const tintGradient = dayEvents.length ? tagColors[dayEvents[0].tag]?.gradient : null

                  return (
                    <motion.button
                      key={day}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleDaySelect(day)}
                      className={cn(
                        "aspect-square rounded-[16px] border transition-all flex flex-col items-center justify-center relative overflow-hidden",
                        "bg-white/3",
                        selectedDay === day
                          ? "border-white/40 text-white"
                          : isToday
                          ? "border-white/30 text-white"
                          : "border-white/10 text-white/80 hover:border-white/20",
                      )}
                    >
                      {tintGradient && (
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", tintGradient)} />
                      )}
                      <span className={cn("text-sm font-semibold relative z-10", tintGradient ? "text-black font-bold" : "text-white")}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 flex gap-1 z-10">
                          {dayEvents.slice(0, 3).map((event) => (
                            <span key={event.title} className={cn("w-1.5 h-1.5 rounded-full", tagColors[event.tag]?.dot || "bg-white")} />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <AnimatePresence>
              {panelOpen && selectedDay && (
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 32 }}
                  className="absolute inset-0 z-40 flex"
                >
                  <div className="w-full px-4 pt-6 pb-4 flex">
                    <div className="bg-black border border-white/10 rounded-[24px] max-h-full overflow-hidden flex flex-col flex-1">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Selected</p>
                          <h2 className="text-2xl font-bold text-white">
                            {monthNames[currentDate.getMonth()]} {selectedDay}
                          </h2>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPanelOpen(false)}
                          className="px-3 py-2 rounded-full bg-white/5 text-white text-xs uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition"
                        >
                          Back
                        </motion.button>
                      </div>

                      <div className="flex flex-col gap-3 p-4 overflow-y-auto scrollbar-hide">
                        {/* Events Section - Always show if events exist */}
                        {eventsForDay.length > 0 && (
                          <section className="bg-white/5 rounded-[18px] border border-white/10 p-3 sleek-module">
                            <div className="flex items-center justify-between text-white mb-2.5">
                              <span className="text-xs font-semibold text-white/90">Events</span>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log("Edit events for day", selectedDay)
                                }}
                                className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white/80 transition cursor-pointer pointer-events-auto relative z-10"
                              >
                                Edit
                              </motion.button>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                              {eventsForDay.map((event) => {
                                const eventColor = tagColors[event.tag]?.color || "white"
                                return (
                                  <motion.button
                                    key={event.title}
                                    type="button"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log("Selected event:", event.title)
                                    }}
                                    className={cn(
                                      "min-w-[200px] rounded-[16px] border px-3 py-3 text-left text-white flex flex-col gap-1.5 hover:opacity-90 transition cursor-pointer pointer-events-auto relative z-10",
                                      eventColor === "orange-400" && "bg-orange-400/20 border-orange-400/40",
                                      eventColor === "blue-400" && "bg-blue-400/20 border-blue-400/40",
                                      eventColor === "green-400" && "bg-green-400/20 border-green-400/40"
                                    )}
                                  >
                                    <div>
                                      <p className="text-xs font-semibold">{event.title}</p>
                                      <p className="text-[10px] text-white/70">{event.time}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded-md text-white border font-semibold",
                                        eventColor === "orange-400" && "bg-orange-400/30 border-orange-400/50",
                                        eventColor === "blue-400" && "bg-blue-400/30 border-blue-400/50",
                                        eventColor === "green-400" && "bg-green-400/30 border-green-400/50"
                                      )}>
                                        {event.tag}
                                      </span>
                                      <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log("Request to join:", event.title)
                                        }}
                                        className="text-[10px] font-semibold text-white/80 hover:text-white transition cursor-pointer pointer-events-auto relative z-20"
                                      >
                                        Request to join
                                      </motion.button>
                                    </div>
                                  </motion.button>
                                )
                              })}
                            </div>
                          </section>
                        )}

                        {/* Create Moment - Always at top when no events, or after events */}
                        {eventsForDay.length === 0 ? (
                          <CreateMomentCard />
                        ) : (
                          <CreateMomentCard compact />
                        )}
                        
                        {/* Suggested Hangouts */}
                        <section className="bg-white/5 rounded-[18px] border border-white/10 p-3 sleek-module">
                          <div className="flex items-center gap-2 text-white mb-2.5">
                            <Sparkles className="h-3.5 w-3.5 text-white/80" />
                            <p className="text-xs font-semibold text-white/90">Suggested hangouts</p>
                          </div>
                          {suggestions.length > 0 ? (
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                              {suggestions.map((suggestion) => (
                                <motion.button
                                  key={suggestion.title}
                                  type="button"
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log("Selected suggestion:", suggestion.title)
                                  }}
                                  className="min-w-[190px] bg-white/5 rounded-[14px] border border-white/10 p-2.5 text-left text-white/90 hover:bg-white/8 transition cursor-pointer pointer-events-auto relative z-10"
                                >
                                  <p className="text-xs font-semibold">{suggestion.title}</p>
                                  <p className="text-[10px] text-white/70">{suggestion.detail}</p>
                                  <div className="flex items-center justify-between text-[9px] mt-1.5">
                                    <span className="uppercase tracking-[0.25em] text-white/70">{suggestion.vibe}</span>
                                    <span className="text-white/60">{suggestion.source}</span>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/60 text-center py-4">No suggestions available</p>
                          )}
                        </section>

                        {/* People Section */}
                        <section className="bg-white/5 rounded-[18px] border border-white/10 p-3 space-y-2.5 sleek-module">
                          <div className="flex items-center gap-2 text-white">
                            <Users className="h-3.5 w-3.5 text-white/80" />
                            <p className="text-xs font-semibold text-white/90">People</p>
                          </div>
                          <div className="bg-white/5 rounded-[14px] p-2.5 border border-white/10">
                            <label className="text-[9px] uppercase tracking-[0.25em] text-white/60">Viewing</label>
                            <select
                              value={selectedFriendGroup}
                              onChange={(e) => setSelectedFriendGroup(e.target.value as keyof typeof friends)}
                              className="mt-1 w-full bg-white/5 border border-white/10 rounded-[14px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                            >
                              {Object.keys(friends).map((group) => (
                                <option key={group} value={group} className="bg-black">
                                  {group}
                                </option>
                              ))}
                            </select>
                          </div>
                          {friends[selectedFriendGroup].length > 0 ? (
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                              {friends[selectedFriendGroup].map((person) => (
                                <motion.button
                                  key={person}
                                  type="button"
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log("Selected person:", person, "from", selectedFriendGroup)
                                  }}
                                  className="min-w-[120px] bg-white/5 rounded-[14px] border border-white/10 px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/8 transition cursor-pointer pointer-events-auto relative z-10"
                                >
                                  {person}
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/60 text-center py-4">No {selectedFriendGroup.toLowerCase()} yet</p>
                          )}
                        </section>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <BottomNav />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="w-full max-w-[360px] bg-black border border-white/10 rounded-[24px] p-5 text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">New plan</p>
                  <h3 className="text-xl font-bold text-white">Design your moment</h3>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPlanner(false)}
                  className="rounded-full border border-white/10 p-2 text-white/70 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">Title</label>
                <input
                  value={plannerFields.title}
                  onChange={(e) => handlePlannerField("title", e.target.value)}
                  placeholder="Name this moment"
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">Invite group</label>
                <select
                  value={plannerFields.inviteGroup}
                  onChange={(e) => handlePlannerField("inviteGroup", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                >
                  {Object.keys(friends).map((group) => (
                    <option key={group} value={group} className="bg-black">
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">Privacy</label>
                <div className="grid grid-cols-2 gap-3">
                  {["public", "private"].map((mode) => (
                    <motion.button
                      key={mode}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlannerField("privacy", mode)}
                      className={cn(
                        "rounded-full px-3 py-2 border text-sm capitalize transition",
                        plannerFields.privacy === mode
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/70",
                      )}
                    >
                      {mode}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">Templates</label>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {planTemplates.map((template) => (
                    <motion.button
                      key={template.title}
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePlannerField("title", template.title)
                      }}
                      className="min-w-[190px] bg-white/5 border border-white/10 rounded-[16px] px-3 py-3 text-left hover:bg-white/8 transition cursor-pointer pointer-events-auto relative z-10"
                    >
                      <p className="text-sm font-semibold text-white/90">{template.title}</p>
                      <p className="text-[11px] text-white/70">{template.detail}</p>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">{template.vibe}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">Notes</label>
                <textarea
                  value={plannerFields.notes}
                  onChange={(e) => handlePlannerField("notes", e.target.value)}
                  placeholder="What makes this special?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40 resize-none"
                />
              </div>

              {saveError && (
                <div className="p-3 rounded-[16px] border border-white/15 bg-white/5 text-xs text-white/80">
                  {saveError}
                </div>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlannerSubmit}
                disabled={savingEvent || !plannerFields.title.trim()}
                className={cn(
                  "w-full py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/95 transition",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {savingEvent ? "Saving..." : "Save & Invite"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


