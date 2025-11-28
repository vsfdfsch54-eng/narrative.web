"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { MatchCard } from "./MatchCard"

interface CardStackProps {
  profiles: any[]
  currentUserId: string
  onConnect: (targetId: string) => Promise<void>
  onSkip: (targetId: string) => Promise<void>
}

export function CardStack({ profiles, currentUserId, onConnect, onSkip }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Reset index when profiles change
  useEffect(() => {
    setCurrentIndex(0)
  }, [profiles])

  if (profiles.length === 0) {
    return null
  }

  // Bug #8 Fix: Only render current card to prevent double-rendering
  const currentProfile = profiles[currentIndex]

  const handleConnect = async () => {
    if (isAnimating || !currentProfile) return
    
    setIsAnimating(true)
    // Don't await - let animation complete smoothly
    onConnect(currentProfile.id).finally(() => {
      setIsAnimating(false)
    })
  }

  const handleSkip = async () => {
    if (isAnimating || !currentProfile) return
    
    setIsAnimating(true)
    // Don't await - let animation complete smoothly
    onSkip(currentProfile.id).finally(() => {
      setIsAnimating(false)
    })
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '420px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <AnimatePresence mode="wait">
        {currentProfile && (
          <MatchCard
            key={currentProfile.id}
            profile={currentProfile}
            onConnect={handleConnect}
            onSkip={handleSkip}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
