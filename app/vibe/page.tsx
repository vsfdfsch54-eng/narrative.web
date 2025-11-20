"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { VibeChip } from "@/components/ui/vibe-chip"
import { TopicChip } from "@/components/ui/topic-chip"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { VIBES, NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS } from "@/lib/constants"
import { Vibe, Topic } from "@/lib/types"
import { Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

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
            <div className="phone-content px-4 py-6 pb-0 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-6 flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f1f1f3] leading-tight mb-3">
                  Let&apos;s get started
                </h1>
                
                {/* Time Limit Selector */}
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-[#f1f1f3]/50" />
                  <div className="flex items-center gap-2">
                    {TIME_LIMITS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTimeLimit(time)}
                        className={cn(
                          "px-3 py-1.5 rounded-[14px] text-xs font-bold transition-all min-h-[36px] min-w-[36px] border",
                          selectedTimeLimit === time 
                            ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]" 
                            : "bg-white/5 text-[#f1f1f3]/80 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Your Vibe Section */}
                <div className="flex-shrink-0 mb-8">
                  <h2 className="text-lg font-bold text-[#f1f1f3] mb-6">
                    Your Vibe
                  </h2>
                  
                  {/* Last Vibe Option */}
                  {lastVibe && !loadingLastVibe && (
                    <button
                      onClick={handleSelectLastVibe}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-[16px] text-left transition-all mb-3 text-sm font-bold border",
                        selectedVibe?.id === lastVibe.id
                          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]"
                          : "bg-[#1A1A1A] text-[#f1f1f3] border-[#1A1A1A]"
                      )}
                    >
                      <span className="text-[10px] text-[#f1f1f3]/60 font-semibold uppercase mr-2">Last:</span>
                      <span>{lastVibe.label}</span>
                    </button>
                  )}

                  {/* Horizontal Scroll Row for Vibes */}
                  <div className="flex overflow-x-auto space-x-3 scrollbar-hide -mx-4 px-4">
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

                {/* Your Topic Section */}
                <div className="flex-shrink-0">
                  <h2 className="text-lg font-bold text-[#f1f1f3] mb-6">
                    Your Topic
                  </h2>

                  {/* Most Popular Topic */}
                  <button
                    onClick={handleSelectMostPopular}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-[16px] text-left transition-all mb-3 text-sm font-bold border",
                      selectedTopic?.id === MOST_POPULAR_TOPIC.id
                        ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]"
                        : "bg-[#1A1A1A] text-[#f1f1f3] border-[#1A1A1A]"
                    )}
                  >
                    <span className="text-[10px] text-[#f1f1f3]/60 font-semibold uppercase mr-2">Popular:</span>
                    <span className="line-clamp-1">{MOST_POPULAR_TOPIC.label}</span>
                  </button>

                  {/* Category Buttons - Horizontal Scroll */}
                  <div className="flex overflow-x-auto space-x-2 mb-3 scrollbar-hide -mx-4 px-4">
                    {TOPIC_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setSelectedTopic(null)
                        }}
                        className={cn(
                          "shrink-0 px-4 py-2.5 rounded-[16px] text-xs font-bold transition-all border",
                          selectedCategory === cat.id
                            ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]"
                            : "bg-[#1A1A1A] text-[#f1f1f3] border-[#1A1A1A]"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Horizontal Scroll Row for Topics */}
                  <div className="flex overflow-x-auto space-x-3 scrollbar-hide -mx-4 px-4">
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

              {/* Bottom Action Button */}
              <div className="flex items-center justify-center mt-10 flex-shrink-0 pb-4 safe-area-inset-bottom">
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleConnect}
                      disabled={saving}
                      className="w-full rounded-full h-14 text-base font-bold"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSkipAndChat}
                      className="w-full rounded-full h-14 text-base font-bold"
                    >
                      Skip & Chat
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
