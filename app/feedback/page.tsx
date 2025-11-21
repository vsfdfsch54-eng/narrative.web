"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { EmojiRating } from "@/components/ui/emoji-rating"
import { ReportModal } from "@/components/ui/report-modal"
import { cn } from "@/lib/utils"
import { MessageSquare, Users, Flag, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { tokens } from "@/lib/design-tokens"
import { AppShell } from "@/components/AppShell"

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
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: tokens.spacing[20],
        paddingBottom: tokens.spacing[20],
        minHeight: 'calc(100vh - 140px)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing[28],
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/chat")}
            style={{
              padding: `8px ${tokens.spacing[14]}`,
              borderRadius: tokens.radii.pill,
              background: tokens.colors.pillUnselected,
              border: 'none',
              color: tokens.colors.textOnPill,
              boxShadow: tokens.shadows.pillUnselected,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[8],
            }}
          >
            <MessageSquare style={{ width: '14px', height: '14px' }} />
            Next Chat
          </motion.button>
          
          <h1 style={{
            ...tokens.typography.title,
            color: tokens.colors.textPrimaryOnDark,
            margin: 0,
            textAlign: 'center',
            flex: 1,
          }}>
            Feedback
          </h1>
          
          <div style={{ width: '100px' }} /> {/* Spacer */}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: tokens.spacing[20],
        }}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  style={{ marginBottom: tokens.spacing[20] }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: tokens.colors.pillUnselected,
                    boxShadow: tokens.shadows.pillUnselected,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check style={{ width: '32px', height: '32px', color: tokens.colors.textOnPill }} />
                  </div>
                </motion.div>
                <h2 style={{
                  ...tokens.typography.title,
                  color: tokens.colors.textPrimaryOnDark,
                  margin: 0,
                  marginBottom: tokens.spacing[12],
                }}>
                  Thank You!
                </h2>
                <p style={{
                  ...tokens.typography.body,
                  color: tokens.colors.textSecondary,
                  margin: 0,
                }}>
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: tokens.spacing[20],
                }}
              >
                {/* Sub-header */}
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{
                    ...tokens.typography.heading,
                    color: tokens.colors.textPrimaryOnDark,
                    margin: 0,
                    marginBottom: tokens.spacing[8],
                  }}>
                    How was it?
                  </h2>
                  <p style={{
                    ...tokens.typography.label,
                    color: tokens.colors.textSecondary,
                    margin: 0,
                  }}>
                    {profileName
                      ? `Rate your conversation with ${profileName}`
                      : "Rate your conversation"}
                  </p>
                </div>

                {/* Rating Sections */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.spacing[16],
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}>
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
                  <div>
                    <label style={{
                      ...tokens.typography.label,
                      color: tokens.colors.textPrimaryOnDark,
                      marginBottom: tokens.spacing[8],
                      display: 'block',
                      textAlign: 'center',
                    }}>
                      Notes about {profileName || "Alex"}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={`Share your thoughts about ${profileName || "Alex"}...`}
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing[10]} ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.input,
                        background: tokens.colors.pillUnselected,
                        border: 'none',
                        color: tokens.colors.textOnPill,
                        boxShadow: tokens.shadows.pillUnselected,
                        fontSize: '15px',
                        fontWeight: 400,
                        letterSpacing: '0',
                        resize: 'none',
                        outline: 'none',
                        minHeight: '80px',
                      }}
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.spacing[12],
                  }}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleAddToCommunity()
                      }}
                      type="button"
                      disabled={addedToCommunity}
                      style={{
                        width: '100%',
                        padding: `10px ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.pill,
                        background: addedToCommunity ? 'transparent' : tokens.colors.pillUnselected,
                        border: addedToCommunity ? `1px solid rgba(255,255,255,0.12)` : 'none',
                        color: tokens.colors.textOnPill,
                        boxShadow: addedToCommunity ? 'none' : tokens.shadows.pillUnselected,
                        fontSize: '15px',
                        fontWeight: 400,
                        letterSpacing: '0',
                        cursor: addedToCommunity ? 'not-allowed' : 'pointer',
                        opacity: addedToCommunity ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: tokens.spacing[8],
                      }}
                    >
                      <Users style={{ width: '16px', height: '16px' }} />
                      {addedToCommunity
                        ? `Added ${profileName || "them"} to Community`
                        : `Add ${profileName || "them"} to Community`}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowReportModal(true)
                      }}
                      type="button"
                      style={{
                        width: '100%',
                        padding: `10px ${tokens.spacing[14]}`,
                        borderRadius: tokens.radii.pill,
                        background: 'transparent',
                        border: `1px solid rgba(255,255,255,0.12)`,
                        color: tokens.colors.textPrimaryOnDark,
                        fontSize: '15px',
                        fontWeight: 400,
                        letterSpacing: '0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: tokens.spacing[8],
                      }}
                    >
                      <Flag style={{ width: '16px', height: '16px' }} />
                      Report {profileName || "this person"}
                    </motion.button>

                    {/* Submit Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!loading) {
                          handleSubmit()
                        }
                      }}
                      type="button"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: tokens.radii.button,
                        background: tokens.colors.pillUnselected,
                        color: tokens.colors.textOnPill,
                        border: 'none',
                        boxShadow: tokens.shadows.pillUnselected,
                        fontSize: '15px',
                        fontWeight: 500,
                        letterSpacing: '0',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        pointerEvents: loading ? 'none' : 'auto',
                        position: 'relative',
                        zIndex: 10,
                        transition: 'all 0.14s ease',
                        marginTop: tokens.spacing[8],
                      }}
                    >
                      {loading ? "Submitting..." : hasAnyRating ? "Submit Feedback" : "Skip Feedback"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
    </AppShell>
  )
}
