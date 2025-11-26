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

  const handleSubmit = () => {
    if (localInterests.length === 0) {
      return // Require at least one interest
    }
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit(localInterests).catch((error) => {
      console.error('[InterestsStep] Submit error:', error)
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
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
          marginBottom: tokens.spacing[16],
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
        paddingBottom: tokens.spacing[12],
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          disabled={loading}
          style={{
            padding: '10px 18px',
            borderRadius: '20px',
            border: selectedCategory === null ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
            background: selectedCategory === null ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            color: tokens.colors.textPrimaryOnDark,
            fontSize: '14px',
            fontWeight: selectedCategory === null ? 500 : 400,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            opacity: loading ? 0.5 : 1,
          }}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: '20px',
              border: selectedCategory === category ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
              background: selectedCategory === category ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              color: tokens.colors.textPrimaryOnDark,
              fontSize: '14px',
              fontWeight: selectedCategory === category ? 500 : 400,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Interests Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacing[12],
        maxHeight: '400px',
        overflowY: 'auto',
        paddingBottom: tokens.spacing[20],
        paddingRight: tokens.spacing[4],
      }}>
        {displayedInterests.map(interest => {
          const isSelected = localInterests.includes(interest.id)
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              disabled={loading}
              style={{
                padding: '12px 20px',
                borderRadius: '16px',
                border: isSelected ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                color: tokens.colors.textPrimaryOnDark,
                fontSize: '15px',
                fontWeight: isSelected ? 500 : 400,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[8],
                opacity: loading ? 0.5 : 1,
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {interest.emoji && (
                <span style={{ fontSize: '18px' }}>
                  {interest.emoji}
                </span>
              )}
              <span>{interest.label}</span>
            </button>
          )
        })}
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

