"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Step = 'email' | 'name' | 'password' | 'interests' | 'verify' | 'welcome'

function OnboardingContent() {
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp, loading: authLoading } = useAuth()

  // Check onboarding status when user changes
  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/users?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const userData = data.data
        // If user has name and interests, they've completed onboarding
        if (userData.name && userData.interests && userData.interests.length > 0) {
          router.push("/vibe")
          return
        }
        
        // If user is verified but hasn't completed onboarding, pre-fill data
        if (user.email_confirmed_at && userData.name) {
          setName(userData.name)
          if (userData.interests && userData.interests.length > 0) {
            setSelectedInterests(userData.interests)
          }
        }
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err)
    }
  }, [user, router])

  // Check status on mount and when user changes
  useEffect(() => {
    // Only check if auth has finished loading
    if (authLoading) return
    
    if (!user) {
      // No user, show signup form - do nothing, just render
      return
    }
    
    // User exists, check their onboarding status
    checkOnboardingStatus()
  }, [authLoading, user, checkOnboardingStatus])

  // Handle email verification - auto-complete onboarding
  useEffect(() => {
    if (!user || !user.email_confirmed_at || authLoading) return
    
    const verified = searchParams.get('verified')
    
    if (verified === 'true' || user.email_confirmed_at) {
      // User just verified email
      if (selectedInterests.length > 0) {
        handleCompleteOnboarding()
      } else {
        // Move to interests step if not already there
        if (currentStep !== 'interests' && currentStep !== 'welcome') {
          setCurrentStep('interests')
        }
        if (user.email && !email) {
          setEmail(user.email)
        }
      }
    }
  }, [user, searchParams, selectedInterests, email, currentStep, authLoading])

  const validatePasswordMatch = useCallback(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match")
      return false
    } else {
      setPasswordMatchError("")
      return true
    }
  }, [password, confirmPassword])

  useEffect(() => {
    if (confirmPassword) {
      validatePasswordMatch()
    }
  }, [password, confirmPassword, validatePasswordMatch])

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleNext = () => {
    setError("")
    
    if (currentStep === 'email') {
      if (!email.trim() || !email.includes('@')) {
        setError("Please enter a valid email address")
        return
      }
      setCurrentStep('name')
    } else if (currentStep === 'name') {
      if (!name.trim()) {
        setError("Please enter your name")
        return
      }
      setCurrentStep('password')
    } else if (currentStep === 'password') {
      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }
      if (!validatePasswordMatch()) {
        setError("Passwords do not match")
        return
      }
      setCurrentStep('interests')
    } else if (currentStep === 'interests') {
      if (selectedInterests.length === 0) {
        setError("Please select at least one interest")
        return
      }
      handleSubmit()
    }
  }

  const handleBack = () => {
    setError("")
    if (currentStep === 'name') {
      setCurrentStep('email')
    } else if (currentStep === 'password') {
      setCurrentStep('name')
    } else if (currentStep === 'interests') {
      setCurrentStep('password')
    }
  }

  const handleSubmit = async () => {
    setError("")
    
    // If user is already authenticated and verified, just complete onboarding
    if (user && user.email_confirmed_at) {
      await handleCompleteOnboarding()
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

      // Save user data with interests immediately
      if (result.data?.user?.id) {
        const userId = result.data.user.id
        
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
        }
      }

      // Move to verify step
      setCurrentStep('verify')
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!user?.id) return
    
    setLoading(true)
    setError("")
    
    try {
      const userResponse = await fetch(`/api/users?userId=${user.id}`)
      const userData = await userResponse.json()
      const existingName = userData.success && userData.data?.name ? userData.data.name : name.trim() || user.email?.split('@')[0] || 'User'
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: existingName,
          interests: selectedInterests.length > 0 ? selectedInterests : []
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentStep('welcome')
        // After welcome screen, redirect to vibe
        setTimeout(() => {
          router.push("/vibe")
        }, 2000)
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

  // Show loading ONLY while auth is actually loading (first time check)
  // Once authLoading is false, we can render the form
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // If user is authenticated, verified, and has completed onboarding, redirect
  // This will be handled by checkOnboardingStatus, but show loading briefly
  if (user && user.email_confirmed_at) {
    // Check if we should redirect (will happen in useEffect)
    // Show form in case redirect takes a moment
  }

  // Step 1: Email
  if (currentStep === 'email') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Sign Up
                  </h1>
                  <p className="text-xs text-white/60">
                    Step 1 of 4
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim() && email.includes('@')) {
                          handleNext()
                        }
                      }}
                      required
                      disabled={loading || !!user}
                      className="bg-white/5 border-white/10 text-sm text-white h-12"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 space-y-2">
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="w-full h-12 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                    size="lg"
                    disabled={loading || !email.trim() || !email.includes('@')}
                  >
                    Continue
                  </Button>
                  
                  {!user && (
                    <div className="text-center text-[11px] text-white/60">
                      Already have an account?{" "}
                      <Link href="/login" className="text-white underline-offset-4 hover:underline">
                        Sign in
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Name
  if (currentStep === 'name') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    What&apos;s your name?
                  </h1>
                  <p className="text-xs text-white/60">
                    Step 2 of 4
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) {
                          handleNext()
                        }
                      }}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-sm text-white h-12"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                    size="lg"
                    disabled={loading || !name.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Password
  if (currentStep === 'password') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Create a password
                  </h1>
                  <p className="text-xs text-white/60">
                    Step 3 of 4
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
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
                        className="bg-white/5 border-white/10 text-sm text-white h-12"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && password.length >= 6 && validatePasswordMatch()) {
                            handleNext()
                          }
                        }}
                        required
                        disabled={loading}
                        className={cn(
                          "bg-white/5 border-white/10 text-sm text-white h-12",
                          passwordMatchError && "border-red-500/50"
                        )}
                      />
                      {passwordMatchError && (
                        <p className="text-[10px] text-red-400 mt-0.5">{passwordMatchError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                    size="lg"
                    disabled={loading || password.length < 6 || !!passwordMatchError}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Interests
  if (currentStep === 'interests') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Select your interests
                  </h1>
                  <p className="text-xs text-white/60">
                    Step 4 of 4
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
                  {error && (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  {categories.map((category) => {
                    const categoryInterests = INTERESTS.filter(i => i.category === category)
                    return (
                      <div key={category} className="space-y-2">
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

                <div className="flex-shrink-0 flex gap-2 pt-2 border-t border-white/10">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-white text-black border border-white"
                    size="lg"
                    disabled={loading || selectedInterests.length === 0}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Verify Email
  if (currentStep === 'verify') {
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
                    We sent a verification link to <strong>{user?.email || email}</strong>
                  </p>
                  <p className="text-xs text-white/50 px-4">
                    Click the link in the email to verify your account. Once verified, you&apos;ll be automatically signed in.
                  </p>
                </div>
                
                <div className="w-full space-y-2 flex-shrink-0">
                  <Button
                    onClick={() => {
                      // Refresh to check if email was verified
                      window.location.reload()
                    }}
                    variant="outline"
                    className="w-full h-12 text-sm font-semibold tracking-wide border-white/20 text-white hover:border-white/40 hover:bg-white/5"
                    size="lg"
                  >
                    I&apos;ve verified my email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 6: Welcome
  if (currentStep === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 items-center justify-center overflow-hidden flex flex-col">
                <div className="text-center space-y-4 w-full flex-shrink-0">
                  <div className="text-5xl mb-4">🎉</div>
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    Welcome to Narrative
                  </h1>
                  <p className="text-sm text-white/60 px-4">
                    Your account is ready! Redirecting you now...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
