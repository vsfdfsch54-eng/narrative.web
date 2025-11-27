"use client"

import { useState } from "react"
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

  if (profiles.length === 0) {
    return null
  }

  const currentProfile = profiles[currentIndex]
  const hasMore = currentIndex < profiles.length - 1

  const handleConnect = async () => {
    if (isAnimating || !currentProfile) return
    
    setIsAnimating(true)
    await onConnect(currentProfile.id)
    
    // Move to next card after animation
    setTimeout(() => {
      if (hasMore) {
        setCurrentIndex(prev => prev + 1)
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleSkip = async () => {
    if (isAnimating || !currentProfile) return
    
    setIsAnimating(true)
    await onSkip(currentProfile.id)
    
    // Move to next card after animation
    setTimeout(() => {
      if (hasMore) {
        setCurrentIndex(prev => prev + 1)
      }
      setIsAnimating(false)
    }, 300)
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      minHeight: '600px',
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

