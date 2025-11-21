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
import { ChevronDown } from "lucide-react"

// Reordered: General, Pop Culture, News
const TOPIC_CATEGORIES = [
  { id: "general", label: "General", topics: GENERAL_TOPICS },
  { id: "pop-culture", label: "Pop Culture", topics: POP_CULTURE_TOPICS },
  { id: "news", label: "News", topics: NEWS_TOPICS },
] as const

const TIME_LIMITS = [5, 15, 30]

// Fallback vibe if none found in database
const FALLBACK_VIBE: Vibe = { id: 'curious', label: 'Curious', icon: '🔍', color: 'gray', description: 'Eager to learn and explore' }

// Most popular vibe (first one or predefined)
const MOST_POPULAR_VIBE = VIBES[0] || FALLBACK_VIBE

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
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
  // Most popular topic (first one from current category)
  const mostPopularTopic = currentTopics[0] || null
  // Connect shows when vibe OR topic OR both are selected
  const canConnect = selectedVibe || selectedTopic

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
      // Save vibe and topic to localStorage
      if (selectedVibe) {
        localStorage.setItem("selectedVibe", selectedVibe.id)
      }
      if (selectedTopic) {
        localStorage.setItem("selectedTopic", selectedTopic.id)
      }
      
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
      
      // Route to /chat which handles matching
      router.push("/chat")
    } catch (error) {
      console.error('Error connecting:', error)
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  const handleSkipAndChat = () => {
    // Route to /chat which handles matching
    router.push("/chat")
  }

  const handleSelectLastVibe = () => {
    if (lastVibe) {
      setSelectedVibe(lastVibe)
    } else {
      setSelectedVibe(FALLBACK_VIBE)
    }
  }

  const handleSelectMostPopularVibe = () => {
    setSelectedVibe(MOST_POPULAR_VIBE)
  }

  const handleSelectMostPopularTopic = () => {
    if (mostPopularTopic) {
      setSelectedTopic(mostPopularTopic)
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
            <div className="phone-content px-5 py-12 pb-0 overflow-hidden flex flex-col h-full">
              {/* Top Section: Time Frame Box */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-light text-[#f1f1f3] text-center mb-4">
                  Select how you want to connect
                </h1>
                
                {/* Time Selection - Centered */}
                <div className="flex items-center justify-center gap-2">
                  {TIME_LIMITS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                      className={cn(
                        "flex-1 max-w-[80px] px-4 py-2.5 rounded-lg text-xs font-medium transition-all border",
                        selectedTimeLimit === time 
                          ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20" 
                          : "bg-[#0a0a0c] text-[#f1f1f3] border-white/10 hover:border-white/20"
                      )}
                    >
                      {time}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content - Two Boxes */}
              <div className="flex flex-col flex-1 min-h-0 gap-6 mb-6">
                {/* Vibe Box */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-shrink-0">
                  {/* Header with Last Vibe Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-medium text-[#f1f1f3]">Vibe</h2>
                    {lastVibe && !loadingLastVibe && (
                      <button
                        onClick={handleSelectLastVibe}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5",
                          selectedVibe?.id === lastVibe.id
                            ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20"
                            : "bg-[#0a0a0c] text-[#f1f1f3] border-white/10 hover:border-white/20"
                        )}
                      >
                        <span>Last vibe</span>
                        <span className="text-[10px] text-[#f1f1f3]/50">•</span>
                        <span className="text-[10px] text-[#f1f1f3]/50">Last time</span>
                      </button>
                    )}
                  </div>

                  {/* Most Popular Vibe Pill */}
                  <button
                    onClick={handleSelectMostPopularVibe}
                    className={cn(
                      "w-full px-4 py-2 rounded-full text-sm font-medium transition-all border mb-3",
                      selectedVibe?.id === MOST_POPULAR_VIBE.id
                        ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20"
                        : "bg-[#0a0a0c] text-[#f1f1f3] border-white/10 hover:border-white/20"
                    )}
                  >
                    Most Popular Vibe
                  </button>

                  {/* Locked Horizontal Scroll Row for Vibes */}
                  <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-4 px-4" style={{ height: '56px', alignItems: 'center', overflowY: 'hidden' }}>
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

                {/* Topic Box */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-shrink-0">
                  {/* Header with Most Popular Topic Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-medium text-[#f1f1f3]">Topic</h2>
                    {mostPopularTopic && (
                      <button
                        onClick={handleSelectMostPopularTopic}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5",
                          selectedTopic?.id === mostPopularTopic.id
                            ? "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3]/20"
                            : "bg-[#0a0a0c] text-[#f1f1f3] border-white/10 hover:border-white/20"
                        )}
                      >
                        Most Popular Topic Today
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu for Categories */}
                  <div className="relative mb-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setSelectedTopic(null)
                      }}
                      className="w-full appearance-none px-4 py-2.5 rounded-lg bg-[#0a0a0c] border border-white/10 text-[#f1f1f3] text-sm font-medium focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                    >
                      {TOPIC_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0a0a0c]">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f1f1f3]/60 pointer-events-none" />
                  </div>

                  {/* Locked Horizontal Scroll Row for Topics */}
                  <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-4 px-4" style={{ height: '56px', alignItems: 'center', overflowY: 'hidden' }}>
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

              {/* Bottom Section: Connect/Skip & Chat Buttons */}
              <div className="flex-shrink-0 pt-6 pb-2 flex flex-col items-center gap-3">
                <AnimatePresence mode="wait">
                  {canConnect ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleConnect}
                      disabled={saving}
                      className="w-full max-w-md rounded-xl h-14 text-base font-semibold"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSkipAndChat}
                      className="w-full max-w-md rounded-xl h-14 text-base font-semibold"
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
