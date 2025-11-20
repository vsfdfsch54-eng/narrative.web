"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { VibeChip } from "@/components/ui/vibe-chip"
import { TopicChip } from "@/components/ui/topic-chip"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { VIBES, NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS } from "@/lib/constants"
import { Vibe, Topic } from "@/lib/types"
import { ChevronDown, Sparkles, MessageSquare, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const TOPIC_CATEGORIES = [
  { id: "news", label: "News", topics: NEWS_TOPICS },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS },
  { id: "general", label: "General", topics: GENERAL_TOPICS },
] as const

const TIME_LIMITS = [5, 15, 30]

// Fallback vibe if none found in database
const FALLBACK_VIBE: Vibe = { id: 'curious', label: 'Curious', icon: '🔍', color: 'green', description: 'Eager to learn and explore' }
const MOST_POPULAR_TOPIC: Topic = { id: 'trump-epstein', label: 'Trump releases Epstein files', icon: '📄', category: 'news' }

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("news")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastVibe, setLastVibe] = useState<Vibe | null>(null)
  const [loadingLastVibe, setLoadingLastVibe] = useState(true)
  const [topics, setTopics] = useState<{ [key: string]: Topic[] }>({
    news: NEWS_TOPICS,
    'pop-culture': POP_CULTURE_TOPICS,
    general: GENERAL_TOPICS
  })
  const [loadingTopics, setLoadingTopics] = useState(false)
  const router = useRouter()
  const actionSectionRef = useRef<HTMLDivElement | null>(null)
  const { user, loading } = useAuth()
  
  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    // If not authenticated, redirect to login
    if (!loading && !user) {
      router.push("/login")
      return null
    }
    return null
  }

  const currentCategory = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
  const currentTopics = topics[selectedCategory] || currentCategory?.topics || []
  const isComplete = selectedVibe && selectedTopic

  // Load last vibe from database
  useEffect(() => {
    if (!user || loading) return
    
    const loadLastVibe = async () => {
      const userId = getUserId()
      if (!userId) return
      
      try {
        const response = await fetch(`/api/vibes?userId=${userId}`)
        const data = await response.json()
        if (data.success && data.data) {
          // Find the vibe in VIBES array that matches the label
          const matchingVibe = VIBES.find(v => v.label === data.data.vibe)
          if (matchingVibe) {
            setLastVibe(matchingVibe)
          } else {
            // If not found, create a vibe object from the database data
            setLastVibe({
              id: data.data.id,
              label: data.data.vibe,
              icon: '🔍',
              color: 'green',
              description: 'Your last vibe'
            })
          }
        }
      } catch (error) {
        console.error('Error loading last vibe:', error)
      } finally {
        setLoadingLastVibe(false)
      }
    }
    
    loadLastVibe()
  }, [user, loading])

  // Load topics from database when category changes
  useEffect(() => {
    const loadTopics = async () => {
      setLoadingTopics(true)
      const category = TOPIC_CATEGORIES.find((cat) => cat.id === selectedCategory)
      try {
        const response = await fetch(`/api/topics?category=${selectedCategory}`)
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          // Convert database topics to Topic format
          const dbTopics: Topic[] = data.data.map((t: any) => ({
            id: t.id,
            label: t.label,
            icon: t.emoji || '📄',
            category: t.category || selectedCategory
          }))
          setTopics(prev => ({ ...prev, [selectedCategory]: dbTopics }))
        } else {
          // Fallback to constants if no DB topics
          const fallbackTopics = category?.topics || []
          setTopics(prev => ({ ...prev, [selectedCategory]: fallbackTopics }))
        }
      } catch (error) {
        console.error('Error loading topics:', error)
        // Fallback to constants on error
        const fallbackTopics = category?.topics || []
        setTopics(prev => ({ ...prev, [selectedCategory]: fallbackTopics }))
      } finally {
        setLoadingTopics(false)
      }
    }
    
    loadTopics()
  }, [selectedCategory])

  const handleConnect = async () => {
    if (selectedVibe && selectedTopic) {
      const userId = getUserId()
      if (!userId) {
        router.push("/login")
        return
      }
      
      setSaving(true)
      
      try {
        // Save vibe to database
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
        
        // Keep localStorage for time limit (can be moved to DB later)
        if (selectedTimeLimit) {
          localStorage.setItem("timeLimit", selectedTimeLimit.toString())
        }
        
        // Store selections in localStorage for immediate use
        localStorage.setItem("selectedVibe", selectedVibe.id)
        localStorage.setItem("selectedTopic", selectedTopic.id)
        
        router.push("/connect")
      } catch (error) {
        console.error('Error saving vibe:', error)
        // Still navigate even if save fails
        router.push("/connect")
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSkipAndChat = () => {
    router.push("/chat")
  }

  const handleSelectLastVibe = () => {
    if (lastVibe) {
      setSelectedVibe(lastVibe)
    } else {
      setSelectedVibe(FALLBACK_VIBE)
    }
  }

  const handleSelectMostPopular = () => {
    setSelectedTopic(MOST_POPULAR_TOPIC)
  }

  useEffect(() => {
    if (selectedVibe && selectedTopic) {
      const timer = setTimeout(() => {
        actionSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [selectedVibe, selectedTopic])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Sleek Black */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content p-4 sm:p-5 pb-20">
              {/* Chat Icon - Top Left */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                onClick={() => router.push("/conversations")}
                className="absolute top-4 left-4 z-20 min-w-[44px] min-h-[44px] p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all touch-manipulation"
              >
                <MessageSquare className="h-5 w-5 text-white/80" />
              </motion.button>

              {/* Header - Modern & Clean */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-white leading-[1.1] mb-4 sm:mb-6">
                  Let&apos;s get started
                </h1>
                
                {/* Time Limit Selector - Refined */}
                <div className="flex items-center justify-center gap-2.5 mb-2">
                  <Clock className="h-4 w-4 text-white/50" />
                  <span className="text-[11px] text-white/50 font-semibold tracking-wider uppercase">Time</span>
                  <div className="flex items-center gap-2">
                    {TIME_LIMITS.map((time) => (
                      <motion.button
                        key={time}
                        onClick={() => setSelectedTimeLimit(time)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          relative px-5 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 min-h-[36px] min-w-[36px]
                          ${selectedTimeLimit === time 
                            ? "bg-white text-black shadow-lg" 
                            : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
                          }
                        `}
                      >
                        {time}m
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Indicator - Subtle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.3, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <motion.div 
                  layout
                  initial={false}
                  className={`h-1.5 rounded-full transition-all duration-400 ${
                    selectedVibe ? "bg-white w-16" : "bg-white/15 w-10"
                  }`}
                />
                <motion.div 
                  layout
                  initial={false}
                  className={`h-1.5 rounded-full transition-all duration-400 ${
                    selectedTopic ? "bg-white w-16" : "bg-white/15 w-10"
                  }`}
                />
              </motion.div>

              {/* Main Content - Modern Cards */}
              <div className="flex flex-col gap-4 sm:gap-5">
                {/* Vibe Module */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <Sparkles className="h-5 w-5 text-white/80" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                          Your Vibe
                        </h2>
                        <p className="text-xs text-white/60 font-medium tracking-wide mt-1">
                          How are you feeling?
                        </p>
                      </div>
                    </div>
                    {selectedVibe && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* Last Vibe Option */}
                  {lastVibe && !loadingLastVibe && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.4, 
                        duration: 0.3, 
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSelectLastVibe}
                      className={`
                        relative w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 overflow-hidden flex-shrink-0
                        ${selectedVibe?.id === lastVibe.id
                          ? "bg-white text-black border border-white"
                          : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        }
                      `}
                    >
                      <div className="relative flex items-center justify-between z-10">
                        <div>
                          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">Last vibe</p>
                          <p className="text-sm font-bold">{lastVibe.label}</p>
                        </div>
                        {selectedVibe?.id === lastVibe.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-2 h-2 rounded-full bg-black"
                          />
                        )}
                      </div>
                    </motion.button>
                  )}

                  {/* Vibe Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1 mt-3">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 px-4 scroll-smooth">
                      {VIBES.map((vibe) => (
                        <div
                          key={vibe.id}
                          className="flex-shrink-0"
                        >
                          <VibeChip
                            vibe={vibe}
                            selected={selectedVibe?.id === vibe.id}
                            onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                            delay={0}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Fade gradients */}
                    <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none z-10" />
                    <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-10" />
                  </div>
                </motion.div>

                {/* Topic Module */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <MessageSquare className="h-5 w-5 text-white/80" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                          Your Topic
                        </h2>
                        <p className="text-xs text-white/60 font-medium tracking-wide mt-1">
                          What interests you?
                        </p>
                      </div>
                    </div>
                    {selectedTopic && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </div>

                    {/* Most Popular Topic Option */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.5, 
                        duration: 0.3, 
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSelectMostPopular}
                      className={`
                        relative w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 overflow-hidden flex-shrink-0 mb-3
                        ${selectedTopic?.id === MOST_POPULAR_TOPIC.id
                          ? "bg-white text-black border border-white"
                          : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        }
                      `}
                    >
                      <div className="relative flex items-center justify-between z-10">
                        <div>
                          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">Most popular</p>
                          <p className="text-sm font-bold line-clamp-1">{MOST_POPULAR_TOPIC.label}</p>
                        </div>
                        {selectedTopic?.id === MOST_POPULAR_TOPIC.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-2 h-2 rounded-full bg-black"
                          />
                        )}
                      </div>
                    </motion.button>

                  {/* Category Dropdown */}
                  <motion.div 
                    className="relative flex-shrink-0 mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.6, 
                      duration: 0.3, 
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setSelectedTopic(null)
                      }}
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white/90 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all duration-200 cursor-pointer hover:bg-white/10"
                    >
                      {TOPIC_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-black">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </motion.div>

                  {/* Topic Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1 mt-3">
                    <div
                      key={selectedCategory}
                      className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 px-4 scroll-smooth"
                    >
                      {currentTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex-shrink-0"
                        >
                          <TopicChip
                            topic={topic}
                            selected={selectedTopic?.id === topic.id}
                            onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                            delay={0}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Fade gradients */}
                    <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none z-10" />
                    <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-10" />
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons - Modern & Polished */}
              <motion.div
                ref={actionSectionRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.6, 
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-white/10"
              >
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ 
                        duration: 0.2, 
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="w-full"
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleConnect}
                        disabled={saving}
                        className="w-full h-12 text-base font-semibold tracking-tight rounded-xl bg-white text-black hover:bg-white/95 disabled:opacity-50 shadow-lg"
                      >
                        {saving ? "Connecting..." : "Connect"}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleSkipAndChat}
                        className="w-full h-12 text-base font-semibold tracking-tight rounded-xl bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20"
                      >
                        Skip and Chat
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
