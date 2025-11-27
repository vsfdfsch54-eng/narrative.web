"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface Profile {
  id: string
  name: string
  lastName: string
  gender: "male" | "female"
  mutualFriends: {
    count: number
    names: string[]
  }
  mood?: {
    id: string
    label: string
  }
  topic?: {
    id: string
    label: string
  }
  reviews: {
    emoji: string
    text: string
  }[]
  successRate: number
  interests: string[]
  isCommunityMember?: boolean
}

interface ProfileCardProps {
  profile: Profile
  onChat: () => void
  onSkip: () => void
}

export function ProfileCard({ profile, onChat, onSkip }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-full sm:max-w-[320px] rounded-[24px]",
        "sleek-module",
        "p-4 flex flex-col gap-3",
        "relative"
      )}
    >
      {/* Box 1: Name & Mutual Friends */}
      <div className="sleek-module p-3 border-2 border-white/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {profile.name} {profile.lastName[0]}.
            </h3>
            {profile.isCommunityMember && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-[9px] font-semibold text-white/90 tracking-wide uppercase">
                Community
              </span>
            )}
          </div>
          <span className="text-2xl">
            {profile.gender === "male" ? "👨" : "👩"}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65 mb-1">
            Mutual friends: {profile.mutualFriends.count}
          </p>
          {profile.mutualFriends.count > 0 ? (
            <p className="text-xs font-medium text-white/90">
              {profile.mutualFriends.names.join(", ")}
            </p>
          ) : (
            <p className="text-xs text-white/60 font-medium">None</p>
          )}
        </div>
      </div>

      {/* Box 2: What People Say, Mood & Topic */}
      <div className="sleek-module p-3 border-2 border-white/15">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65 mb-2">
          What people say
        </p>
        <div className="space-y-1.5 mb-3">
          {profile.reviews.map((review, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm">{review.emoji}</span>
              <p className="text-xs font-medium text-white/80">{review.text}</p>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/65 mb-1">Mood</p>
              {profile.mood ? (
                <p className="text-xs font-semibold text-white/90">{profile.mood.label}</p>
              ) : (
                <p className="text-xs text-white/60 font-medium">None</p>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/65 mb-1">Topic</p>
              {profile.topic ? (
                <p className="text-xs font-semibold text-white/90">{profile.topic.label}</p>
              ) : (
                <p className="text-xs text-white/60 font-medium">None</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Box 3: Success Rate */}
      <div className="sleek-module p-3 border-2 border-white/15">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65 mb-2">
          Conversation Success
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.successRate}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
          <p className="text-lg font-bold text-white">{profile.successRate}%</p>
        </div>
      </div>

      {/* Box 4: Interests */}
      <div className="sleek-module p-3 border-2 border-white/15">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65 mb-2">
          Interests
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.interests.map((interest, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChat()
          }}
          type="button"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-full",
            "bg-white text-black font-semibold text-sm tracking-wide",
            "border border-white",
            "transition-all duration-200",
            "hover:bg-white/95",
            "focus:outline-none focus:ring-2 focus:ring-white/40",
            "touch-manipulation cursor-pointer",
            "pointer-events-auto relative z-20",
            "select-none"
          )}
        >
          Chat
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSkip()
          }}
          type="button"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-full",
            "border border-white/10 bg-white/5",
            "text-white font-semibold text-sm tracking-wide",
            "transition-all duration-200",
            "hover:bg-white/8 hover:border-white/15",
            "focus:outline-none focus:ring-2 focus:ring-white/20",
            "touch-manipulation cursor-pointer",
            "pointer-events-auto relative z-20",
            "select-none"
          )}
        >
          Skip
        </motion.button>
      </div>
    </motion.div>
  )
}
