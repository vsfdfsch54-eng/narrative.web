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
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { tokens } from "@/lib/design-tokens"

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
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (!loading && user && !user.email_confirmed_at) {
      router.push("/verify")
    }
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
      if (selectedVibe) {
        localStorage.setItem("selectedVibe", selectedVibe.id)
      }
      if (selectedTopic) {
        localStorage.setItem("selectedTopic", selectedTopic.id)
      }
      
      if (selectedVibe) {
        await fetch('/api/vibes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            vibe: selectedVibe.label 
          })
        })
      }
      
      // Automatically match user with all existing users when they press Connect
      try {
        await fetch('/api/users/auto-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      } catch (matchError) {
        // Don't fail the connect flow if matching fails
        console.error('Error auto-matching user:', matchError)
      }
      
      router.push("/chat")
    } catch (error) {
      console.error('Error connecting:', error)
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
    
    try {
      // Add user to match queue for real-time matching
      const response = await fetch('/api/match-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match) {
        // Matched immediately! Navigate to chat
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else {
        // In queue, navigate to chat page which will poll for matches
        router.push("/chat")
      }
    } catch (error) {
      console.error('Error joining match queue:', error)
      // Still navigate to chat page
      router.push("/chat")
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
        height: '100vh',
        overflowY: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: tokens.spacing[20],
        paddingBottom: '140px',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: tokens.spacing[20] }}>
          <h1 style={{ 
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            marginBottom: tokens.spacing[8],
          }}>
            Select Your Vibe
          </h1>
          <p style={{ 
            ...tokens.typography.body,
            color: tokens.colors.textSecondary,
            margin: 0,
            fontSize: '14px',
          }}>
            Choose your energy and topic to connect
          </p>
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

        <div style={{ width: '100%', marginBottom: tokens.spacing[20] }}>
          <h2 style={{ 
            ...tokens.typography.heading,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            marginBottom: tokens.spacing[12],
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
            <motion.button
              animate={{
                scale: 1,
                backgroundColor: tokens.colors.pillUnselected,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              disabled={saving}
              style={{
                width: '48%',
                height: '50px',
                borderRadius: tokens.radii.button,
                border: 'none',
                boxShadow: tokens.shadows.pillUnselected,
                fontSize: '15px',
                fontWeight: 400,
                letterSpacing: '0',
                color: tokens.colors.textOnPill,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                transition: 'transform 140ms ease, background 180ms ease',
              }}
            >
              {saving ? "Connecting..." : "Connect"}
            </motion.button>
          ) : (
            <motion.button
              animate={{
                scale: 1,
                backgroundColor: tokens.colors.pillUnselected,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              style={{
                width: '48%',
                height: '50px',
                borderRadius: tokens.radii.button,
                border: 'none',
                boxShadow: tokens.shadows.pillUnselected,
                fontSize: '15px',
                fontWeight: 400,
                letterSpacing: '0',
                color: tokens.colors.textOnPill,
                cursor: 'pointer',
                transition: 'transform 140ms ease, background 180ms ease',
              }}
            >
              Skip and Chat
            </motion.button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
