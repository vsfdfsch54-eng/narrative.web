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
      
      router.push("/chat")
    } catch (error) {
      console.error('Error connecting:', error)
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push("/chat")
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
        display: 'flex', 
        flexDirection: 'column', 
        gap: tokens.spacing[20], 
        paddingTop: tokens.spacing[20], 
        paddingBottom: '180px',
        minHeight: '100vh',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center' }}>
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

        <div>
          <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
            alignItems: 'center', 
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div className="flex" style={{ gap: tokens.spacing[16] }}>
              {VIBES.map((vibe) => (
                <VibeChip
                  key={vibe.id}
                  vibe={vibe}
                  selected={selectedVibe?.id === vibe.id}
                  onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                  delay={0}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
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
          
          <div className="relative mb-4" ref={dropdownRef}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={{
                width: '100%',
                height: '40px',
                padding: `10px ${tokens.spacing[14]}`,
                borderRadius: tokens.radii.input,
                background: tokens.colors.pillPrimary,
                border: 'none',
                color: tokens.colors.textOnPill,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: tokens.shadows.pill,
                fontSize: '13px',
                fontWeight: 500,
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
                  background: tokens.colors.pillPrimary, 
                  border: 'none', 
                  borderRadius: tokens.radii.pill, 
                  overflow: 'hidden',
                  boxShadow: tokens.shadows.pill,
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
                          gap: tokens.spacing[10],
                          padding: `0 ${tokens.spacing[14]}`,
                          height: '40px',
                          background: selectedCategory === category.id ? tokens.colors.pillSecondary : 'transparent',
                          border: 'none',
                          color: tokens.colors.textOnPill,
                          fontSize: '13px',
                          fontWeight: selectedCategory === category.id ? 500 : 400,
                          letterSpacing: '0',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCategory !== category.id) {
                            e.currentTarget.style.background = tokens.colors.pillSecondary
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
          
          <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
            alignItems: 'center', 
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            marginTop: tokens.spacing[12],
          }}>
            <div className="flex" style={{ gap: tokens.spacing[16] }}>
              {currentTopics.map((topic) => (
                <TopicChip
                  key={topic.id}
                  topic={topic}
                  selected={selectedTopic?.id === topic.id}
                  onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                  delay={0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Buttons at bottom */}
        <div style={{ 
          marginTop: tokens.spacing[28],
          width: '100%',
        }}>
          {canConnect ? (
            <Button
              variant="primary"
              onClick={handleConnect}
              disabled={saving}
              style={{ width: '100%' }}
            >
              {saving ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleSkip}
              style={{ width: '100%' }}
            >
              Skip and Chat
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
