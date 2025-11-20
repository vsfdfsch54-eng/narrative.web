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
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])
  
  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
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
    const userId = getUserId()
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      // Save vibe to database if selected
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
      if (selectedVibe) {
        localStorage.setItem("selectedVibe", selectedVibe.id)
      }
      if (selectedTopic) {
        localStorage.setItem("selectedTopic", selectedTopic.id)
      }
      
      // Find or create a match
      const matchResponse = await fetch(`/api/matches?userId=${userId}&action=find`)
      const matchData = await matchResponse.json()
      
      if (matchData.success && matchData.data) {
        // Match found! Navigate to chat
        const match = matchData.data
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
        router.push(`/chat/${otherUserId}?matchId=${match.id}`)
      } else if (matchData.inQueue) {
        // User is in queue, show waiting message and poll for match
        // For now, redirect to chat page which will handle waiting
        router.push("/chat")
      } else {
        // No match found, go to connect page
        router.push("/connect")
      }
    } catch (error) {
      console.error('Error connecting:', error)
      // Still navigate even if save fails
      router.push("/connect")
    } finally {
      setSaving(false)
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (!loading && user && !user.email_confirmed_at) {
      // User is logged in but not verified, redirect to verify page
      router.push("/verify")
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading || !user || (user && !user.email_confirmed_at)) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#EDEDED]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content px-4 py-3 sm:p-4 pb-4 overflow-hidden flex flex-col h-full">
              {/* Header - Modern & Clean */}
              <div className="text-center mb-2 sm:mb-3 flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-white leading-[1.1] mb-2 sm:mb-3">
                  Let&apos;s get started
                </h1>
                
                {/* Time Limit Selector - Refined */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-[#EDEDED]/50" />
                  <span className="text-[10px] text-[#EDEDED]/50 font-semibold tracking-wider uppercase">Time</span>
                  <div className="flex items-center gap-1.5">
                    {TIME_LIMITS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTimeLimit(time)}
                        className={`
                          relative px-3 py-1 rounded-full text-[10px] font-semibold tracking-tight transition-all duration-200 min-h-[28px] min-w-[28px]
                          ${selectedTimeLimit === time 
                            ? "bg-[#EDEDED] text-[#0A0A0A] shadow-lg" 
                            : "bg-white/5 text-[#EDEDED]/80 border border-white/10 hover:bg-white/10"
                          }
                        `}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Indicator - Subtle */}
              <div className="flex items-center justify-center gap-2 mb-2 flex-shrink-0">
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  selectedVibe ? "bg-white w-12" : "bg-white/15 w-8"
                }`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  selectedTopic ? "bg-white w-12" : "bg-white/15 w-8"
                }`} />
              </div>

              {/* Main Content - Modern Cards */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Vibe Module */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex-shrink-0">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                        <Sparkles className="h-4 w-4 text-[#EDEDED]/80" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                          Your Vibe
                        </h2>
                        <p className="text-[10px] text-[#EDEDED]/60 font-medium tracking-wide">
                          How are you feeling?
                        </p>
                      </div>
                    </div>
                    {selectedVibe && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Last Vibe Option */}
                  {lastVibe && !loadingLastVibe && (
                    <button
                      onClick={handleSelectLastVibe}
                      className={`
                        relative w-full px-3 py-2 rounded-lg text-left transition-all duration-200 overflow-hidden flex-shrink-0 mb-2
                        ${selectedVibe?.id === lastVibe.id
                          ? "bg-[#EDEDED] text-[#0A0A0A] border border-white"
                          : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        }
                      `}
                    >
                      <div className="relative flex items-center justify-between z-10">
                        <div>
                          <p className="text-[9px] text-[#EDEDED]/60 font-semibold uppercase tracking-wider mb-0.5">Last vibe</p>
                          <p className="text-xs font-bold">{lastVibe.label}</p>
                        </div>
                        {selectedVibe?.id === lastVibe.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
                        )}
                      </div>
                    </button>
                  )}

                  {/* Vibe Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1 mt-2">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pt-0.5 px-2 scroll-smooth">
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
                </div>

                {/* Topic Module */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex-1 min-h-0 flex flex-col">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                        <MessageSquare className="h-4 w-4 text-[#EDEDED]/80" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                          Your Topic
                        </h2>
                        <p className="text-[10px] text-[#EDEDED]/60 font-medium tracking-wide">
                          What interests you?
                        </p>
                      </div>
                    </div>
                    {selectedTopic && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>

                    {/* Most Popular Topic Option */}
                    <button
                      onClick={handleSelectMostPopular}
                      className={`
                        relative w-full px-3 py-2 rounded-lg text-left transition-all duration-200 overflow-hidden flex-shrink-0 mb-2
                        ${selectedTopic?.id === MOST_POPULAR_TOPIC.id
                          ? "bg-[#EDEDED] text-[#0A0A0A] border border-white"
                          : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        }
                      `}
                    >
                      <div className="relative flex items-center justify-between z-10">
                        <div>
                          <p className="text-[9px] text-[#EDEDED]/60 font-semibold uppercase tracking-wider mb-0.5">Most popular</p>
                          <p className="text-xs font-bold line-clamp-1">{MOST_POPULAR_TOPIC.label}</p>
                        </div>
                        {selectedTopic?.id === MOST_POPULAR_TOPIC.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
                        )}
                      </div>
                    </button>

                  {/* Category Dropdown */}
                  <div className="relative flex-shrink-0 mb-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setSelectedTopic(null)
                      }}
                      className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-[#EDEDED]/90 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all duration-200 cursor-pointer hover:bg-white/10"
                    >
                      {TOPIC_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#EDEDED]/60 pointer-events-none" />
                  </div>

                  {/* Topic Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1 mt-2 flex-1 min-h-0">
                    <div
                      key={selectedCategory}
                      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pt-0.5 px-2 scroll-smooth h-full"
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
                </div>
              </div>

              {/* Action Buttons - Modern & Polished */}
              <div
                ref={actionSectionRef}
                className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10 flex-shrink-0"
              >
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <div className="w-full">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleConnect}
                        disabled={saving}
                        className="w-full h-10 text-sm font-semibold tracking-tight rounded-lg bg-[#EDEDED] text-[#0A0A0A] hover:bg-white/95 disabled:opacity-50 shadow-lg"
                      >
                        {saving ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleSkipAndChat}
                        className="w-full h-10 text-sm font-semibold tracking-tight rounded-lg bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20"
                      >
                        Skip and Chat
                      </Button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
