"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { INTERESTS, INTEREST_CATEGORIES, getAllCategories } from "@/lib/interests"
import { PERSONALITY_QUESTIONS } from "@/lib/personality-questions"
import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { tokens } from "@/lib/design-tokens"

type Step = 'email' | 'name' | 'password' | 'interests' | 'personality' | 'verify'

function OnboardingContent() {
  const getInitialStep = (): Step => {
    if (typeof window === 'undefined') return 'email'
    const saved = localStorage.getItem('onboarding_step')
    if (saved && ['email', 'name', 'password', 'interests', 'personality', 'verify'].includes(saved)) {
      return saved as Step
    }
    return 'email'
  }

  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep)
  const [isRedirecting, setIsRedirecting] = useState(false) // Prevent redirect loops
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
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string | string[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onboarding_personality')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return {}
        }
      }
    }
    return {}
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
      localStorage.setItem('onboarding_personality', JSON.stringify(personalityAnswers))
    }
  }, [email, name, selectedInterests, personalityAnswers])

  const clearOnboardingData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_step')
      localStorage.removeItem('onboarding_email')
      localStorage.removeItem('onboarding_name')
      localStorage.removeItem('onboarding_interests')
      localStorage.removeItem('onboarding_personality')
    }
  }

  useEffect(() => {
    if (authLoading || !user || isRedirecting) return
    
    // Only check onboarding status if user is verified
    if (user.email_confirmed_at) {
      const checkComplete = async () => {
        try {
          const response = await fetch(`/api/users?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const hasName = data.data.name && data.data.name.trim() !== ''
            const hasInterests = data.data.interests && data.data.interests.length > 0
            
            // If user has name and interests, onboarding is complete - redirect to vibe
            if (hasName && hasInterests) {
              console.log('[Onboarding] ✅ User has name and interests, redirecting to /vibe')
              setIsRedirecting(true)
              clearOnboardingData()
              router.push('/vibe')
              return
            }
            
            // Only set email from user if email field is empty (don't override user's manual input)
            if (user.email && !email) setEmail(user.email)
            if (data.data.name) setName(data.data.name)
            if (data.data.interests) setSelectedInterests(data.data.interests)
            
            // Determine which step to show based on what's missing
            if (!hasName) {
              console.log('[Onboarding] Missing name, showing name step')
              setCurrentStep('name')
            } else if (!hasInterests) {
              console.log('[Onboarding] Missing interests, showing interests step')
              setCurrentStep('interests')
            } else {
              // Has name and interests, show personality step (optional)
              console.log('[Onboarding] Has name and interests, showing personality step (optional)')
              setCurrentStep('personality')
            }
          } else {
            // User not found in database - start from name step
            console.log('[Onboarding] User not found in database, starting from name step')
            if (user.email && !email) setEmail(user.email)
            setCurrentStep('name')
          }
        } catch (err) {
          console.error('[Onboarding] Error checking onboarding:', err)
          // On error, start from name step
          if (user.email && !email) setEmail(user.email)
          setCurrentStep('name')
        }
      }
      checkComplete()
    }
  }, [user, authLoading, router, email, isRedirecting])

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
              setIsRedirecting(true)
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
      setCurrentStep('personality')
    } else if (currentStep === 'personality') {
      // Validate all questions are answered
      const allAnswered = PERSONALITY_QUESTIONS.every(q => {
        const answer = personalityAnswers[q.id]
        if (q.id === 'social_intention') {
          return Array.isArray(answer) && answer.length > 0
        }
        return !!answer
      })
      if (!allAnswered) {
        setError("Please answer all personality questions")
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
    } else if (currentStep === 'personality') {
      setCurrentStep('interests')
    }
  }

  const handlePersonalityAnswer = (questionId: string, answer: string | string[]) => {
    setPersonalityAnswers(prev => {
      // Handle multi-select for social_intention
      if (questionId === 'social_intention') {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] : []
        const answerValue = Array.isArray(answer) ? answer[0] : answer
        
        // Toggle selection
        if (currentAnswers.includes(answerValue)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(a => a !== answerValue)
          }
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, answerValue]
          }
        }
      }
      
      // Single select for other questions
      return {
        ...prev,
        [questionId]: answer
      }
    })
    if (error) setError("")
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

    // Validate personality answers if on personality step
    if (currentStep === 'personality') {
      const allAnswered = PERSONALITY_QUESTIONS.every(q => personalityAnswers[q.id])
      if (!allAnswered) {
        setError("Please answer all personality questions")
        return
      }
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
          // Create user in database immediately after signup
          console.log('[Onboarding] Creating user in database...')
          const userResponse = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              name: name.trim(),
              interests: selectedInterests
            })
          })

          const userData = await userResponse.json()
          
          if (!userData.success) {
            console.error('[Onboarding] ❌ Failed to create user:', userData.error)
            setError(`Failed to create user account: ${userData.error || 'Unknown error'}. Please try again.`)
            setLoading(false)
            return
          }

          console.log('[Onboarding] ✅ User created in database:', userData.data?.id)

          // Generate personality profile if we have answers
          if (Object.keys(personalityAnswers).length > 0) {
            console.log('[Onboarding] Generating personality profile...')
            try {
              const personalityResponse = await fetch('/api/personality/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  questionnaireAnswers: personalityAnswers,
                  interests: selectedInterests,
                })
              })

              const personalityData = await personalityResponse.json()
              
              if (!personalityData.success) {
                console.error('[Onboarding] ⚠️ Personality generation failed:', personalityData.error)
                // Don't fail the entire flow - user can still proceed without personality
              } else {
                console.log('[Onboarding] ✅ Personality profile generated successfully')
              }
            } catch (personalityError) {
              console.error('[Onboarding] ⚠️ Personality generation error:', personalityError)
              // Don't fail the entire flow
            }
          }
        } catch (userError: any) {
          console.error('[Onboarding] ❌ Error creating user:', userError)
          setError(`Failed to complete setup: ${userError.message || 'Unknown error'}. Please try again.`)
          setLoading(false)
          return
        }
      }

      // After signup, check if user was created with name and interests
      // If so, redirect to vibe immediately (personality is optional)
      if (result.data.user?.email_confirmed_at && result.data.user?.id) {
        const userId = result.data.user.id
        // User is already verified, check if onboarding is complete
        const checkOnboardingStatus = async () => {
          try {
            const checkResponse = await fetch(`/api/users?userId=${userId}`)
            const checkData = await checkResponse.json()
            
            if (checkData.success && checkData.data) {
              const hasName = checkData.data.name && checkData.data.name.trim() !== ''
              const hasInterests = checkData.data.interests && checkData.data.interests.length > 0
              
              if (hasName && hasInterests) {
                // Onboarding complete - go to vibe
                console.log('[Onboarding] ✅ Signup complete with name and interests, redirecting to /vibe')
                setIsRedirecting(true)
                clearOnboardingData()
                setLoading(false)
                router.push('/vibe')
                return
              }
            }
          } catch (err) {
            console.error('[Onboarding] Error checking onboarding status after signup:', err)
          }
          
          // If not complete, continue to verification step
          setLoading(false)
          setCurrentStep('verify')
        }
        
        checkOnboardingStatus()
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

      // Validate personality answers
      const allAnswered = PERSONALITY_QUESTIONS.every(q => {
        const answer = personalityAnswers[q.id]
        if (q.id === 'social_intention') {
          return Array.isArray(answer) && answer.length > 0
        }
        return !!answer
      })
      if (!allAnswered) {
        setError("Please answer all personality questions")
        setLoading(false)
        return
      }
      
      const userResponse = await fetch(`/api/users?userId=${user.id}`)
      const userData = await userResponse.json()
      
      const existingName = userData.success && userData.data?.name 
        ? userData.data.name 
        : name.trim() || user.email?.split('@')[0] || 'User'
      
      // Save user data
      const userUpdateResponse = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: existingName,
          interests: selectedInterests
        })
      })

      const userUpdateData = await userUpdateResponse.json()
      
      if (!userUpdateData.success) {
        setError(userUpdateData.error || "Failed to save user data. Please try again.")
        setLoading(false)
        return
      }

      // Ensure user exists in database (create if needed)
      console.log('[Onboarding] Ensuring user exists in database...')
      let userVerified = false
      for (let attempt = 0; attempt < 5; attempt++) {
        // First check if user exists
        const checkResponse = await fetch(`/api/users?userId=${user.id}`)
        const checkData = await checkResponse.json()
        
        if (checkData.success && checkData.data) {
          userVerified = true
          console.log('[Onboarding] ✅ User exists in database')
          break
        }
        
        // If user doesn't exist, try to create them
        if (!checkData.success || checkData.error === 'User not found') {
          console.log(`[Onboarding] User not found, creating (attempt ${attempt + 1})...`)
          const createResponse = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              name: name.trim() || user.email?.split('@')[0] || 'User',
              interests: selectedInterests
            })
          })
          const createData = await createResponse.json()
          if (createData.success) {
            userVerified = true
            console.log('[Onboarding] ✅ User created in database')
            break
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      if (!userVerified) {
        setError("Failed to create user account. Please try signing up again.")
        setLoading(false)
        return
      }

      // Generate personality profile
      console.log('[Onboarding] Generating personality profile...')
      
      // First, test if OpenAI API key is accessible
      try {
        const testResponse = await fetch('/api/test-openai')
        const testData = await testResponse.json()
        if (!testData.success) {
          console.error('[Onboarding] ❌ OpenAI API key test failed:', testData)
          setError(`OpenAI API key issue: ${testData.error}\n\n${testData.details || ''}\n\nPlease check your .env.local file and restart your dev server.`)
          setLoading(false)
          return
        }
        console.log('[Onboarding] ✅ OpenAI API key test passed')
      } catch (testError) {
        console.error('[Onboarding] Error testing OpenAI key:', testError)
        // Continue anyway - might be a network issue
      }
      
      // Generate personality profile (optional - don't block if it fails)
      if (Object.keys(personalityAnswers).length > 0) {
        console.log('[Onboarding] Generating personality profile (optional)...')
        try {
          const personalityResponse = await fetch('/api/personality/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              questionnaireAnswers: personalityAnswers,
              interests: selectedInterests,
            })
          })

          const personalityData = await personalityResponse.json()
          
          if (!personalityData.success) {
            console.warn('[Onboarding] ⚠️ Personality generation failed (optional):', personalityData.error)
            console.warn('[Onboarding] User can still proceed without personality profile')
            // Don't block - personality generation is optional
          } else {
            console.log('[Onboarding] ✅ Personality profile generated successfully')
          }
        } catch (personalityError: any) {
          console.warn('[Onboarding] ⚠️ Personality generation error (optional):', personalityError)
          // Don't block - personality generation is optional
        }
      }
      
      // Always proceed to vibe page, even if personality generation failed
      setIsRedirecting(true)
      clearOnboardingData()
      setLoading(false)
      router.push('/vibe')
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

  const stepNumber = currentStep === 'email' ? 1 : currentStep === 'name' ? 2 : currentStep === 'password' ? 3 : currentStep === 'interests' ? 4 : currentStep === 'personality' ? 5 : 6

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[8] }}>
                  <label style={{ 
                    ...tokens.typography.label,
                    color: tokens.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'block',
                  }}>
                    Email
                  </label>
                  {email && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("")
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('onboarding_email')
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: tokens.colors.textSecondary,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={async (e) => {
                    const newEmail = e.target.value
                    setEmail(newEmail)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('onboarding_email', newEmail)
                    }
                    
                    // If user has already signed up and changes email, sign them out
                    // so they can sign up with the new email
                    if (user && user.email && newEmail.trim() !== user.email.trim()) {
                      console.log('[Onboarding] Email changed after signup, signing out to allow new signup')
                      await supabase.auth.signOut()
                      // Clear onboarding data to start fresh
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('onboarding_step')
                        localStorage.removeItem('onboarding_name')
                        localStorage.removeItem('onboarding_interests')
                        localStorage.removeItem('onboarding_personality')
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email.trim() && email.includes('@') && email.includes('.') && email.length >= 5) {
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
                    cursor: loading ? 'not-allowed' : 'text',
                    opacity: loading ? 0.7 : 1,
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
              
              <Link 
                href="/"
                style={{ 
                  textAlign: 'center',
                  ...tokens.typography.label,
                  color: tokens.colors.textSecondary,
                  marginTop: tokens.spacing[8],
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                ← Back to Welcome
              </Link>
              
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

            <div style={{ 
              display: 'flex', 
              gap: tokens.spacing[16], 
              marginTop: tokens.layout.elementSpacing,
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
                disabled={loading || selectedInterests.length === 0}
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
                  cursor: (loading || selectedInterests.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (loading || selectedInterests.length === 0) ? 0.7 : 1,
                }}
              >
                {loading ? "Saving..." : selectedInterests.length === 0 ? "Select at least 1" : `Continue (${selectedInterests.length})`}
              </motion.button>
            </div>
          </div>
        )}

        {currentStep === 'personality' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.layout.sectionSpacing, paddingBottom: '120px' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                ...tokens.typography.title,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
                marginBottom: tokens.spacing[8],
              }}>
                Tell us about yourself
              </h1>
              <p style={{ 
                ...tokens.typography.label,
                color: tokens.colors.textSecondary,
                margin: 0,
              }}>
                Step {stepNumber} of 5 • Help us find your perfect match
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
              maxHeight: '60vh', 
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.layout.elementSpacing,
              paddingRight: tokens.spacing[8],
            }}>
              {PERSONALITY_QUESTIONS.map((question, questionIndex) => {
                const selectedAnswer = personalityAnswers[question.id]
                return (
                  <div key={question.id} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
                    <h3 style={{ 
                      ...tokens.typography.label,
                      color: tokens.colors.textPrimaryOnDark,
                      fontWeight: 600,
                      fontSize: '14px',
                      marginBottom: tokens.spacing[4],
                    }}>
                      {questionIndex + 1}. {question.question}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[10] }}>
                      {question.options.map((option) => {
                        // Handle multi-select for social_intention
                        const isSelected = question.id === 'social_intention'
                          ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option.value)
                          : selectedAnswer === option.value
                        
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handlePersonalityAnswer(question.id, option.value)}
                            disabled={loading}
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              padding: `12px ${tokens.spacing[16]}`,
                              borderRadius: tokens.radii.pill,
                              background: isSelected ? tokens.colors.pillSelected : tokens.colors.pillUnselected,
                              border: 'none',
                              color: tokens.colors.textOnPill,
                              boxShadow: isSelected ? tokens.shadows.pillSelected : tokens.shadows.pillUnselected,
                              fontSize: '14px',
                              fontWeight: isSelected ? 500 : 400,
                              textAlign: 'left',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.5 : 1,
                              transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                              transition: 'all 0.14s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: tokens.spacing[8],
                            }}
                          >
                            {option.emoji && <span style={{ fontSize: '20px' }}>{option.emoji}</span>}
                            <span style={{ fontWeight: isSelected ? 600 : 500 }}>
                              {option.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: tokens.spacing[16], 
              marginTop: tokens.layout.elementSpacing,
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
                disabled={loading || !PERSONALITY_QUESTIONS.every(q => {
                  const answer = personalityAnswers[q.id]
                  if (q.id === 'social_intention') {
                    return Array.isArray(answer) && answer.length > 0
                  }
                  return !!answer
                })}
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
                  cursor: (loading || !PERSONALITY_QUESTIONS.every(q => {
                    const answer = personalityAnswers[q.id]
                    if (q.id === 'social_intention') {
                      return Array.isArray(answer) && answer.length > 0
                    }
                    return !!answer
                  })) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !PERSONALITY_QUESTIONS.every(q => {
                    const answer = personalityAnswers[q.id]
                    if (q.id === 'social_intention') {
                      return Array.isArray(answer) && answer.length > 0
                    }
                    return !!answer
                  })) ? 0.7 : 1,
                }}
              >
                {loading ? "Generating your profile..." : PERSONALITY_QUESTIONS.every(q => {
                  const answer = personalityAnswers[q.id]
                  if (q.id === 'social_intention') {
                    return Array.isArray(answer) && answer.length > 0
                  }
                  return !!answer
                }) ? "Continue" : "Answer all questions"}
              </motion.button>
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
                          setIsRedirecting(true)
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
