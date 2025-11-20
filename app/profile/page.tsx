"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { BottomNav } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"
import { ArrowLeft, Save, Users, Edit2, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [userName, setUserName] = useState("")
  const [quoteOfDay, setQuoteOfDay] = useState("")
  const [communityMembers, setCommunityMembers] = useState<{ id: string; name: string }[]>([])
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState("")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Load user profile
  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      setLoadingProfile(true)
      try {
        const response = await fetch(`/api/users?userId=${user.id}`)
        const data = await response.json()
        if (data.success && data.data) {
          setUserName(data.data.name || "User")
          setTempName(data.data.name || "User")
        } else {
          // No profile yet, redirect to onboarding
          router.push("/onboarding")
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        router.push("/onboarding")
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [user, router])

  useEffect(() => {
    if (!user?.id) return

    // Load quote of the day
    const savedQuote = localStorage.getItem("quoteOfDay")
    if (savedQuote) {
      setQuoteOfDay(savedQuote)
    }

    // Load community members
    const community = JSON.parse(localStorage.getItem("communityMembers") || "[]")
    setCommunityMembers(community)

    // Load recent chats from database
    const loadRecentChats = async () => {
      setLoadingChats(true)
      try {
        const response = await fetch(`/api/chats?userId=${user.id}&type=recent&limit=5`)
        const data = await response.json()
        if (data.success && data.data) {
          setRecentChats(data.data)
        } else {
          setRecentChats([])
        }
      } catch (error) {
        console.error('Error loading recent chats:', error)
        setRecentChats([])
      } finally {
        setLoadingChats(false)
      }
    }

    loadRecentChats()
  }, [user])

  const handleSaveQuote = () => {
    localStorage.setItem("quoteOfDay", quoteOfDay)
  }

  const handleSaveName = async () => {
    if (!user?.id || !tempName.trim()) return

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: tempName.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        setUserName(tempName.trim())
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Error saving name:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (!user) {
    router.push("/onboarding")
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Redirecting...</p>
      </div>
    )
  }

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
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
                "border-b border-white/10 bg-black",
                "sticky top-0 z-10 flex-shrink-0"
              )}>
                <button
                  onClick={() => router.push("/vibe")}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white/80" />
                </button>

                <h1 className="text-lg font-bold text-white tracking-tight">
                  Profile
                </h1>

                <button
                  onClick={() => router.push("/conversations")}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-white/80" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-0">
                {/* Profile Header */}
                <div className="text-center mb-3">
                  <div className="text-3xl mb-1.5">👤</div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-2xl font-bold text-white bg-white/5 border border-white/10 rounded-[12px] px-3 py-1 text-center"
                        autoFocus
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName()
                          }
                          if (e.key === 'Escape') {
                            setTempName(userName)
                            setIsEditingName(false)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {userName || "User"}
                      </h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-white/60" />
                      </button>
                    </div>
                  )}
                </div>

                {/* What's on my mind */}
                <div className={cn("rounded-lg p-2.5", "sleek-module")}>
                  <div className="flex items-start gap-2">
                    <textarea
                      value={quoteOfDay}
                      onChange={(e) => setQuoteOfDay(e.target.value)}
                      onBlur={handleSaveQuote}
                      placeholder="What's on your mind today?"
                      className={cn(
                        "flex-1 px-3 py-2 rounded-xl",
                        "bg-white/5 border border-white/10",
                        "text-white placeholder:text-white/50",
                        "text-xs resize-none",
                        "focus:outline-none focus:border-white/20",
                        "focus:ring-1 focus:ring-white/20"
                      )}
                      rows={2}
                    />
                    <button
                      onClick={handleSaveQuote}
                      type="button"
                      className={cn(
                        "p-1.5 rounded-lg",
                        "bg-white text-black",
                        "border border-white",
                        "touch-manipulation cursor-pointer"
                      )}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* What People Say - Empty State */}
                <div className={cn("rounded-lg p-2.5", "sleek-module")}>
                  <h3 className="text-xs font-bold text-white/90 mb-2">
                    What People Say About Me
                  </h3>
                  <p className="text-xs text-white/60 text-center py-2">
                    No reviews yet. Start conversations to get feedback!
                  </p>
                </div>

                {/* Friends - Empty States */}
                <div className={cn("rounded-lg p-2.5", "sleek-module")}>
                  <h3 className="text-xs font-bold text-white/90 mb-3 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    My Friends
                  </h3>

                  {/* Inner Circle */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-white/70 font-medium">Inner Circle</p>
                      <span className="text-[10px] text-white/50">0</span>
                    </div>
                    <p className="text-xs text-white/60 px-1">No inner circle members yet</p>
                  </div>

                  {/* Close Friends */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-white/70 font-medium">Close Friends</p>
                      <span className="text-[10px] text-white/50">0</span>
                    </div>
                    <p className="text-xs text-white/60 px-1">No close friends yet</p>
                  </div>

                  {/* Community */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-white/70 font-medium">Community</p>
                      <span className="text-[10px] text-white/50">{communityMembers.length}</span>
                    </div>
                    {communityMembers.length > 0 ? (
                      <div className="relative -mx-1">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pt-1 px-1 scroll-smooth">
                          {communityMembers.map((member) => (
                            <motion.button
                              key={member.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/chat/${member.id}`)}
                              type="button"
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-[12px] flex-shrink-0",
                                "bg-green-400/20 border border-green-400/40",
                                "hover:bg-green-400/30 hover:border-green-400/50",
                                "transition-all duration-200",
                                "touch-manipulation cursor-pointer"
                              )}
                            >
                              <span className="text-xs font-medium text-white/90">{member.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/60 px-1">No community members yet</p>
                    )}
                  </div>
                </div>

                {/* Recent Chats */}
                <div className={cn("rounded-lg p-2.5", "sleek-module")}>
                  <h3 className="text-xs font-bold text-white/90 mb-2.5">Recent Chats</h3>
                  {loadingChats ? (
                    <p className="text-xs text-white/60 text-center py-2">Loading...</p>
                  ) : recentChats.length > 0 ? (
                    <div className="space-y-1.5">
                      {recentChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => router.push(`/chat/${chat.id}`)}
                          className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-left"
                        >
                          <span className="text-lg">{chat.emoji || "👤"}</span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-white/90">{chat.name}</p>
                            <p className="text-[10px] text-white/60">{chat.lastMessage || "No messages yet"}</p>
                          </div>
                          <p className="text-[9px] text-white/50">{chat.time}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60 text-center py-2">No recent chats</p>
                  )}
                </div>
              </div>

              {/* Logout and Forgot Password */}
              <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0 space-y-2">
                <button
                  onClick={async () => {
                    await signOut()
                    router.push("/onboarding")
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  Sign Out
                </button>
                <Link
                  href="/login"
                  className="block w-full px-4 py-2.5 rounded-lg text-sm font-semibold border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all text-center"
                >
                  Forgot Password
                </Link>
              </div>
            </div>

            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
