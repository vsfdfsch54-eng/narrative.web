"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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

  const handleSkip = () => {
    // Route to /chat which handles matching
    router.push("/chat")
  }

  // Show loading while checking auth
  if (loading || !user || (user && !user.email_confirmed_at)) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] overflow-hidden w-full h-full m-0 p-0">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content px-6 py-6 pb-0 overflow-hidden flex flex-col h-full relative z-10">
              {/* Logo */}
              <div className="flex-shrink-0 mb-6 flex justify-center">
                <span className="text-lg font-light tracking-tight text-white">
                  Narrative
                </span>
              </div>

              {/* Title */}
              <div className="flex-shrink-0 mb-8 text-center">
                <h1 className="text-[32px] font-bold text-white mb-2 leading-tight">
                  Select Your Vibe
                </h1>
              </div>

              {/* Vibe Section */}
              <div className="flex-shrink-0 mb-8">
                <h2 className="text-[28px] font-bold text-white mb-3 text-center">Select Your Vibe</h2>
                <p className="text-[14px] text-white/55 max-w-[90%] mx-auto mb-4 text-center">
                  Vibes describe your current mood or energy and help match you with someone who feels the same way.
                </p>
                <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-6 px-6" style={{ alignItems: 'center', overflowY: 'hidden' }}>
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
                <h2 className="text-[28px] font-bold text-white mb-3 text-center">Choose a Topic</h2>
                <p className="text-[14px] text-white/55 max-w-[90%] mx-auto mb-4 text-center">
                  Topics are what you want to talk about. They guide the conversation so you connect with the right person.
                </p>
                <div className="flex overflow-x-auto space-x-2 scrollbar-hide -mx-6 px-6" style={{ alignItems: 'center', overflowY: 'hidden' }}>
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

              {/* Duration Segmented Control */}
              <div className="flex-shrink-0 mb-6">
                <div 
                  className="flex items-center gap-1 p-1 rounded-[12px] bg-[rgba(255,255,255,0.05)] relative overflow-hidden"
                >
                  {TIME_LIMITS.map((time) => (
                    <motion.button
                      key={time}
                      onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-[12px] text-base font-medium transition-all duration-300 relative z-10",
                        selectedTimeLimit === time 
                          ? "bg-white text-black font-semibold"
                          : "bg-transparent text-white"
                      )}
                    >
                      {time}m
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Spacer to push buttons down */}
              <div className="flex-1" />
            </div>
            
            {/* Bottom Fixed Footer - Pill Buttons Above Nav Bar */}
            <div 
              className="fixed left-0 right-0 bg-[#1A1A1A] flex flex-row"
              style={{
                bottom: `calc(80px + env(safe-area-inset-bottom))`, // Above nav bar + safe area
                padding: '12px 24px',
                paddingBottom: `max(12px, calc(12px + env(safe-area-inset-bottom)))`,
                gap: '12px',
                zIndex: 50
              }}
            >
              {/* CONNECT Button - Pill Shape */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                whileTap={{ 
                  scale: 0.96,
                  transition: { duration: 0.15 }
                }}
                onClick={handleConnect}
                disabled={saving || !canConnect}
                className={cn(
                  "flex-1 h-[44px] rounded-[28px] text-base font-medium transition-all duration-300",
                  canConnect
                    ? "bg-[rgba(255,255,255,0.9)] text-black"
                    : "bg-[rgba(255,255,255,0.08)] text-white/30",
                  "disabled:cursor-not-allowed",
                  "backdrop-blur-sm"
                )}
                style={{
                  border: canConnect 
                    ? '1px solid rgba(255,255,255,0.2)' 
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: canConnect 
                    ? '0 2px 8px rgba(0,0,0,0.15)' 
                    : 'none'
                }}
              >
                {saving ? "Connecting..." : "CONNECT"}
              </motion.button>
              
              {/* SKIP Button - Pill Shape */}
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                whileTap={{ 
                  scale: 0.96,
                  transition: { duration: 0.15 }
                }}
                onClick={handleSkip}
                className={cn(
                  "flex-1 h-[44px] rounded-[28px] text-base font-medium transition-all duration-300",
                  "bg-[rgba(255,255,255,0.05)] text-white/70 backdrop-blur-sm"
                )}
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}
              >
                SKIP
              </motion.button>
            </div>
            
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
