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
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

// Reordered: General, Pop Culture, News
const TOPIC_CATEGORIES = [
  { id: "general", label: "General", topics: GENERAL_TOPICS },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS },
  { id: "news", label: "News", topics: NEWS_TOPICS },
] as const

const TIME_LIMITS = [5, 15, 30]

// Fallback vibe if none found in database
const FALLBACK_VIBE: Vibe = { id: 'curious', label: 'Curious', icon: '🔍', color: 'gray', description: 'Eager to learn and explore' }

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null)
  const [customTopic, setCustomTopic] = useState<string>("")
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
  // Connect shows when time AND vibe AND topic are selected
  const canConnect = selectedTimeLimit && selectedVibe && (selectedTopic || customTopic.trim().length > 0)

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
              color: 'gray',
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
      if (customTopic.trim()) {
        localStorage.setItem("customTopic", customTopic.trim())
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
            <div className="phone-content px-5 py-6 pb-0 overflow-hidden flex flex-col h-full">
              {/* Top Section: Header + Time */}
              <div className="flex-shrink-0 mb-5">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-[#f1f1f3] mb-1">
                    Select how you want to connect
                  </h1>
                  <p className="text-xs text-[#f1f1f3]/60">
                    Choose your time, vibe, and topic
                  </p>
                </div>

                {/* Time Selection - Centered, Symmetrical */}
                <div className="flex items-center justify-center gap-2">
                  {TIME_LIMITS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                      className={cn(
                        "flex-1 max-w-[80px] px-4 py-2.5 rounded-lg text-xs font-medium transition-all border",
                        selectedTimeLimit === time 
                          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20" 
                          : "bg-white/5 text-[#f1f1f3]/70 border-white/10 hover:bg-white/8 hover:border-white/15"
                      )}
                    >
                      {time}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle Section: 3 Boxes - Uneven Distribution */}
              <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
                {/* Box 1: Vibe Section - Smaller (one row) */}
                <div className="flex-[0.8] rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col min-h-0">
                  <h2 className="text-sm font-medium text-[#f1f1f3] mb-3 flex-shrink-0">Your Vibe</h2>
                  
                  {/* Last Vibe Button - Compact */}
                  {lastVibe && !loadingLastVibe && (
                    <button
                      onClick={handleSelectLastVibe}
                      className={cn(
                        "w-full px-3 py-1.5 rounded-lg text-left transition-all mb-2 text-xs font-medium border flex-shrink-0",
                        selectedVibe?.id === lastVibe.id
                          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20"
                          : "bg-white/5 text-[#f1f1f3]/70 border-white/10 hover:bg-white/8 hover:border-white/15"
                      )}
                    >
                      <span className="text-[10px] text-[#f1f1f3]/50 font-medium uppercase mr-1.5">Last:</span>
                      <span>{lastVibe.label}</span>
                    </button>
                  )}

                  {/* Horizontal Scroll Row for Vibes */}
                  <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-4 px-4 flex-1 min-h-0 items-center">
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

                {/* Box 2: Topic Section - Larger (two rows: categories + topics) */}
                <div className="flex-[1.4] rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col min-h-0">
                  <h2 className="text-sm font-medium text-[#f1f1f3] mb-3 flex-shrink-0">Your Topic</h2>

                  {/* Category Buttons - Horizontal Row: General, Pop Culture, News */}
                  <div className="flex overflow-x-auto space-x-2 mb-3 scrollbar-hide -mx-4 px-4 flex-shrink-0">
                    {TOPIC_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setSelectedTopic(null)
                        }}
                        className={cn(
                          "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          selectedCategory === cat.id
                            ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20"
                            : "bg-white/5 text-[#f1f1f3]/70 border-white/10 hover:bg-white/8 hover:border-white/15"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Horizontal Scroll Row for Topics */}
                  <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-4 px-4 flex-1 min-h-0 items-center">
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

                {/* Box 3: Make Your Own - Smaller */}
                <div className="flex-[0.8] rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col min-h-0 justify-center">
                  <h2 className="text-sm font-medium text-[#f1f1f3] mb-2 flex-shrink-0">Make your own topic</h2>
                  <p className="text-xs text-[#f1f1f3]/60 mb-3 flex-shrink-0">Create a custom topic to discuss</p>
                  <input 
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[#f1f1f3] placeholder:text-[#f1f1f3]/40 focus:outline-none focus:border-white/20 transition-all text-sm flex-shrink-0"
                    placeholder="Enter your topic..."
                  />
                </div>
              </div>

              {/* Bottom Section: Connect Button */}
              <div className="flex-shrink-0 pt-4 border-t border-white/5 pb-2">
                <AnimatePresence mode="wait">
                  {canConnect ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleConnect}
                      disabled={saving}
                      className="w-full rounded-xl h-12 text-sm font-semibold"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSkipAndChat}
                      className="w-full rounded-xl h-12 text-sm font-semibold"
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
