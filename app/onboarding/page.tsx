"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { cn } from "@/lib/utils"

export default function OnboardingPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [passwordMatchError, setPasswordMatchError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp } = useAuth()

  // Check if email was verified
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true' && user && user.email_confirmed_at) {
      // User verified their email, complete onboarding
      handleCompleteOnboarding()
    }
  }, [searchParams, user])

  // Redirect if already authenticated and has completed onboarding
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      // Check if user has interests (completed onboarding)
      checkOnboardingStatus()
    }
  }, [user])

  const checkOnboardingStatus = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/users?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const userData = data.data
        // If user has name and interests, they've completed onboarding
        if (userData.name && userData.interests && userData.interests.length > 0) {
          router.push("/vibe")
        }
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err)
    }
  }

  const validatePasswordMatch = () => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match")
      return false
    } else {
      setPasswordMatchError("")
      return true
    }
  }

  useEffect(() => {
    if (confirmPassword) {
      validatePasswordMatch()
    }
  }, [password, confirmPassword])

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validation
    if (!email.trim()) {
      setError("Email is required")
      return
    }
    
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    if (!validatePasswordMatch()) {
      setError("Passwords do not match")
      return
    }
    
    if (selectedInterests.length === 0) {
      setError("Please select at least one interest")
      return
    }

    setLoading(true)

    try {
      // Create Supabase Auth account
      const result = await signUp(email, password, name)
      
      if (!result.success) {
        setError(result.error || "Failed to create account")
        setLoading(false)
        return
      }

      // If user was created, save interests to database
      if (result.data?.user?.id) {
        const userId = result.data.user.id
        
        // Save user data with interests
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: name.trim(),
            interests: selectedInterests
          })
        })

        const userData = await response.json()
        
        if (!userData.success) {
          console.error('Error saving user data:', userData.error)
          // Don't fail the signup, but log the error
        }
      }

      // Show email verification message
      setEmailSent(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!user?.id) return
    
    setLoading(true)
    
    try {
      // Save interests if not already saved
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim() || user.email?.split('@')[0] || 'User',
          interests: selectedInterests.length > 0 ? selectedInterests : []
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push("/vibe")
      } else {
        setError(data.error || "Failed to complete onboarding")
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setLoading(false)
    }
  }

  const categories = getAllCategories()

  if (emailSent) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 items-center justify-center overflow-hidden flex flex-col">
                <div className="text-center space-y-3 w-full flex-shrink-0">
                  <div className="text-4xl mb-2">📧</div>
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Check your email
                  </h1>
                  <p className="text-sm text-white/60 px-4">
                    We sent a verification link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-white/50 px-4">
                    Click the link in the email to verify your account and complete onboarding.
                  </p>
                </div>
                
                <div className="w-full space-y-2 flex-shrink-0">
                  <Button
                    onClick={() => router.push("/login")}
                    variant="outline"
                    className="w-full h-11 text-sm font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                    size="lg"
                  >
                    Already verified? Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-content p-4 gap-3 overflow-hidden flex flex-col">
              <div className="text-center space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Welcome to Narrative
                </h1>
                <p className="text-xs text-white/60">
                  Let&apos;s set up your profile
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-3 flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-hide">
                {error && (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex-shrink-0">
                    {error}
                  </div>
                )}

                <div className="space-y-2.5 flex-shrink-0">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className={cn(
                        "bg-white/5 border-white/10 text-sm text-white",
                        passwordMatchError && "border-red-500/50"
                      )}
                    />
                    {passwordMatchError && (
                      <p className="text-[10px] text-red-400 mt-0.5">{passwordMatchError}</p>
                    )}
                  </div>
                </div>

                {/* Interests Selection */}
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-white/60 flex-shrink-0">
                    Interests (select at least one)
                  </label>
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
                    {categories.map((category) => {
                      const categoryInterests = INTERESTS.filter(i => i.category === category)
                      return (
                        <div key={category} className="space-y-1.5">
                          <h3 className="text-xs font-semibold text-white/80">{category}</h3>
                          <div className="flex flex-wrap gap-2">
                            {categoryInterests.map((interest) => {
                              const isSelected = selectedInterests.includes(interest.id)
                              return (
                                <button
                                  key={interest.id}
                                  type="button"
                                  onClick={() => handleInterestToggle(interest.id)}
                                  disabled={loading}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                    "border min-h-[36px] min-w-[36px]",
                                    isSelected
                                      ? "bg-white text-black border-white"
                                      : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                  )}
                                >
                                  {interest.emoji && <span className="mr-1">{interest.emoji}</span>}
                                  {interest.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-auto space-y-2 flex-shrink-0 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                    size="lg"
                    disabled={loading || !email.trim() || !name.trim() || password.length < 6 || selectedInterests.length === 0 || !!passwordMatchError}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
