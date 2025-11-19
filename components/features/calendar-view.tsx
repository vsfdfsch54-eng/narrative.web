"use client"

import * as React from "react"
import { CalendarGrid } from "@/components/ui/calendar-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarEvent } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onCreateEvent?: () => void
}

export function CalendarView({
  events,
  onDateClick,
  onCreateEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(month - 1)
      } else {
        newDate.setMonth(month + 1)
      }
      return newDate
    })
  }

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= new Date()
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <Card className="p-0 border-slate-700/30 bg-slate-900/30">
        <CardHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-100">
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth("prev")}
                className="rounded-xl border border-slate-700/40 bg-slate-900/30 text-slate-200 hover:bg-slate-800/40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth("next")}
                className="rounded-xl border border-slate-700/40 bg-slate-900/30 text-slate-200 hover:bg-slate-800/40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CalendarGrid
            year={year}
            month={month}
            events={events}
            onDateClick={onDateClick}
          />
        </CardContent>
      </Card>

      <Card className="p-0 border-slate-700/30 bg-slate-900/30">
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="text-base font-semibold text-slate-100">
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400/80 text-center">
              No upcoming events
            </p>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-2xl border border-slate-700/30 bg-slate-900/40"
              >
                <div className="text-[11px] text-slate-400 mb-1">
                  {new Date(event.date).toLocaleDateString()}
                  {event.time && ` • ${event.time}`}
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {event.title}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {onCreateEvent && (
        <Button
          variant="primary"
          className="w-full h-11 rounded-2xl text-sm font-semibold tracking-wide bg-white text-slate-900 border border-white/70 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
          onClick={onCreateEvent}
        >
          Create Event
        </Button>
      )}
    </div>
  )
}

