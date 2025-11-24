"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { VibeChip } from "@/components/ui/vibe-chip"
import { TopicChip } from "@/components/ui/topic-chip"
import { VIBES, NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS, SPORTS_TOPICS } from "@/lib/constants"
import { Vibe, Topic } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ChevronDown, Compass, Mic, Newspaper, CircleDot } from "lucide-react"
import { AppShell } from "@/components/AppShell"
import { AnimatedButton } from "@/components/ui/animated-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { tokens } from "@/lib/design-tokens"
import { normalizeOnboardingStep } from "@/lib/onboarding"

const TOPIC_CATEGORIES = [
  { id: "general", label: "General", topics: GENERAL_TOPICS, icon: Compass },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS, icon: Mic },
  { id: "news", label: "News", topics: NEWS_TOPICS, icon: Newspaper },
  { id: "sports", label: "Sports", topics: SPORTS_TOPICS, icon: CircleDot },
] as const

const TIME_LIMITS = [5, 15, 30]

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
      router.push("/")
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
          if (dbStep !== 'complete') {
            router.push("/onboarding")
          }
        } else {
          // User not found in database → redirect to onboarding
          router.push("/onboarding")
        }
      } catch (error) {
        // On error, redirect to onboarding to be safe
        router.push("/onboarding")
      }
    }
    
    checkOnboarding()
  }, [user, loading, router])
  
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }

  const currentCategory = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
  const currentTopics = topics[selectedCategory] || currentCategory?.topics || []
  const canConnect = selectedVibe || selectedTopic

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
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside as EventListener)
      document.addEventListener("touchstart", handleClickOutside as EventListener)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener)
      document.removeEventListener("touchstart", handleClickOutside as EventListener)
    }
  }, [isCategoryDropdownOpen])

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
          router.push('/onboarding')
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
        router.push("/onboarding")
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
          router.push('/onboarding')
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
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: tokens.spacing[32],
        paddingBottom: '140px',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <div style={{ textAlign: 'center', marginBottom: tokens.spacing[28] }}>
          <h1 style={{ 
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
          }}>
            Select Your Vibe
          </h1>
        </div>

        <div style={{ 
          width: '100%',
          marginBottom: tokens.spacing[20],
        }}>
          <div style={{ 
            display: 'flex',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            gap: '12px',
            padding: '0 20px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {VIBES.map((vibe) => (
              <div key={vibe.id} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
                <VibeChip
                  vibe={vibe}
                  selected={selectedVibe?.id === vibe.id}
                  onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                  delay={0}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', marginBottom: tokens.spacing[28] }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            marginBottom: tokens.spacing[20],
            textAlign: 'center',
            fontSize: '16px',
          }}>
            Choose a Topic
          </h2>
          
          <div className="relative mb-4" ref={dropdownRef} style={{ marginBottom: tokens.spacing[12] }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: tokens.radii.input,
                background: tokens.colors.pillUnselected,
                border: 'none',
                color: tokens.colors.textOnPill,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: tokens.shadows.pillUnselected,
                fontSize: '15px',
                fontWeight: 400,
                letterSpacing: '0',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const CategoryIcon = TOPIC_CATEGORIES.find(c => c.id === selectedCategory)?.icon || Compass
                  return <CategoryIcon className="w-4 h-4" style={{ color: tokens.colors.accentBlue }} />
                })()}
                <span>{TOPIC_CATEGORIES.find(c => c.id === selectedCategory)?.label || "General"}</span>
              </div>
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-transform duration-150 ease-in-out",
                  isCategoryDropdownOpen && "rotate-180"
                )}
                style={{ color: tokens.colors.textMuted }}
              />
            </motion.button>
            
            {isCategoryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50"
              >
                <div style={{ 
                  background: tokens.colors.pillUnselected, 
                  border: 'none', 
                  borderRadius: tokens.radii.pill, 
                  overflow: 'hidden',
                  boxShadow: tokens.shadows.pillUnselected,
                }}>
                  {TOPIC_CATEGORIES.map((category) => {
                    const CategoryIcon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setIsCategoryDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 14px',
                          background: selectedCategory === category.id ? tokens.colors.pillSelected : 'transparent',
                          border: 'none',
                          color: tokens.colors.textOnPill,
                          fontSize: '15px',
                          fontWeight: 400,
                          letterSpacing: '0',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCategory !== category.id) {
                            e.currentTarget.style.background = tokens.colors.pillSelected
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCategory !== category.id) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <CategoryIcon className="w-4 h-4" style={{ color: tokens.colors.accentBlue }} />
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
          
          <div style={{ 
            display: 'flex',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            gap: '12px',
            padding: '0 20px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {currentTopics.map((topic) => (
              <div key={topic.id} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
                <TopicChip
                  topic={topic}
                  selected={selectedTopic?.id === topic.id}
                  onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                  delay={0}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          width: '100%',
          marginBottom: tokens.spacing[20],
        }}>
          <div style={{ 
            display: 'flex',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            gap: '12px',
            padding: '0 20px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            justifyContent: 'center',
          }}>
            {TIME_LIMITS.map((limit) => {
              const isSelected = selectedTimeLimit === limit
              return (
                <div key={limit} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
                  <motion.button
                    animate={{
                      scale: isSelected ? 1.06 : 1,
                      backgroundColor: isSelected ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
                    }}
                    transition={{
                      transform: { duration: 0.14, ease: 'easeOut' },
                      backgroundColor: { duration: 0.18, ease: 'easeOut' },
                    }}
                    whileTap={{ scale: isSelected ? 1.06 : 0.98 }}
                    onClick={() => setSelectedTimeLimit(isSelected ? null : limit)}
                    style={{
                      borderRadius: tokens.radii.pill,
                      padding: '8px 14px',
                      border: 'none',
                      boxShadow: isSelected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
                      fontSize: '15px',
                      fontWeight: 400,
                      letterSpacing: '0',
                      color: tokens.colors.textOnPill,
                      cursor: 'pointer',
                      willChange: "transform, background-color"
                    }}
                  >
                    {limit}m
                  </motion.button>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ 
          marginTop: '20px',
          marginBottom: '100px',
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          width: '100%',
          padding: '0 20px',
        }}>
          {canConnect ? (
            <AnimatedButton
              onClick={handleConnect}
              disabled={saving}
              size="large"
              fullWidth
            >
              {saving ? "Connecting..." : "Connect"}
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onClick={handleSkip}
              size="large"
              fullWidth
            >
              Skip and Chat
            </AnimatedButton>
          )}
        </div>
      </div>
    </AppShell>
  )
}
