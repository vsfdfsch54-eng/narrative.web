"use client"

import { useState, useEffect } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS, SPORTS_TOPICS } from "@/lib/constants"
import { Topic } from "@/lib/types"
import { ChevronLeft, Compass, Mic, Newspaper, CircleDot } from "lucide-react"

const TOPIC_CATEGORIES = [
  { id: "general", label: "General", topics: GENERAL_TOPICS, icon: Compass },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS, icon: Mic },
  { id: "news", label: "News", topics: NEWS_TOPICS, icon: Newspaper },
  { id: "sports", label: "Sports", topics: SPORTS_TOPICS, icon: CircleDot },
] as const

interface TopicStepProps {
  selectedTopic: string | null
  onTopicChange: (topic: string | null) => void
  onSubmit: (topic: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function TopicStep({ selectedTopic, onTopicChange, onSubmit, loading, error, onBack }: TopicStepProps) {
  const [localTopic, setLocalTopic] = useState<string | null>(selectedTopic)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")

  useEffect(() => {
    setLocalTopic(selectedTopic)
  }, [selectedTopic])

  const currentCategory = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
  const currentTopics = currentCategory?.topics || []

  const handleTopicSelect = (topicId: string) => {
    const newTopic = localTopic === topicId ? null : topicId
    setLocalTopic(newTopic)
    onTopicChange(newTopic)
  }

  const handleSubmit = () => {
    if (!localTopic) return
    // Call onSubmit but don't await - navigation happens immediately
    onSubmit(localTopic).catch((error) => {
      console.error('[TopicStep] Submit error:', error)
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
          Pick a topic
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          What do you want to talk about?
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
        {TOPIC_CATEGORIES.map((category) => {
          const Icon = category.icon
          const selected = selectedCategory === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                border: selected ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
                background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: tokens.colors.textPrimaryOnDark,
                fontSize: '14px',
                fontWeight: selected ? 500 : 400,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[8],
                whiteSpace: 'nowrap',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Icon size={16} />
              {category.label}
            </button>
          )
        })}
      </div>

      {/* Topics Grid */}
      <div style={{
        display: 'grid',
        gap: tokens.spacing[12],
        gridTemplateColumns: '1fr',
        maxHeight: '400px',
        overflowY: 'auto',
      }}>
        {currentTopics.map((topic: Topic) => {
          const isSelected = localTopic === topic.id
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleTopicSelect(topic.id)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '16px',
                border: isSelected ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: tokens.colors.textPrimaryOnDark,
                textAlign: 'left',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[12],
                opacity: loading ? 0.5 : 1,
              }}
            >
              <span style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {topic.icon || '💬'}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '16px', fontWeight: 500 }}>{topic.label}</span>
              </div>
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
          disabled={!localTopic || loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>
      </div>
    </div>
  )
}

