"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { EmojiRating } from "@/components/ui/emoji-rating"
import { ReportModal } from "@/components/ui/report-modal"
import { BottomNav } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"
import { MessageSquare, Users, Flag, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface FeedbackRatings {
  conversationQuality: number | null
  matchQuality: number | null
  overallExperience: number | null
}

const RATING_EMOJIS = [
  { emoji: "😞", value: 1, label: "Poor" },
  { emoji: "😐", value: 2, label: "Okay" },
  { emoji: "🙂", value: 3, label: "Good" },
  { emoji: "😊", value: 4, label: "Great" },
  { emoji: "🤩", value: 5, label: "Excellent" },
]

export default function FeedbackPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [ratings, setRatings] = useState<FeedbackRatings>({
    conversationQuality: null,
    matchQuality: null,
    overallExperience: null,
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [addedToCommunity, setAddedToCommunity] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  
  // Get user ID from Supabase Auth
  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const savedName = localStorage.getItem("feedbackProfileName")
    if (savedName) {
      setProfileName(savedName)
    }
    
    const chatId = localStorage.getItem("feedbackChatId")
    if (chatId) {
      // Get match ID from localStorage or create one
      let matchIdValue = localStorage.getItem(`match_${chatId}`)
      if (!matchIdValue) {
        matchIdValue = `match_${chatId}_${Date.now()}`
        localStorage.setItem(`match_${chatId}`, matchIdValue)
      }
      setMatchId(matchIdValue)
    }
    
    const communityMembers = JSON.parse(
      localStorage.getItem("communityMembers") || "[]"
    )
    
    const isInCommunity = communityMembers.some(
      (member: { id: string; name: string }) =>
        member.id === chatId || member.name === savedName
    )
    
    if (isInCommunity) {
      setAddedToCommunity(true)
    }
  }, [])

  const hasAnyRating = 
    ratings.conversationQuality !== null ||
    ratings.matchQuality !== null ||
    ratings.overallExperience !== null

  const handleSubmit = async () => {
    if (!matchId) return
    
    const userId = getUserId()
    if (!userId) {
      router.push("/")
      return
    }
    
    setLoading(true)
    
    try {
      // Get overall rating emoji
      const overallRating = ratings.overallExperience
      const emojiMap: { [key: number]: string } = {
        1: "😞",
        2: "😐",
        3: "🙂",
        4: "😊",
        5: "🤩"
      }
      const emoji = overallRating ? emojiMap[overallRating] : null
      
      // Combine all notes
      const ratingNotes = [
        ratings.conversationQuality && `Conversation: ${ratings.conversationQuality}/5`,
        ratings.matchQuality && `Match: ${ratings.matchQuality}/5`,
        ratings.overallExperience && `Overall: ${ratings.overallExperience}/5`
      ].filter(Boolean).join(", ")
      
      // Combine rating notes with user's text notes
      const allNotes = notes.trim() 
        ? `${ratingNotes}${ratingNotes ? ' | ' : ''}${notes.trim()}`
        : ratingNotes || null
      
      // Save feedback to database
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId,
          emoji,
          notes: allNotes,
        })
      })
      
      setLoading(false)
      setSubmitted(true)
      localStorage.removeItem("feedbackChatId")
      localStorage.removeItem("feedbackProfileName")
      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setLoading(false)
      // Still show success and navigate
      setSubmitted(true)
      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    }
  }

  const handleRatingChange = (
    category: keyof FeedbackRatings,
    value: number
  ) => {
    setRatings((prev) => ({ ...prev, [category]: value }))
  }

  const handleReport = (reason: string) => {
    console.log(`Reporting ${profileName}: ${reason}`)
    setShowReportModal(false)
  }

  const handleAddToCommunity = () => {
    if (!profileName) return
    
    setAddedToCommunity(true)
    const chatId = localStorage.getItem("feedbackChatId")
    const existingCommunity = JSON.parse(
      localStorage.getItem("communityMembers") || "[]"
    )
    
    const memberExists = existingCommunity.some(
      (member: { id: string; name: string }) => 
        member.id === chatId || member.name === profileName
    )
    
    if (!memberExists && chatId) {
      const newMember = {
        id: chatId,
        name: profileName,
        addedAt: new Date().toISOString(),
      }
      existingCommunity.push(newMember)
      localStorage.setItem("communityMembers", JSON.stringify(existingCommunity))
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content px-4 py-2 sm:p-4 pb-4 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between px-3 py-2",
                "border-b border-white/10 bg-[#0A0A0A]",
                "sticky top-0 z-10 flex-shrink-0"
              )}>
                <button
                  onClick={() => router.push("/chat")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold",
                    "border border-white/10 bg-white/5",
                    "text-white hover:bg-white/10",
                    "transition-all duration-200",
                    "touch-manipulation cursor-pointer"
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                  Next Chat
                </button>
                
                <h1 className="text-base font-bold text-white tracking-tight">
                  Feedback
                </h1>
                
                <div className="w-16" /> {/* Spacer */}
              </div>

              {/* Content - No Scroll, Compact */}
              <div className="flex-1 overflow-hidden flex flex-col p-3 min-h-0">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="mb-4"
                      >
                        <div className="h-16 w-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-white" />
                        </div>
                      </motion.div>
                      <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Thank You!
                      </h2>
                      <p className="text-xs text-[#E5E5E5]/60">
                        Your feedback helps us improve
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col h-full"
                    >
                      {/* Sub-header - Compact */}
                      <div className="text-center mb-2 flex-shrink-0">
                        <h2 className="text-lg font-bold text-white tracking-tight mb-0.5">
                          How was it?
                        </h2>
                        <p className="text-[9px] text-[#E5E5E5]/60">
                          {profileName
                            ? `Rate your conversation with ${profileName}`
                            : "Rate your conversation"}
                        </p>
                      </div>

                      {/* Rating Sections - Compact Grid */}
                      <div className="flex-1 grid grid-cols-1 gap-2 mb-2 overflow-y-auto scrollbar-hide min-h-0">
                        <EmojiRating
                          label="Conversation"
                          emojis={RATING_EMOJIS}
                          selectedValue={ratings.conversationQuality}
                          onSelect={(value) =>
                            handleRatingChange("conversationQuality", value)
                          }
                        />

                        <EmojiRating
                          label="Match Quality"
                          emojis={RATING_EMOJIS}
                          selectedValue={ratings.matchQuality}
                          onSelect={(value) =>
                            handleRatingChange("matchQuality", value)
                          }
                        />

                        <EmojiRating
                          label="Overall"
                          emojis={RATING_EMOJIS}
                          selectedValue={ratings.overallExperience}
                          onSelect={(value) =>
                            handleRatingChange("overallExperience", value)
                          }
                        />
                      </div>

                      {/* Notes Section */}
                      <div className="mb-2 flex-shrink-0">
                        <label className="text-[10px] font-bold text-[#E5E5E5]/90 mb-1 block text-center">
                          Notes about {profileName || "Alex"}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={`Share your thoughts about ${profileName || "Alex"}...`}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg",
                            "bg-white/5 border-2 border-white/20",
                            "text-white placeholder:text-[#E5E5E5]/50",
                            "text-xs resize-none",
                            "focus:outline-none focus:border-white/40",
                            "focus:ring-2 focus:ring-white/20"
                          )}
                          rows={2}
                        />
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="space-y-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddToCommunity()
                          }}
                          type="button"
                          disabled={addedToCommunity}
                          className={cn(
                            "w-full px-3 py-2 rounded-full font-semibold text-[10px]",
                            "flex items-center justify-center gap-1.5",
                            "transition-all duration-200",
                            "touch-manipulation relative z-10",
                            addedToCommunity
                              ? "bg-white/5 border border-white/10 text-[#E5E5E5]/40 cursor-not-allowed"
                              : "bg-[#E5E5E5] text-[#0A0A0A] border border-white hover:bg-white/95 cursor-pointer pointer-events-auto"
                          )}
                        >
                          <Users className="h-3 w-3" />
                          {addedToCommunity
                            ? `Added ${profileName || "them"} to Community`
                            : `Add ${profileName || "them"} to Community`}
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowReportModal(true)
                          }}
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 rounded-full font-semibold text-[10px]",
                            "flex items-center justify-center gap-1.5",
                            "border border-white/10 bg-white/5",
                            "text-white hover:bg-white/8 hover:border-white/15",
                            "transition-all duration-200",
                            "touch-manipulation cursor-pointer pointer-events-auto relative z-10"
                          )}
                        >
                          <Flag className="h-3 w-3" />
                          Report {profileName || "this person"}
                        </button>

                        {/* Submit Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSubmit()
                          }}
                          type="button"
                          disabled={loading}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-full font-bold text-xs tracking-wide",
                            "transition-all duration-200",
                            "touch-manipulation relative z-10",
                            "bg-[#E5E5E5] text-[#0A0A0A] border border-white",
                            "hover:bg-white/95",
                            "cursor-pointer pointer-events-auto",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {loading ? "Submitting..." : hasAnyRating ? "Submit Feedback" : "Skip Feedback"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {profileName && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onConfirm={handleReport}
          profileName={profileName}
        />
      )}
    </div>
  )
}
