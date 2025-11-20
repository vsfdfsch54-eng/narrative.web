"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
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
  const { user, loading } = useAuth()
  
  // Redirect if not authenticated or not verified
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (!loading && user && !user.email_confirmed_at) {
      router.push("/verify")
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
          const matchingVibe = VIBES.find(v => v.label === data.data.vibe)
          if (matchingVibe) {
            setLastVibe(matchingVibe)
          } else {
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
      
      if (selectedTimeLimit) {
        localStorage.setItem("timeLimit", selectedTimeLimit.toString())
      }
      
      if (selectedVibe) {
        localStorage.setItem("selectedVibe", selectedVibe.id)
      }
      if (selectedTopic) {
        localStorage.setItem("selectedTopic", selectedTopic.id)
      }
      
      const matchResponse = await fetch(`/api/matches?userId=${userId}&action=find`)
      const matchData = await matchResponse.json()
      
      if (matchData.success && matchData.data) {
        const match = matchData.data
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
        router.push(`/chat/${otherUserId}?matchId=${match.id}`)
      } else if (matchData.inQueue) {
        router.push("/chat")
      } else {
        router.push("/connect")
      }
    } catch (error) {
      console.error('Error connecting:', error)
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

  // Show loading while checking auth
  if (loading || !user || (user && !user.email_confirmed_at)) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full m-0 p-0">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content px-3 py-2 pb-0 overflow-hidden flex flex-col h-full">
              {/* Compact Header */}
              <div className="text-center mb-1.5 flex-shrink-0">
                <h1 className="text-xl font-black tracking-tight text-[#f1f1f3] leading-tight mb-1">
                  Let&apos;s get started
                </h1>
                
                {/* Time Limit Selector - Compact */}
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#f1f1f3]/50" />
                  <div className="flex items-center gap-1">
                    {TIME_LIMITS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTimeLimit(time)}
                        className={`
                          px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all min-h-[24px] min-w-[24px]
                          ${selectedTimeLimit === time 
                            ? "bg-[#f1f1f3] text-[#0a0a0c]" 
                            : "bg-white/5 text-[#f1f1f3]/80 border border-white/10"
                          }
                        `}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compact Progress Indicator */}
              <div className="flex items-center justify-center gap-1.5 mb-1.5 flex-shrink-0">
                <div className={`h-0.5 rounded-full transition-all ${
                  selectedVibe ? "bg-[#f1f1f3] w-8" : "bg-white/15 w-6"
                }`} />
                <div className={`h-0.5 rounded-full transition-all ${
                  selectedTopic ? "bg-[#f1f1f3] w-8" : "bg-white/15 w-6"
                }`} />
              </div>

              {/* Main Content - Compact Cards */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
                {/* Vibe Module - Compact */}
                <div className="bg-white/5 rounded-lg p-2 border border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#f1f1f3]/80" />
                      <h2 className="text-sm font-bold text-[#f1f1f3]">Your Vibe</h2>
                    </div>
                    {selectedVibe && (
                      <div className="w-1 h-1 rounded-full bg-[#f1f1f3]" />
                    )}
                  </div>

                  {/* Last Vibe Option - Compact */}
                  {lastVibe && !loadingLastVibe && (
                    <button
                      onClick={handleSelectLastVibe}
                      className={`
                        w-full px-2 py-1 rounded-lg text-left transition-all mb-1.5 text-xs
                        ${selectedVibe?.id === lastVibe.id
                          ? "bg-[#f1f1f3] text-[#0a0a0c]"
                          : "bg-white/5 text-[#f1f1f3] border border-white/10"
                        }
                      `}
                    >
                      <span className="text-[9px] text-[#f1f1f3]/60 font-semibold uppercase mr-1">Last:</span>
                      <span className="font-bold">{lastVibe.label}</span>
                    </button>
                  )}

                  {/* Vibe Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pt-0.5 px-1">
                      {VIBES.map((vibe) => (
                        <div key={vibe.id} className="flex-shrink-0">
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
                </div>

                {/* Topic Module - Compact */}
                <div className="bg-white/5 rounded-lg p-2 border border-white/10 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[#f1f1f3]/80" />
                      <h2 className="text-sm font-bold text-[#f1f1f3]">Your Topic</h2>
                    </div>
                    {selectedTopic && (
                      <div className="w-1 h-1 rounded-full bg-[#f1f1f3]" />
                    )}
                  </div>

                  {/* Most Popular Topic - Compact */}
                  <button
                    onClick={handleSelectMostPopular}
                    className={`
                      w-full px-2 py-1 rounded-lg text-left transition-all mb-1.5 text-xs flex-shrink-0
                      ${selectedTopic?.id === MOST_POPULAR_TOPIC.id
                        ? "bg-[#f1f1f3] text-[#0a0a0c]"
                        : "bg-white/5 text-[#f1f1f3] border border-white/10"
                      }
                    `}
                  >
                    <span className="text-[9px] text-[#f1f1f3]/60 font-semibold uppercase mr-1">Popular:</span>
                    <span className="font-bold line-clamp-1">{MOST_POPULAR_TOPIC.label}</span>
                  </button>

                  {/* Category Dropdown - Compact */}
                  <div className="relative flex-shrink-0 mb-1.5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setSelectedTopic(null)
                      }}
                      className="w-full appearance-none px-2 py-1.5 pr-6 rounded-lg bg-white/5 border border-white/10 text-[#f1f1f3]/90 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-white/20 transition-all cursor-pointer"
                    >
                      {TOPIC_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0a0a0c]">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#f1f1f3]/60 pointer-events-none" />
                  </div>

                  {/* Topic Pills - Horizontal Scrollable */}
                  <div className="relative -mx-1 flex-1 min-h-0">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pt-0.5 px-1 h-full">
                      {currentTopics.map((topic) => (
                        <div key={topic.id} className="flex-shrink-0">
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
                </div>
              </div>

              {/* Action Button - Compact */}
              <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/10 flex-shrink-0 pb-2">
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleConnect}
                      disabled={saving}
                      className="w-full h-9 text-sm font-semibold rounded-lg bg-[#f1f1f3] text-[#0a0a0c] hover:bg-[#f1f1f3]/95 disabled:opacity-50"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleSkipAndChat}
                      className="w-full h-9 text-sm font-semibold rounded-lg bg-white/5 text-[#f1f1f3] border-white/10 hover:bg-white/10"
                    >
                      Skip and Chat
                    </Button>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
