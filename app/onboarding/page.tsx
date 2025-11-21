"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { tokens } from "@/lib/design-tokens"

type Step = 'email' | 'name' | 'password' | 'interests' | 'verify'

function OnboardingContent() {
  const getInitialStep = (): Step => {
    if (typeof window === 'undefined') return 'email'
    const saved = localStorage.getItem('onboarding_step')
    if (saved && ['email', 'name', 'password', 'interests', 'verify'].includes(saved)) {
      return saved as Step
    }
    return 'email'
  }

  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep)
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onboarding_email') || ""
    }
    return ""
  })
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onboarding_name') || ""
    }
    return ""
  })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onboarding_interests')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const router = useRouter()
  const { user, signUp, loading: authLoading } = useAuth()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_step', currentStep)
    }
  }, [currentStep])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (email) localStorage.setItem('onboarding_email', email)
      if (name) localStorage.setItem('onboarding_name', name)
      localStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests))
    }
  }, [email, name, selectedInterests])

  const clearOnboardingData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_step')
      localStorage.removeItem('onboarding_email')
      localStorage.removeItem('onboarding_name')
      localStorage.removeItem('onboarding_interests')
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    
    if (user.email_confirmed_at) {
      const checkComplete = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            if (hasName && hasInterests) {
              clearOnboardingData()
              router.push('/vibe')
              return
            }
            
            if (user.email) setEmail(user.email)
            if (data.data.name) setName(data.data.name)
            if (data.data.interests) setSelectedInterests(data.data.interests)
            
            if (hasName && !hasInterests) {
              setCurrentStep('interests')
            } else if (!hasName) {
              setCurrentStep('name')
            }
          } else {
            if (user.email) setEmail(user.email)
            setCurrentStep('name')
          }
        } catch (err) {
          console.error('Error checking onboarding:', err)
        }
      }
      checkComplete()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || currentStep !== 'verify' || !user) return

    const verificationPoll = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email_confirmed_at) {
          clearInterval(verificationPoll)
          const response = await fetch(`/api/users?userId=${session.user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            if (hasName && hasInterests) {
              clearOnboardingData()
              router.push('/vibe')
            } else if (hasName) {
              setCurrentStep('interests')
              if (data.data.interests) setSelectedInterests(data.data.interests)
            } else {
              setCurrentStep('name')
            }
          } else {
            setCurrentStep('name')
          }
        }
      } catch (err) {
        console.error('Error polling verification:', err)
      }
    }, 2000)

    const timeout = setTimeout(() => clearInterval(verificationPoll), 300000)
    return () => {
      clearInterval(verificationPoll)
      clearTimeout(timeout)
    }
  }, [currentStep, user, authLoading, router])

  const validatePasswordMatch = useCallback(() => {
    if (!confirmPassword) {
      setPasswordMatchError("")
      return true
    }
    if (password !== confirmPassword) {
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
    if (loading) return
    
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_interests', JSON.stringify(newInterests))
      }
      
      return newInterests
    })
    
    if (error) setError("")
  }

  const handleNext = () => {
    setError("")
    
    if (currentStep === 'email') {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        setError("Please enter your email address")
        return
      }
      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.') || trimmedEmail.length < 5) {
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
    
    if (user && user.email_confirmed_at) {
      await handleCompleteOnboarding()
      return
    }
    
    // Validate before submitting
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address")
      return
    }
    
    if (!name.trim()) {
      setError("Please enter your name")
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
      const result = await signUp(email.trim(), password, name.trim())
      
      if (!result.success) {
        const errorMessage = result.error || "Failed to create account"
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (!result.data?.user) {
        setError("Account creation failed. Please try again.")
        setLoading(false)
        return
      }

      if (result.data.user.id) {
        const userId = result.data.user.id
        
        try {
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
            // Don't fail the entire flow, but log the error
          }
        } catch (userError) {
          console.error('Error calling /api/users:', userError)
          // Don't fail the entire flow
        }
      }

      if (result.data.user.email_confirmed_at) {
        clearOnboardingData()
        setLoading(false)
        router.push('/vibe')
        return
      }

      setLoading(false)
      setCurrentStep('verify')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!user?.id) {
      setError("User not found. Please try logging in again.")
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      if (selectedInterests.length === 0) {
        setError("Please select at least one interest")
        setLoading(false)
        return
      }
      
      const userResponse = await fetch(`/api/users?userId=${user.id}`)
      const userData = await userResponse.json()
      
      const existingName = userData.success && userData.data?.name 
        ? userData.data.name 
        : name.trim() || user.email?.split('@')[0] || 'User'
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: existingName,
          interests: selectedInterests
        })
      })

      const data = await response.json()
      
      if (data.success) {
        clearOnboardingData()
        setLoading(false)
        router.push('/vibe')
      } else {
        setError(data.error || "Failed to complete onboarding. Please try again.")
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err)
      setError(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const categories = getAllCategories()

  if (authLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        background: tokens.colors.backgroundApp, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  const stepNumber = currentStep === 'email' ? 1 : currentStep === 'name' ? 2 : currentStep === 'password' ? 3 : currentStep === 'interests' ? 4 : 5

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: tokens.colors.backgroundApp,
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
      overflowY: 'auto',
    }}>
      <div style={{
        maxWidth: tokens.layout.maxWidth,
        margin: '0 auto',
        padding: `${tokens.layout.topTitleSpacing} ${tokens.layout.paddingHorizontal}`,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
        minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      }}>
        {currentStep === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[8],
              }}>
                Sign Up
              </h1>
              <p style={{ 
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
              }}>
                Step {stepNumber} of 4
              </p>
            </div>

            {error && (
              <div style={{
                padding: tokens.spacing[16],
                borderRadius: tokens.radii.input,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                ...tokens.typography.label,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
              <div>
                <label style={{ 
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email.trim() && email.includes('@') && email.includes('.') && email.length >= 5) {
                      handleNext()
                    }
                  }}
                  disabled={loading || !!user}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: `10px ${tokens.spacing[14]}`,
                    borderRadius: tokens.radii.input,
                    background: tokens.colors.pillUnselected,
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    boxShadow: tokens.shadows.pillUnselected,
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: tokens.spacing[12], 
              marginTop: tokens.spacing[20],
              position: 'relative',
              zIndex: 10,
            }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={loading || !email.trim() || !email.includes('@') || !email.includes('.') || email.length < 5}
                style={{ 
                  width: '100%',
                  minHeight: '50px',
                  padding: `12px ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 500,
                  letterSpacing: '0',
                  cursor: (loading || !email.trim() || !email.includes('@') || !email.includes('.') || email.length < 5) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !email.trim() || !email.includes('@') || !email.includes('.') || email.length < 5) ? 0.7 : 1,
                  pointerEvents: (loading || !email.trim() || !email.includes('@') || !email.includes('.') || email.length < 5) ? 'auto' : 'auto',
                  transition: 'all 0.14s ease',
                }}
              >
                {loading ? 'Loading...' : 'Continue'}
              </motion.button>
              
              {!user && (
                <p style={{ 
                  textAlign: 'center',
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  marginTop: tokens.spacing[8],
                }}>
                  Already have an account?{" "}
                  <Link href="/login" style={{ color: tokens.colors.textPrimaryOnDark, textDecoration: 'underline' }}>
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 'name' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[8],
              }}>
                What&apos;s your name?
              </h1>
              <p style={{ 
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
              }}>
                Step {stepNumber} of 4
              </p>
            </div>

            {error && (
              <div style={{
                padding: tokens.spacing[16],
                borderRadius: tokens.radii.input,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                ...tokens.typography.label,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
              <div>
                <label style={{ 
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleNext()
                    }
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: `10px ${tokens.spacing[14]}`,
                    borderRadius: tokens.radii.input,
                    background: tokens.colors.pillUnselected,
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    boxShadow: tokens.shadows.pillUnselected,
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: tokens.spacing[16], 
              marginTop: tokens.spacing[20],
              position: 'relative',
              zIndex: 10,
            }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  minHeight: '50px',
                  padding: `12px ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={loading || !name.trim()}
                style={{ 
                  flex: 1, 
                  minHeight: '50px',
                  padding: `12px ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: (loading || !name.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !name.trim()) ? 0.7 : 1,
                }}
              >
                {loading ? 'Loading...' : 'Continue'}
              </motion.button>
            </div>
          </div>
        )}

        {currentStep === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[8],
              }}>
                Create a password
              </h1>
              <p style={{ 
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
              }}>
                Step {stepNumber} of 4
              </p>
            </div>

            {error && (
              <div style={{
                padding: tokens.spacing[16],
                borderRadius: tokens.radii.input,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                ...tokens.typography.label,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
              <div>
                <label style={{ 
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: `10px ${tokens.spacing[14]}`,
                    borderRadius: tokens.radii.input,
                    background: tokens.colors.pillUnselected,
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    boxShadow: tokens.shadows.pillUnselected,
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ 
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: tokens.spacing[8],
                  display: 'block',
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password.length >= 6 && validatePasswordMatch()) {
                      handleNext()
                    }
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: `10px ${tokens.spacing[14]}`,
                    borderRadius: tokens.radii.input,
                    background: tokens.colors.pillUnselected,
                    border: passwordMatchError ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                    color: tokens.colors.textOnPill,
                    boxShadow: tokens.shadows.pillUnselected,
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                />
                {passwordMatchError && (
                  <p style={{ 
                    ...tokens.typography.label,
                    color: '#FCA5A5',
                    marginTop: tokens.spacing[4],
                    margin: 0,
                  }}>
                    {passwordMatchError}
                  </p>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: tokens.spacing[16], 
              marginTop: tokens.spacing[20],
              position: 'relative',
              zIndex: 10,
            }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  minHeight: '50px',
                  padding: `12px ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={loading || password.length < 6 || !!passwordMatchError}
                style={{ 
                  flex: 1, 
                  minHeight: '50px',
                  padding: `12px ${tokens.spacing[16]}`,
                  borderRadius: tokens.radii.button,
                  background: tokens.colors.pillUnselected,
                  border: 'none',
                  color: tokens.colors.textOnPill,
                  boxShadow: tokens.shadows.pillUnselected,
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: (loading || password.length < 6 || !!passwordMatchError) ? 'not-allowed' : 'pointer',
                  opacity: (loading || password.length < 6 || !!passwordMatchError) ? 0.7 : 1,
                }}
              >
                {loading ? 'Loading...' : 'Continue'}
              </motion.button>
            </div>
          </div>
        )}

        {currentStep === 'interests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing, paddingBottom: '120px' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[8],
              }}>
                Select your interests
              </h1>
              <p style={{ 
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
              }}>
                Step {stepNumber} of 4 • {selectedInterests.length} selected
              </p>
            </div>

            {error && (
              <div style={{
                padding: tokens.spacing[16],
                borderRadius: tokens.radii.input,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                ...tokens.typography.label,
              }}>
                {error}
              </div>
            )}

            <div style={{ 
              maxHeight: '50vh', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.layout.elementSpacing,
            }}>
              {categories.map((category) => {
                const categoryInterests = INTERESTS.filter(i => i.category === category)
                if (categoryInterests.length === 0) return null
                
                return (
                  <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
                    <h3 style={{ 
                      ...tokens.typography.label,
                      color: tokens.colors.textPrimaryOnDark,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {category}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing[12] }}>
                      {categoryInterests.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id)
                        return (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() => handleInterestToggle(interest.id)}
                            disabled={loading}
                            style={{
                              height: '40px',
                              padding: `10px ${tokens.spacing[14]}`,
                              borderRadius: tokens.radii.pill,
                              background: isSelected ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
                              border: 'none',
                              color: isSelected ? tokens.colors.textOnPill : tokens.colors.textOnPill,
                              boxShadow: isSelected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
                              fontSize: '13px',
                              fontWeight: isSelected ? 500 : 400,
                              letterSpacing: '0',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.5 : 1,
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                              transition: 'all 0.14s ease',
                            }}
                          >
                            {interest.emoji && <span style={{ marginRight: tokens.spacing[8] }}>{interest.emoji}</span>}
                            {interest.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: tokens.spacing[16], marginTop: tokens.layout.elementSpacing }}>
              <Button
                onClick={handleBack}
                variant="secondary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleNext}
                variant="primary"
                disabled={loading || selectedInterests.length === 0}
                style={{ flex: 1 }}
              >
                {loading ? "Saving..." : selectedInterests.length === 0 ? "Select at least 1" : `Continue (${selectedInterests.length})`}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: tokens.spacing[16] }}>📧</div>
            <h1 style={{ 
              ...tokens.typography.title,
              color: tokens.colors.textPrimaryOnDark,
              margin: 0,
              marginBottom: tokens.spacing[8],
            }}>
              Check your email
            </h1>
            <p style={{ 
              ...tokens.typography.body,
              color: tokens.colors.textSecondary,
              margin: 0,
              marginBottom: tokens.layout.elementSpacing,
            }}>
              We sent a verification link to <strong>{user?.email || email}</strong>
            </p>
            <p style={{ 
              ...tokens.typography.label,
              color: tokens.colors.textSecondary,
              margin: 0,
              marginBottom: tokens.layout.sectionSpacing,
            }}>
              Click the link in the email to verify your account.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[16] }}>
              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const emailToUse = user?.email || email
                    if (!emailToUse) {
                      alert('No email address found.')
                      setLoading(false)
                      return
                    }

                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: emailToUse,
                      options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                      },
                    })

                    if (error) {
                      alert(`Error: ${error.message}`)
                    } else {
                      alert('Verification email sent!')
                    }
                  } catch (err: any) {
                    alert(`Error: ${err.message || 'Failed to resend email'}`)
                  } finally {
                    setLoading(false)
                  }
                }}
                variant="secondary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? "Sending..." : "Resend Email"}
              </Button>

              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.user?.email_confirmed_at) {
                      const response = await fetch(`/api/users?userId=${session.user.id}`)
                      const data = await response.json()
                      
                      if (data.success && data.data) {
                        const hasName = data.data.name
                        const hasInterests = data.data.interests && data.data.interests.length > 0
                        
                        if (hasName && hasInterests) {
                          clearOnboardingData()
                          router.push('/vibe')
                        } else if (hasName) {
                          setCurrentStep('interests')
                          if (data.data.interests) setSelectedInterests(data.data.interests)
                        } else {
                          setCurrentStep('name')
                        }
                      } else {
                        setCurrentStep('name')
                      }
                    } else {
                      alert('Email not verified yet. Please check your email and click the verification link.')
                    }
                  } catch (err) {
                    alert('Error checking verification. Please try again.')
                  } finally {
                    setLoading(false)
                  }
                }}
                variant="primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                I&apos;ve Verified My Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        background: tokens.colors.backgroundApp, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
