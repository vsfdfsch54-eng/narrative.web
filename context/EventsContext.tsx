"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface Event {
  id: string
  loop_id: string | null
  title: string
  date_time: string
  location: string | null
  visibility_layer: string
  growth_enabled: boolean
  participant_list_visible: boolean
  past_activity_enabled: boolean
  sync_to_feed: boolean
  private_link: string | null
  guest_mode_enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface EventsContextType {
  events: Event[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addEvent: (event: Event) => void
  updateEvent: (eventId: string, updates: Partial<Event>) => void
  removeEvent: (eventId: string) => void
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // This will be called from pages/components that have userId
    // For now, it's a placeholder
    setLoading(true)
    setError(null)
    // Implementation will be in pages that use this context
    setLoading(false)
  }, [])

  const addEvent = useCallback((event: Event) => {
    setEvents(prev => [...prev, event])
  }, [])

  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ))
  }, [])

  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }, [])

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        refresh,
        addEvent,
        updateEvent,
        removeEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error('useEvents must be used within EventsProvider')
  }
  return context
}

