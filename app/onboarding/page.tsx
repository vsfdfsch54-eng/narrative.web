"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Notification } from "@/components/ui/notification"
import { useAuth } from "@/hooks/use-auth"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

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
  const [showVerified, setShowVerified] = useState(false)

  // Check onboarding status when user changes
  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.id) return
    
    // If email confirmation is enabled in Supabase and user is not verified, redirect to verify page
    // Note: If email confirmation is disabled, user.email_confirmed_at will be true immediately
    if (!user.email_confirmed_at) {
      // Check if we're already on verify step - if so, don't redirect
      if (currentStep !== 'verify') {
        router.push("/verify")
      }
      return
    }
    
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
        
        // User is verified but hasn't completed onboarding
        // Pre-fill data and set appropriate step
        if (user.email) {
          setEmail(user.email)
        }
        
        if (userData.name) {
          setName(userData.name)
          // If they have a name, they've passed email and name steps
          // Check if they need interests
          if (!userData.interests || userData.interests.length === 0) {
            // They need to select interests
            setCurrentStep('interests')
            if (userData.interests) {
              setSelectedInterests(userData.interests)
            }
          } else {
            // They have everything, should have been redirected above
            router.push("/vibe")
          }
        } else {
          // No name yet, but they're verified
          // They need to complete name, password, and interests
          // Start at name step since email is already done
          setCurrentStep('name')
        }
      } else {
        // No user data, but they're verified
        // They need to complete the flow
        // Since they're verified, start at name step (email is done)
        if (user.email) {
          setEmail(user.email)
        }
        setCurrentStep('name')
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err)
      // On error, if verified, start at name step
      if (user.email_confirmed_at) {
        if (user.email) {
          setEmail(user.email)
        }
        setCurrentStep('name')
      }
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

  // Handle email verification - poll for verification status and redirect
  useEffect(() => {
    if (authLoading) return
    
    // If user is verified, check onboarding status and set appropriate step
    if (user && user.email_confirmed_at) {
      const checkAndRedirect = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            if (hasName && hasInterests) {
              // Onboarding complete, redirect directly to /vibe
              router.push('/vibe')
              return
            } else {
              // Not complete, set appropriate step
              if (user.email) {
                setEmail(user.email)
              }
              
              if (hasName) {
                // Has name, needs interests
                if (currentStep === 'verify') {
                  setShowVerified(true)
                }
                setCurrentStep('interests')
                if (data.data.interests) {
                  setSelectedInterests(data.data.interests)
                }
              } else {
                // Needs name (and password, then interests)
                // Start at name step since email is already done
                setCurrentStep('name')
              }
            }
          } else {
            // No user data, but verified - start at name step
            if (user.email) {
              setEmail(user.email)
            }
            setCurrentStep('name')
          }
        } catch (err) {
          // Error checking, start at name step if verified
          if (user.email) {
            setEmail(user.email)
          }
          setCurrentStep('name')
        }
      }
      
      checkAndRedirect()
    }
  }, [user, currentStep, email, authLoading, router])

  // Poll for verification status when on verify step
  useEffect(() => {
    if (authLoading || currentStep !== 'verify' || !user) return

    // Poll every 2 seconds to check if email is verified
    const verificationPoll = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email_confirmed_at) {
          // Email verified! Check onboarding status and redirect
          clearInterval(verificationPoll)
          
          try {
            const response = await fetch(`/api/users?userId=${session.user.id}`)
            const data = await response.json()
            
            if (data.success && data.data) {
              const hasName = data.data.name
              const hasInterests = data.data.interests && data.data.interests.length > 0
              
              if (hasName && hasInterests) {
                // Onboarding complete, redirect to /vibe
                router.push('/vibe')
              } else {
                // Move to interests step
                setShowVerified(true)
                setCurrentStep('interests')
                if (session.user.email && !email) {
                  setEmail(session.user.email)
                }
              }
            } else {
              // No user data, move to interests
              setShowVerified(true)
              setCurrentStep('interests')
            }
          } catch (err) {
            // Error, move to interests
            setShowVerified(true)
            setCurrentStep('interests')
          }
        }
      } catch (err) {
        console.error('Error polling verification:', err)
      }
    }, 2000) // Check every 2 seconds

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(verificationPoll)
    }, 300000)

    return () => {
      clearInterval(verificationPoll)
      clearTimeout(timeout)
    }
  }, [currentStep, user, authLoading, email, router])

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
        // Show user-friendly error message
        const errorMessage = result.error || "Failed to create account"
        setError(errorMessage)
        setLoading(false)
        
        // If duplicate email, suggest signing in
        if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
          // Keep error message, user can click "Sign in" link
        }
        return
      }

      // Check if signup was successful
      if (!result.data?.user) {
        setError("Account creation failed. Please try again.")
        setLoading(false)
        return
      }

      // Log for debugging
      console.log('Signup successful, user:', result.data.user.id)
      console.log('Email confirmation required:', !result.data.user.email_confirmed_at)
      console.log('User email:', result.data.user.email)

      // Save user data with interests immediately
      if (result.data.user.id) {
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

      // Check if email was sent - Supabase should send it automatically
      // But if it didn't, try to resend immediately
      if (!result.data.user.email_confirmed_at) {
        console.log('Email not confirmed, attempting to resend verification email...')
        console.log('Email address:', email)
        console.log('Redirect URL:', `${window.location.origin}/auth/callback`)
        
        try {
          const { data: resendData, error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
          
          console.log('Resend response:', { data: resendData, error: resendError })
          
          if (resendError) {
            console.error('Error resending email:', resendError)
            console.error('Error details:', {
              message: resendError.message,
              status: resendError.status,
              code: resendError.code
            })
            
            // Show helpful error message
            if (resendError.message.includes('rate limit') || resendError.message.includes('too many')) {
              setError('Too many email requests. Please wait a few minutes and try again.')
            } else if (resendError.message.includes('disabled') || resendError.message.includes('not enabled')) {
              setError('Email verification is not enabled in Supabase. Please contact support or check Supabase settings.')
            } else {
              setError(`Email sending failed: ${resendError.message}. Please check Supabase email configuration.`)
            }
          } else {
            console.log('Verification email resent successfully')
          }
        } catch (resendErr: any) {
          console.error('Exception resending email:', resendErr)
          setError(`Failed to send email: ${resendErr.message}. Please check Supabase configuration.`)
        }
      } else {
        console.log('User email already confirmed - no need to send verification email')
      }

      // Move to verify step
      setLoading(false)
      setCurrentStep('verify')
    } catch (err: any) {
      console.error('Signup error:', err)
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
        // Redirect to /signed-up page after completing onboarding
        router.push('/signed-up')
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
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#EDEDED]/60">Loading...</p>
      </div>
    )
  }

  // If user is authenticated, verified, and has completed onboarding, they will be redirected
  // But don't block rendering - let the redirect happen naturally

  // Step 1: Email
  if (currentStep === 'email') {
    return (
      <>
        {showVerified && (
          <Notification
            message="Email verified successfully!"
            type="success"
            duration={4000}
            onClose={() => setShowVerified(false)}
          />
        )}
        <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
                    Sign Up
                  </h1>
                  <p className="text-xs text-[#EDEDED]/60">
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
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[#EDEDED]/60">
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
                      className="bg-white/5 border-[#EDEDED]/10 text-sm text-[#EDEDED] h-12"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 space-y-2">
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="w-full h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
                    size="lg"
                    disabled={loading || !email.trim() || !email.includes('@')}
                  >
                    Continue
                  </Button>
                  
                  {!user && (
                    <div className="text-center text-[11px] text-[#EDEDED]/60">
                      Already have an account?{" "}
                      <Link href="/login" className="text-[#EDEDED] underline-offset-4 hover:underline">
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
      </>
    )
  }

  // Step 2: Name
  if (currentStep === 'name') {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
                    What&apos;s your name?
                  </h1>
                  <p className="text-xs text-[#EDEDED]/60">
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
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[#EDEDED]/60">
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
                      className="bg-white/5 border-[#EDEDED]/10 text-sm text-[#EDEDED] h-12"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold border-[#EDEDED]/10 bg-white/5 text-[#EDEDED] hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
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
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
                    Create a password
                  </h1>
                  <p className="text-xs text-[#EDEDED]/60">
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
                      <label className="text-[11px] uppercase tracking-[0.2em] text-[#EDEDED]/60">
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
                        className="bg-white/5 border-[#EDEDED]/10 text-sm text-[#EDEDED] h-12"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.2em] text-[#EDEDED]/60">
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
                          "bg-white/5 border-[#EDEDED]/10 text-sm text-[#EDEDED] h-12",
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
                    className="flex-1 h-12 text-sm font-semibold border-[#EDEDED]/10 bg-white/5 text-[#EDEDED] hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
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
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 overflow-hidden flex flex-col">
                <div className="text-center space-y-2 flex-shrink-0">
                  <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
                    Select your interests
                  </h1>
                  <p className="text-xs text-[#EDEDED]/60">
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
                        <h3 className="text-xs font-semibold text-[#EDEDED]/80">{category}</h3>
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
                                    ? "bg-[#EDEDED] text-[#0A0A0A] border-[#EDEDED]"
                                    : "bg-white/5 text-[#EDEDED]/80 border-[#EDEDED]/10 hover:bg-white/10 hover:border-[#EDEDED]/20",
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

                <div className="flex-shrink-0 flex gap-2 pt-2 border-t border-[#EDEDED]/10">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-12 text-sm font-semibold border-[#EDEDED]/10 bg-white/5 text-[#EDEDED] hover:bg-white/10"
                    size="lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
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
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 items-center justify-center overflow-hidden flex flex-col">
                <div className="text-center space-y-3 w-full flex-shrink-0">
                  <div className="text-4xl mb-2">📧</div>
                  <h1 className="text-2xl font-black tracking-tight text-[#EDEDED]">
                    Check your email
                  </h1>
                  <p className="text-sm text-[#EDEDED]/60 px-4">
                    We sent a verification link to <strong>{user?.email || email}</strong>
                  </p>
                  <p className="text-xs text-[#EDEDED]/50 px-4">
                    Click the link in the email to verify your account. Once verified, you&apos;ll be automatically signed in.
                  </p>
                </div>
                
                <div className="w-full space-y-3 flex-shrink-0">
                  <Button
                    onClick={async () => {
                      // Resend verification email
                      setLoading(true)
                      try {
                        const emailToUse = user?.email || email
                        if (!emailToUse) {
                          alert('No email address found. Please go back and enter your email.')
                          setLoading(false)
                          return
                        }

                        console.log('Resending verification email to:', emailToUse)
                        console.log('Redirect URL:', `${window.location.origin}/auth/callback`)

                        const { data, error } = await supabase.auth.resend({
                          type: 'signup',
                          email: emailToUse,
                          options: {
                            emailRedirectTo: `${window.location.origin}/auth/callback`,
                          },
                        })

                        console.log('Resend response:', { data, error })

                        if (error) {
                          console.error('Error resending email:', error)
                          alert(`Error: ${error.message}\n\nPlease check:\n1. Supabase email settings are configured\n2. Your email address is valid\n3. Check spam folder`)
                        } else {
                          alert('Verification email sent! Please check your inbox and spam folder.')
                        }
                      } catch (err: any) {
                        console.error('Error resending email:', err)
                        alert(`Error: ${err.message || 'Failed to resend email'}\n\nPlease check Supabase email configuration.`)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    variant="outline"
                    className="w-full h-12 text-sm font-semibold border-[#EDEDED]/20 text-[#EDEDED] hover:border-[#EDEDED]/40 hover:bg-[#EDEDED]/5"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </Button>

                  <Button
                    onClick={async () => {
                      // Manually check verification
                      setLoading(true)
                      try {
                        const { data: { session } } = await supabase.auth.getSession()
                        if (session?.user?.email_confirmed_at) {
                          // Verified! Check onboarding
                          const response = await fetch(`/api/users?userId=${session.user.id}`)
                          const data = await response.json()
                          
                          if (data.success && data.data) {
                            const hasName = data.data.name
                            const hasInterests = data.data.interests && data.data.interests.length > 0
                            
                            if (hasName && hasInterests) {
                              router.push('/vibe')
                            } else {
                              setShowVerified(true)
                              if (hasName) {
                                setCurrentStep('interests')
                                if (data.data.interests) {
                                  setSelectedInterests(data.data.interests)
                                }
                              } else {
                                setCurrentStep('name')
                              }
                            }
                          } else {
                            setShowVerified(true)
                            setCurrentStep('name')
                          }
                        } else {
                          alert('Email not verified yet. Please check your email and click the verification link. Make sure to check your spam folder!')
                        }
                      } catch (err) {
                        console.error('Error checking verification:', err)
                        alert('Error checking verification. Please try again.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    variant="primary"
                    className="w-full h-12 text-sm font-semibold tracking-wide bg-[#EDEDED] text-[#0A0A0A] border border-[#EDEDED]"
                    size="lg"
                    disabled={loading}
                  >
                    I&apos;ve Verified My Email
                  </Button>
                  
                  <p className="text-xs text-[#EDEDED]/40 text-center px-4">
                    Check your email ({email}) and click the verification link. Don&apos;t forget to check your spam folder!
                  </p>
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
      <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden w-full h-full m-0 p-0">
        <div className="phone-frame-container">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-content p-4 gap-4 items-center justify-center overflow-hidden flex flex-col">
                <div className="text-center space-y-4 w-full flex-shrink-0">
                  <div className="text-5xl mb-4">🎉</div>
                  <h1 className="text-3xl font-black tracking-tight text-[#EDEDED]">
                    Welcome to Narrative
                  </h1>
                  <p className="text-sm text-[#EDEDED]/60 px-4">
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
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#EDEDED]/60">Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
