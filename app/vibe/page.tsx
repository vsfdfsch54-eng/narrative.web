"use client"

import { useState, useEffect } from "react"
import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { VIBES, NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS, SPORTS_TOPICS } from "@/lib/constants"
import { Vibe, Topic } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { VibeColors } from "@/components/ui/vibe-icons"
import { Compass, Mic, Newspaper, CircleDot } from "lucide-react"
import { AppShell } from "@/components/AppShell"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { normalizeOnboardingStep } from "@/lib/onboarding"

const TOPIC_CATEGORIES = [
  { id: "general", label: "General", topics: GENERAL_TOPICS, icon: Compass },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS, icon: Mic },
  { id: "news", label: "News", topics: NEWS_TOPICS, icon: Newspaper },
  { id: "sports", label: "Sports", topics: SPORTS_TOPICS, icon: CircleDot },
] as const

const TIME_LIMITS = [5, 15, 30]

// Clean, minimal page container
const pageContainerStyle: CSSProperties = {
  width: '100%',
  maxWidth: tokens.layout.maxWidth,
  margin: '0 auto',
  padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
  paddingBottom: tokens.spacing[32],
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[32],
}

// Simple section header
const sectionHeaderStyle: CSSProperties = {
  marginBottom: tokens.spacing[20],
}

const sectionTitleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: tokens.colors.textPrimaryOnDark,
  margin: '0 0 8px 0',
}

const sectionDescriptionStyle: CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.5,
  color: tokens.colors.textSecondary,
  margin: 0,
}

// Clean option button style
const createOptionStyle = (selected: boolean): CSSProperties => ({
  width: '100%',
  padding: '16px 20px',
  borderRadius: '16px',
  border: selected ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
  background: selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
  color: tokens.colors.textPrimaryOnDark,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  gap: tokens.spacing[12],
})

// Simple grid for options
const optionsGridStyle: CSSProperties = {
  display: 'grid',
  gap: tokens.spacing[12],
  gridTemplateColumns: '1fr',
}

// Category chip style
const createCategoryChipStyle = (selected: boolean): CSSProperties => ({
  padding: '10px 18px',
  borderRadius: '20px',
  border: selected ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
  background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
  color: tokens.colors.textPrimaryOnDark,
  fontSize: '14px',
  fontWeight: selected ? 500 : 400,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  gap: tokens.spacing[8],
})

const categoryRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[10],
  marginBottom: tokens.spacing[20],
}

// Simple icon container
const iconStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  flexShrink: 0,
}

