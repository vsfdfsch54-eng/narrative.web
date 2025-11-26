"use client"

import { useState, useEffect } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { INTERESTS, getAllCategories } from "@/lib/interests"
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
    <div className="flex flex-col items-center justify-start w-full px-6 max-w-md mx-auto">
      {/* Header */}
      <div className="w-full mb-6">
        <h1 className="text-2xl font-semibold text-white text-center mb-2">
          What are you into?
        </h1>
        <p className="text-sm text-white/60 text-center">
          Select your interests (choose at least one)
        </p>
      </div>

      {/* Category Filter - Top Row (Horizontal Scrolling) */}
      <div className="flex flex-row gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-2 w-full -mx-6 px-6">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          disabled={loading}
          className={cn(
            "px-4 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0",
            selectedCategory === null
              ? "bg-white/12 border-2 border-white/40 text-white font-medium"
              : "bg-white/5 border border-white/15 text-white/90 font-normal",
            loading && "opacity-50 cursor-not-allowed"
            )}
        >
          <span className="truncate">All</span>
        </button>
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0",
              selectedCategory === category
                ? "bg-white/12 border-2 border-white/40 text-white font-medium"
                : "bg-white/5 border border-white/15 text-white/90 font-normal",
              loading && "opacity-50 cursor-not-allowed"
              )}
          >
            <span className="truncate">{category}</span>
          </button>
        ))}
      </div>

      {/* Interests Grid - 2 Column Layout */}
      <div className="grid grid-cols-2 gap-3 w-full mt-4 max-h-[400px] overflow-y-auto no-scrollbar pb-6">
        {displayedInterests.map(interest => {
          const isSelected = localInterests.includes(interest.id)
          return (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggleInterest(interest.id)}
              disabled={loading}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center gap-2",
                isSelected
                  ? "bg-white/12 border-2 border-white/40 text-white font-medium shadow-lg"
                  : "bg-white/5 border border-white/15 text-white/90 font-normal",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {interest.emoji && (
                <span className="text-lg flex-shrink-0">{interest.emoji}</span>
              )}
              <span className="truncate text-sm">{interest.label}</span>
          </button>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400 text-center mt-4">
          {error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full mt-6">
        {onBack && (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </AnimatedButton>
        )}
        <AnimatedButton
          onClick={handleSubmit}
          disabled={localInterests.length === 0 || loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

