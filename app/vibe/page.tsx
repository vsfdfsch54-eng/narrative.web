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

// Topic Categories with 2025 subtopics and icons
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
  
  // Close dropdown when clicking outside
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
      <div className="fixed inset-0 bg-[#111111] flex items-center justify-center">
        <p className="text-[#F5F5F5]/60">Loading...</p>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-[#111111] overflow-hidden w-full h-full m-0 p-0"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div 
              className="phone-content overflow-y-auto flex flex-col h-full relative z-10" 
              style={{ 
                paddingTop: '24px',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
                maxWidth: '100%',
                margin: '0 auto'
              }}
            >
              {/* Top Menu - Three dots in top left */}
              <div className="flex-shrink-0 mb-6 flex items-start justify-between px-5">
                <TopMenu />
                {/* Logo - small, centered */}
                <div className="flex-1 flex justify-center">
                  <span className="text-[13px] font-light tracking-tight text-[#FFFFFF]/40">
                    Narrative
                  </span>
                </div>
                {/* Spacer to balance the menu */}
                <div className="w-10" />
              </div>

              {/* Main Title - 26-28px semibold, centered, tighter spacing */}
              <div className="flex-shrink-0 mb-6 text-center px-5">
                <h1 className="text-[28px] font-semibold text-[#FFFFFF] leading-tight">
                  Select Your Vibe
                </h1>
              </div>

              {/* Vibe Section - tighter spacing, 12px gap between chips */}
              <div className="flex-shrink-0 mb-6 px-5">
                <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
                  alignItems: 'center', 
                  overflowY: 'hidden',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  marginTop: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="flex" style={{ gap: '12px' }}>
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

              {/* Topic Section - 20px semibold header, tighter spacing */}
              <div className="flex-shrink-0 mb-6 px-5">
                <h2 className="text-[20px] font-semibold text-[#FFFFFF] mb-3 text-center">Choose a Topic</h2>
                
                {/* Topic Category Dropdown - 44px height, 12px radius, sharp */}
                <div className="relative mb-3" ref={dropdownRef}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    transition={{ duration: 0.12, ease: "easeInOut" }}
                    className={cn(
                      "w-full h-[44px] rounded-[12px]",
                      "bg-white text-black",
                      "border-[1.25px] border-[rgba(255,255,255,0.16)]",
                      "flex items-center justify-between px-3",
                      "font-medium text-[16px]",
                      "transition-all duration-150 ease-in-out"
                    )}
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
                        "w-4 h-4 transition-transform duration-130 ease-in-out",
                        isCategoryDropdownOpen && "rotate-180"
                      )}
                    />
                  </motion.button>
                  
                  {/* Dropdown Menu - sharp, no shadows */}
                  {isCategoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.13, ease: "easeInOut" }}
                      className="absolute top-full left-0 right-0 mt-2 z-50"
                    >
                      <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[12px] overflow-hidden">
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
                                "w-full px-3 py-2.5 text-left flex items-center gap-2",
                                "text-[#FFFFFF] text-[16px] font-medium",
                                "transition-all duration-120 ease-in-out",
                                "hover:bg-[rgba(255,255,255,0.05)]",
                                selectedCategory === category.id && "bg-[rgba(255,255,255,0.1)]"
                              )}
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
                
                {/* Topic Chips - 12px gap, tighter spacing */}
                <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ 
                  alignItems: 'center', 
                  overflowY: 'hidden',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  marginTop: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="flex" style={{ gap: '12px' }}>
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

              {/* Duration Segmented Control - 10px radius, 40px height, sharp */}
              <div className="flex-shrink-0 mb-6 px-5 flex justify-center">
                <div 
                  className="flex items-center gap-1 p-1 rounded-[10px] bg-[rgba(255,255,255,0.08)] relative overflow-hidden"
                  style={{ height: '40px', width: 'fit-content' }}
                >
                  {TIME_LIMITS.map((time) => (
                    <motion.button
                      key={time}
                      onClick={() => setSelectedTimeLimit(selectedTimeLimit === time ? null : time)}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12, ease: "easeInOut" }}
                      className={cn(
                        "h-full rounded-[10px] text-[15px] font-medium transition-all duration-150 ease-in-out relative z-10",
                        "px-4",
                        selectedTimeLimit === time 
                          ? "bg-white text-black"
                          : "bg-transparent text-[#FFFFFF]/80"
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
            
            {/* Gradient behind bottom nav */}
            <div 
              className="fixed left-0 right-0 pointer-events-none"
              style={{
                bottom: 0,
                height: '76px',
                background: 'linear-gradient(to top, #111111FF, #11111100)',
                zIndex: 40
              }}
            />
            
            {/* Bottom Fixed Footer - Sharp Buttons */}
            <div 
              className="fixed left-0 right-0 flex flex-row"
              style={{
                bottom: `calc(env(safe-area-inset-bottom) + 76px)`,
                padding: '0 24px',
                gap: '12px',
                zIndex: 50,
                width: '100%'
              }}
            >
              {/* CONNECT Button - Sharp, 14-16px radius */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                whileTap={{ 
                  scale: 0.98,
                  transition: { duration: 0.12, ease: "easeInOut" }
                }}
                onClick={handleConnect}
                disabled={saving || !canConnect}
                className={cn(
                  "flex-1 h-[44px] rounded-[14px] text-[16px] font-semibold transition-all duration-150 ease-in-out",
                  "px-3",
                  canConnect
                    ? "bg-white text-black"
                    : "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)]",
                  "disabled:cursor-not-allowed"
                )}
                style={{
                  boxShadow: canConnect 
                    ? '0 2px 6px rgba(0,0,0,0.18)' 
                    : 'none'
                }}
              >
                {saving ? "Connecting..." : "CONNECT"}
              </motion.button>
              
              {/* SKIP Button - Sharp, no shadow */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                whileTap={{ 
                  scale: 0.98,
                  transition: { duration: 0.12, ease: "easeInOut" }
                }}
                onClick={handleSkip}
                className={cn(
                  "flex-1 h-[44px] rounded-[14px] text-[16px] font-semibold transition-all duration-150 ease-in-out",
                  "px-3",
                  "bg-transparent text-[#FFFFFF]"
                )}
                style={{
                  border: '1.25px solid rgba(255,255,255,0.35)'
                }}
              >
                SKIP
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