const smallIconStyle: CSSProperties = {
  ...iconStyle,
  width: '36px',
  height: '36px',
  fontSize: '18px',
}

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [topics, setTopics] = useState<{ [key: string]: Topic[] }>({
    news: NEWS_TOPICS,
    'pop-culture': POP_CULTURE_TOPICS,
    general: GENERAL_TOPICS,
    sports: SPORTS_TOPICS
  })
  const [loadingTopics, setLoadingTopics] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Check onboarding_step from DB on mount - redirect if not complete
  useEffect(() => {
    if (loading) return
    
    if (!user) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.push("/")
      }
      return
    }
    
    // Don't redirect if already on onboarding
    if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
      return
    }
      
      const checkOnboarding = async () => {
        try {
        // Fetch user from database - SINGLE SOURCE OF TRUTH
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
          const dbStep = normalizeOnboardingStep(data.data.onboarding_step)
          
          // If not complete, redirect to onboarding
          if (dbStep !== 'complete' && !data.data.onboarding_completed) {
            if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
              router.replace(`/onboarding?step=${dbStep}`)
            }
            }
          } else {
            // User not found in database → redirect to onboarding
          if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
            router.replace("/onboarding?step=email")
          }
          }
        } catch (error) {
          // On error, redirect to onboarding to be safe
        if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
          router.push("/onboarding?step=email")
        }
      }
    }
    
    checkOnboarding()
  }, [user, loading])
  
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }

  const currentCategory = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
  const currentTopics = topics[selectedCategory] || currentCategory?.topics || []
  const canConnect = Boolean(selectedVibe || selectedTopic)

  useEffect(() => {
    const loadTopics = async () => {
      setLoadingTopics(true)
      const category = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
      try {
        const response = await fetch(`/api/topics?category=${selectedCategory}`)
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          const dbTopics: Topic[] = data.data.map((t: any) => ({
            id: t.id,
            label: t.label,
            icon: t.emoji || '📄',
            category: t.category || selectedCategory
          }))
          setTopics(prev => ({ ...prev, [selectedCategory]: dbTopics }))
        } else {
          const fallbackTopics = category?.topics || []
          setTopics(prev => ({ ...prev, [selectedCategory]: fallbackTopics }))
        }
      } catch (error) {
        console.error('Error loading topics:', error)
        const fallbackTopics = category?.topics || []
        setTopics(prev => ({ ...prev, [selectedCategory]: fallbackTopics }))
      } finally {
        setLoadingTopics(false)
      }
    }
    
    loadTopics()
  }, [selectedCategory])

  const handleConnect = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      // Store selections locally for record-keeping
      if (selectedVibe) {
        localStorage.setItem("selectedVibe", selectedVibe.id)
      }
      if (selectedTopic) {
        localStorage.setItem("selectedTopic", selectedTopic.id)
      }
      if (selectedTimeLimit) {
        localStorage.setItem("selectedTimeLimit", selectedTimeLimit.toString())
      }
      
      // Save vibe to database for analytics (non-blocking)
      if (selectedVibe) {
        fetch('/api/vibes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            vibe: selectedVibe.label 
          })
        }).catch(() => {})
      }
      
      const requestBody = { 
        userId,
        vibe: selectedVibe?.label || null,
        topic: selectedTopic?.label || null,
        timeframe: selectedTimeLimit || null,
      }
      
      // Connect using AI matching
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        
        // If user not found, redirect to onboarding
        if (response.status === 404 && errorText.includes('User not found')) {
          router.push('/onboarding?step=email')
          return
        }
        
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        // Matched immediately via AI! Navigate to chat
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else if (data.success && data.inQueue) {
        // In queue, AI is finding best match
        router.push("/chat")
      } else if (data.needsOnboarding) {
        // User needs to complete onboarding
        router.push("/onboarding?step=email")
      } else {
        // Unexpected response, still navigate to chat
        router.push("/chat")
      }
    } catch (error) {
      // Still navigate to chat page even if there's an error
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      const requestBody = { 
        userId,
        vibe: null,
        topic: null,
        timeframe: null,
      }
      
      // Use connect API (replaces old pending-matches)
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 404 && errorText.includes('User not found')) {
          router.push('/onboarding?step=email')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else if (data.success && data.inQueue) {
        router.push("/chat")
      } else {
        router.push("/chat")
      }
    } catch (error) {
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user || (user && !user.email_confirmed_at)) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={pageContainerStyle}>
        {/* Header */}
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 600, 
            letterSpacing: '-0.02em',
            color: tokens.colors.textPrimaryOnDark,
            margin: '0 0 12px 0',
          }}>
            Find your conversation
          </h1>
          <p style={sectionDescriptionStyle}>
            Choose your vibe, pick a topic, or set a timer. We&apos;ll match you with someone who&apos;s on the same wavelength.
          </p>
        </div>

        {/* Step 1: Vibe Selection */}
        <div>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Choose your vibe</h2>
            <p style={sectionDescriptionStyle}>
              Set the tone for your conversation
            </p>
          </div>

          <div style={optionsGridStyle}>
            {VIBES.map((vibe) => {
              const isSelected = selectedVibe?.id === vibe.id
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => setSelectedVibe(isSelected ? null : vibe)}
                  style={createOptionStyle(isSelected)}
                >
                  <span style={iconStyle}>{vibe.icon}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>{vibe.label}</span>
                    <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>
                      {vibe.description}
                    </span>
              </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Topic Selection */}
        <div>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Pick a topic</h2>
            <p style={sectionDescriptionStyle}>
              What do you want to talk about?
            </p>
              </div>

          <div style={categoryRowStyle}>
                  {TOPIC_CATEGORIES.map((category) => {
              const Icon = category.icon
              const selected = selectedCategory === category.id
                    return (
                      <button
                        key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  style={createCategoryChipStyle(selected)}
                      >
                  <Icon size={16} />
                        {category.label}
                      </button>
                    )
                  })}
                </div>

          <div style={optionsGridStyle}>
            {loadingTopics && (
              <p style={{ color: tokens.colors.textSecondary, margin: 0, textAlign: 'center', padding: tokens.spacing[20] }}>
                Loading topics…
              </p>
            )}
            {!loadingTopics && currentTopics.length === 0 && (
              <p style={{ color: tokens.colors.textSecondary, margin: 0, textAlign: 'center', padding: tokens.spacing[20] }}>
                No topics available for this category yet.
              </p>
            )}
            {!loadingTopics && currentTopics.map((topic) => {
              const isSelected = selectedTopic?.id === topic.id
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(isSelected ? null : topic)}
                  style={createOptionStyle(isSelected)}
                >
                  <span style={smallIconStyle}>{topic.icon || '💬'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>{topic.label}</span>
          </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 3: Timer Selection */}
        <div>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Set a timer</h2>
            <p style={sectionDescriptionStyle}>
              How long do you want to chat? You can always extend later.
            </p>
          </div>

          <div style={optionsGridStyle}>
            {TIME_LIMITS.map((limit) => {
              const isSelected = selectedTimeLimit === limit
              return (
                <button
                  key={limit}
                  type="button"
                    onClick={() => setSelectedTimeLimit(isSelected ? null : limit)}
                  style={createOptionStyle(isSelected)}
                >
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>{limit} minutes</span>
                </div>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSelectedTimeLimit(null)}
              style={createOptionStyle(selectedTimeLimit === null)}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: '16px', fontWeight: 500 }}>I&apos;m flexible</span>
              </div>
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12], marginTop: tokens.spacing[8] }}>
            <AnimatedButton
              onClick={handleConnect}
            disabled={!canConnect || saving}
              size="large"
              fullWidth
            >
            {saving ? "Finding someone..." : canConnect ? "Connect now" : "Select a vibe or topic to connect"}
            </AnimatedButton>
            <AnimatedButton
            variant="ghost"
              onClick={handleSkip}
              size="large"
              fullWidth
            disabled={saving}
            >
            Skip for now
            </AnimatedButton>
        </div>
      </div>
    </AppShell>
  )
}
