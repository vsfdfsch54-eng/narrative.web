"use client"

import * as React from "react"
import { MatchCard } from "@/components/ui/match-card"
import { EmptyState } from "@/components/layout/empty-state"
import { Match } from "@/lib/types"

interface MatchmakingFlowProps {
  matches: Match[]
  onStartChat: (matchId: string) => void
  loading?: boolean
}

export function MatchmakingFlow({
  matches,
  onStartChat,
  loading = false,
}: MatchmakingFlowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 bg-card rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No matches found"
        description="Try adjusting your vibe, topic, or intimacy tier preferences to find more connections."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match, index) => (
        <MatchCard
          key={match.id}
          match={match}
          onStartChat={() => onStartChat(match.id)}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}

