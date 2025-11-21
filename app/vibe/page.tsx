"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { VibeChip } from "@/components/ui/vibe-chip"
import { TopicChip } from "@/components/ui/topic-chip"
import { TopMenu } from "@/components/ui/top-menu"
import { VIBES, NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS, SPORTS_TOPICS } from "@/lib/constants"
import { Vibe, Topic } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ChevronDown, Compass, Mic, Newspaper, CircleDot } from "lucide-react"
import { colors, typography, spacing, components, shadows, motion as motionConfig } from "@/lib/design-system"

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
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: colors.background }}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden w-full h-full"
      style={{
        background: colors.background,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Top Menu */}
        <div className="flex-shrink-0" style={{ padding: spacing.screen, paddingBottom: spacing.lg }}>
          <TopMenu />
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            padding: `0 ${spacing.screen}`,
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.section, maxWidth: '600px', margin: '0 auto' }}>
            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                fontSize: typography.h1.fontSize,
                fontWeight: typography.h1.fontWeight,
                letterSpacing: typography.h1.letterSpacing,
                lineHeight: typography.h1.lineHeight,
                color: colors.textPrimary,
                marginBottom: spacing.md
              }}>
                Select Your Vibe
              </h1>
            </div>

            {/* Vibe Section */}
            <div>
              <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
                alignItems: 'center', 
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                marginTop: spacing.md,
                marginBottom: spacing.md
              }}>
                <div className="flex" style={{ gap: spacing.md }}>
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

            {/* Topic Section */}
            <div>
              <h2 style={{ 
                fontSize: typography.h2.fontSize,
                fontWeight: typography.h2.fontWeight,
                letterSpacing: typography.h2.letterSpacing,
                color: colors.textPrimary,
                marginBottom: spacing.lg,
                textAlign: 'center'
              }}>
                Choose a Topic
              </h2>
              
              {/* Topic Category Dropdown */}
              <div className="relative mb-4" ref={dropdownRef}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                  className={cn(
                    "w-full rounded-[14px]",
                    "bg-white text-black",
                    "flex items-center justify-between",
                    "font-medium text-[16px]",
                    "transition-all duration-150 ease-in-out",
                    "border"
                  )}
                  style={{
                    height: components.dropdown.height,
                    padding: `0 ${spacing.md}`,
                    border: `1px solid ${colors.borderStrong}`,
                    boxShadow: shadows.card,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const CategoryIcon = TOPIC_CATEGORIES.find(c => c.id === selectedCategory)?.icon || Compass
                      return <CategoryIcon className="w-4 h-4" />
                    })()}
                    <span>{TOPIC_CATEGORIES.find(c => c.id === selectedCategory)?.label || "General"}</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform duration-150 ease-in-out",
                      isCategoryDropdownOpen && "rotate-180"
                    )}
                  />
                </motion.button>
                
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                    className="absolute top-full left-0 right-0 mt-2 z-50"
                  >
                    <div style={{ 
                      background: colors.background, 
                      border: `1px solid ${colors.borderStrong}`, 
                      borderRadius: components.dropdown.radius, 
                      overflow: 'hidden',
                      boxShadow: shadows.card,
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
                            className={cn(
                              "w-full text-left flex items-center",
                              "transition-all duration-150 ease-in-out",
                              "hover:bg-gray-50",
                              selectedCategory === category.id && "bg-gray-100"
                            )}
                            style={{
                              padding: `0 ${spacing.md}`,
                              height: components.dropdown.itemHeight,
                              color: colors.textPrimary,
                              fontSize: typography.body.fontSize,
                              fontWeight: selectedCategory === category.id ? 500 : 400,
                              gap: spacing.sm,
                            }}
                          >
                            <CategoryIcon className="w-4 h-4" />
                            {category.label}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Topic Chips */}
              <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
                alignItems: 'center', 
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                marginTop: spacing.md,
                marginBottom: spacing.md
              }}>
                <div className="flex" style={{ gap: spacing.md }}>
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

            {/* Duration Segmented Control */}
            <div className="flex justify-center">
              <div 
                className="flex items-center gap-1 p-1 relative overflow-hidden"
                style={{ 
                  height: components.segmentedControl.height, 
                  width: 'fit-content',
                  borderRadius: components.segmentedControl.radius,
                  background: components.segmentedControl.background,
                }}
              >
                {TIME_LIMITS.map((time) => (
                  <motion.button
                    key={time}
                    onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }}
                    className={cn(
                      "h-full rounded-[10px] text-[15px] font-medium transition-all duration-150 ease-in-out relative z-10",
                      "px-4",
                      selectedTimeLimit === time 
                        ? "bg-black text-white"
                        : "bg-transparent"
                    )}
                    style={{
                      color: selectedTimeLimit === time 
                        ? components.segmentedControl.selected.text 
                        : components.segmentedControl.unselected.text,
                    }}
                  >
                    {time}m
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fixed Footer */}
        <div 
          className="fixed left-0 right-0 flex flex-row"
          style={{
            bottom: `calc(env(safe-area-inset-bottom) + 76px)`,
            padding: `0 ${spacing.screen}`,
            gap: spacing.md,
            zIndex: 50,
            width: '100%',
            maxWidth: '600px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* CONNECT Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }
            }}
            onClick={handleConnect}
            disabled={saving || !canConnect}
            className={cn(
              "flex-1 rounded-[12px] font-semibold transition-all duration-150 ease-in-out",
              "px-4",
              "disabled:cursor-not-allowed"
            )}
            style={{
              height: components.button.height,
              fontSize: typography.body.fontSize,
              background: canConnect ? components.button.primary.background : colors.border,
              color: canConnect ? components.button.primary.text : colors.textMuted,
              boxShadow: canConnect ? components.button.primary.shadow : 'none',
            }}
          >
            {saving ? "Connecting..." : "CONNECT"}
          </motion.button>
          
          {/* SKIP Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionConfig.duration.normal / 1000, ease: motionConfig.easing }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: motionConfig.duration.fast / 1000, ease: motionConfig.easing }
            }}
            onClick={handleSkip}
            className={cn(
              "flex-1 rounded-[12px] font-semibold transition-all duration-150 ease-in-out",
              "px-4"
            )}
            style={{
              height: components.button.height,
              fontSize: typography.body.fontSize,
              background: 'transparent',
              color: colors.textPrimary,
              border: `1px solid ${colors.borderStrong}`,
            }}
          >
            SKIP
          </motion.button>
        </div>
      </div>
    </div>
  )
}
