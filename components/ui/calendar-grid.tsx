"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CalendarEvent } from "@/lib/types"

interface CalendarGridProps {
  year: number
  month: number
  events?: CalendarEvent[]
  onDateClick?: (date: Date) => void
  selectedDate?: Date
}

export function CalendarGrid({
  year,
  month,
  events = [],
  onDateClick,
  selectedDate,
}: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getEventsForDate = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      )
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = getEventsForDate(day)
          const hasEvents = dayEvents.length > 0

          return (
            <motion.button
              key={day}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.01 }}
              onClick={() =>
                onDateClick?.(new Date(year, month, day))
              }
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 relative",
                isSelected(day)
                  ? "bg-primary text-primary-foreground"
                  : isToday(day)
                  ? "bg-accent/20 text-foreground ring-2 ring-primary"
                  : "hover:bg-accent/10 text-foreground"
              )}
            >
              <span>{day}</span>
              {hasEvents && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        event.intimacyTier === "inner-circle" &&
                          "bg-inner-circle",
                        event.intimacyTier === "close-friends" &&
                          "bg-close-friends",
                        event.intimacyTier === "community" &&
                          "bg-community"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

