"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { VibeChip } from "@/components/ui/vibe-chip"
import { TopicChip } from "@/components/ui/topic-chip"
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

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
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
  // Connect shows when vibe OR topic OR both are selected
  const canConnect = selectedVibe || selectedTopic

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

  // Show loading while checking auth
  if (loading || !user || (user && !user.email_confirmed_at)) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#0A0A0A] to-[#101112] flex items-center justify-center">
        <p className="text-[#f1f1f3]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0A0A0A] to-[#101112] overflow-hidden w-full h-full m-0 p-0 grain-texture">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content px-6 py-8 pb-0 overflow-hidden flex flex-col h-full relative z-10">
              {/* Header */}
              <div className="flex-shrink-0 mb-8">
                <h1 className="text-[32px] font-bold text-[#f1f1f3] mb-2 leading-tight">
                  Select Your Vibe
                </h1>
                <p className="text-base font-thin text-[#f1f1f3]/60">
                  Choose your mood and topic to connect
                </p>
              </div>

              {/* Vibe Section */}
              <div className="flex-shrink-0 mb-8">
                <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-6 px-6 pb-2" style={{ height: '56px', alignItems: 'center', overflowY: 'hidden' }}>
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

              {/* Topic Section */}
              <div className="flex-shrink-0 mb-8">
                <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-6 px-6 pb-2" style={{ height: '56px', alignItems: 'center', overflowY: 'hidden' }}>
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

              {/* Segmented Control - Time Selection */}
              <div className="flex-shrink-0 mb-8">
                <div className="flex items-center gap-2 p-1 rounded-[16px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[12px]" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
                  {TIME_LIMITS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-[12px] text-base font-medium transition-all duration-300",
                        selectedTimeLimit === time 
                          ? "bg-white text-[#0A0A0A]"
                          : "bg-transparent text-[#f1f1f3]/60 hover:text-[#f1f1f3]"
                      )}
                    >
                      {time}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Buttons - Pinned to bottom */}
              <div className="flex-shrink-0 mt-auto pt-4 pb-2 flex flex-col gap-2">
                <AnimatePresence mode="wait">
                  {canConnect ? (
                    <motion.button
                      key="connect"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileTap={{ 
                        scale: 0.98,
                        backgroundColor: '#FFFFFF',
                        color: '#0A0A0A'
                      }}
                      onClick={handleConnect}
                      disabled={saving}
                      className={cn(
                        "w-full py-4 rounded-[16px] text-lg font-bold transition-all duration-300",
                        "bg-[#0A0A0A] text-white border border-[rgba(255,255,255,0.08)]",
                        "hover:bg-white hover:text-[#0A0A0A]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "relative overflow-hidden"
                      )}
                      style={{
                        boxShadow: '0 0 0 1px rgba(110,193,255,0.4), 0 8px 20px rgba(0,0,0,0.25)'
                      }}
                    >
                      {saving ? "Connecting..." : "CONNECT"}
                    </motion.button>
                  ) : (
                    <motion.button
                      key="skip"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileTap={{ 
                        scale: 0.98,
                        backgroundColor: 'rgba(255,255,255,0.04)'
                      }}
                      onClick={handleSkipAndChat}
                      className={cn(
                        "w-full py-4 rounded-[16px] text-lg font-bold transition-all duration-300",
                        "bg-transparent text-[#f1f1f3] border border-[rgba(255,255,255,0.08)]",
                        "hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)]"
                      )}
                      style={{
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
                      }}
                    >
                      SKIP
                    </motion.button>
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
