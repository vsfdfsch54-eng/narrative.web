"use client"

import { useState, useEffect } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { HeroPill } from "@/components/ui/hero-pill"
import { tokens } from "@/lib/design-tokens"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterestsStepProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
  onSubmit: (interests: string[]) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function InterestsStep({ 
  selectedInterests, 
  onInterestsChange, 
  onSubmit, 
  loading, 
  error,
  onBack 
}: InterestsStepProps) {
  const [localInterests, setLocalInterests] = useState<string[]>(selectedInterests)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    setLocalInterests(selectedInterests)
  }, [selectedInterests])

  const categories = getAllCategories()
  const displayedInterests = selectedCategory
    ? INTERESTS.filter(interest => interest.category === selectedCategory)
    : INTERESTS

  const toggleInterest = (interestId: string) => {
    const newInterests = localInterests.includes(interestId)
      ? localInterests.filter(id => id !== interestId)
      : [...localInterests, interestId]
    setLocalInterests(newInterests)
    onInterestsChange(newInterests)
  }

  const handleSubmit = async () => {
    if (localInterests.length === 0) {
      return // Require at least one interest
    }
    await onSubmit(localInterests)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
      maxHeight: 'calc(100vh - 300px)',
      overflow: 'hidden',
    }}>
      <div>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          What are you into?
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          Select your interests (choose at least one)
        </p>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: tokens.spacing[10],
        overflowX: 'auto',
        paddingBottom: tokens.spacing[8],
        WebkitOverflowScrolling: 'touch',
      }}>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className="group"
        >
          <HeroPill
            text="All"
            className={cn(
              "mb-0",
              selectedCategory === null && "[&>p]:bg-accent [&>p]:text-accent-foreground"
            )}
            animate={false}
          />
        </button>
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className="group"
          >
            <HeroPill
              text={category}
              className={cn(
                "mb-0",
                selectedCategory === category && "[&>p]:bg-accent [&>p]:text-accent-foreground"
              )}
              animate={false}
            />
          </button>
        ))}
      </div>

      {/* Interests Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacing[10],
        overflowY: 'auto',
        flex: 1,
        paddingBottom: tokens.spacing[20],
      }}>
        {displayedInterests.map(interest => (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggleInterest(interest.id)}
            className="group"
          >
            <HeroPill
              text={`${interest.emoji} ${interest.label}`}
              className={cn(
                "mb-0",
                localInterests.includes(interest.id) && "[&>p]:bg-accent [&>p]:text-accent-foreground"
              )}
              animate={false}
            />
          </button>
        ))}
      </div>

      {error && (
        <p style={{
          ...tokens.typography.label,
          color: '#EF4444',
          margin: 0,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: tokens.spacing[16] }}>
        {onBack && (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </AnimatedButton>
        )}
        <AnimatedButton
          onClick={handleSubmit}
          disabled={localInterests.length === 0 || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

