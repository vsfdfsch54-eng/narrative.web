"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VIBES, TOPICS } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/AppShell"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import { checkOnboardingStatus } from "@/lib/user-helpers"
import { VibeSelectorHorizontal } from "@/components/vibe/VibeSelectorHorizontal"
import { TopicSelectorHorizontal } from "@/components/vibe/TopicSelectorHorizontal"

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Routing guard: Check auth and onboarding status
  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      router.replace("/")
      return
    }

    async function checkOnboarding() {
      if (!user) return
      
      let justCompleted = false
      try {
        if (typeof window !== 'undefined') {
          const completedFlag = localStorage.getItem('onboarding_just_completed')
          const completedTimestamp = parseInt(localStorage.getItem('onboarding_completed_timestamp') || '0', 10)
          const timeSinceCompletion = Date.now() - completedTimestamp
          
          if (completedFlag === 'true' && timeSinceCompletion < 30000) {
            console.log('[VibePage] ✅ Onboarding just completed (flag set), allowing access')
            justCompleted = true
            localStorage.removeItem('onboarding_just_completed')
            localStorage.removeItem('onboarding_completed_timestamp')
          }
        }
      } catch (e) {
        console.warn('[VibePage] Could not check completion flag:', e)
      }
      
      if (justCompleted) {
        console.log('[VibePage] Allowing access - onboarding just completed')
        return
      }
      
      try {
        let result = null
        let apiError = false
        
        for (let attempt = 0; attempt < 5; attempt++) {
          result = await checkOnboardingStatus(user.id)
          
          if (result.apiError) {
            console.warn(`[VibePage] ⚠️ API error (attempt ${attempt + 1}/5)`)
            if (attempt < 4) {
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            }
            apiError = true
            break
          }
          
          if (result.completed) {
            break
          }
          
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        if (apiError || (result && result.apiError)) {
          console.warn('[VibePage] ⚠️ API error - allowing access to prevent redirect loop')
          return
        }

        if (result && !result.completed && !result.apiError) {
          console.log('[VibePage] Onboarding incomplete, redirecting to:', result.step)
          const redirectPath = `/onboarding?step=${result.step}`
          
          const currentPath = window.location.pathname
          if (currentPath === redirectPath) {
            console.warn('[VibePage] ⚠️ Already on target path or blocked by redirect guard, skipping redirect to prevent loop')
            return
          }
          
          router.replace(redirectPath)
          return
        }
      } catch (error) {
        console.error('[VibePage] Error checking onboarding:', error)
        console.warn('[VibePage] ⚠️ Error in checkOnboarding - allowing access to prevent redirect loop')
      }
    }

    checkOnboarding()
  }, [user, loading])

  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }

  const handleConnect = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      const selectedVibeObj = VIBES.find(v => v.id === selectedVibe)
      const selectedTopicObj = TOPICS.find(t => t.id === selectedTopic)
      
      if (selectedVibeObj) {
        localStorage.setItem("selectedVibe", selectedVibeObj.id)
      }
      if (selectedTopicObj) {
        localStorage.setItem("selectedTopic", selectedTopicObj.id)
      }
      
      if (selectedVibeObj) {
        fetch('/api/vibes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            vibe: selectedVibeObj.label 
          })
        }).catch(() => {})
      }
      
      const requestBody = { 
        userId,
        vibe: selectedVibeObj?.label || null,
        topic: selectedTopicObj?.label || null,
        timeframe: null,
      }
      
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        
        if (response.status === 404 && errorText.includes('User not found')) {
          router.push('/onboarding?step=email')
          return
        }
        
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else if (data.success && data.inQueue) {
        router.push("/chat")
      } else if (data.needsOnboarding) {
        router.push("/onboarding?step=email")
      } else {
        router.push("/chat")
      }
    } catch (error) {
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      const requestBody = { 
        userId,
        vibe: null,
        topic: null,
        timeframe: null,
      }
      
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 404 && errorText.includes('User not found')) {
          router.push('/onboarding?step=email')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else if (data.success && data.inQueue) {
        router.push("/chat")
      } else {
        router.push("/chat")
      }
    } catch (error) {
      router.push("/chat")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: tokens.colors.textSecondary }}>Loading...</p>
        </div>
      </AppShell>
    )
  }

  const vibesForSelector = VIBES.map(v => ({
    id: v.id,
    emoji: v.icon,
    label: v.label
  }))

  const topicsForSelector = TOPICS.map(t => ({
    id: t.id,
    emoji: t.icon,
    label: t.label
  }))

  const canConnect = selectedVibe !== null && selectedTopic !== null

  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: '100px'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
          paddingBottom: tokens.spacing[32],
        }}>
          <div style={{
            maxWidth: tokens.layout.maxWidth,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[32],
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: tokens.colors.textPrimaryOnDark,
                margin: '0 0 8px 0',
              }}>
                Choose your vibe
              </h1>
            </div>

            <VibeSelectorHorizontal
              vibes={vibesForSelector}
              selectedId={selectedVibe}
              onSelect={(id) => setSelectedVibe(id === selectedVibe ? null : id)}
            />

            <div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: tokens.colors.textPrimaryOnDark,
                margin: '0 0 8px 0',
              }}>
                Choose a topic
              </h2>
            </div>

            <TopicSelectorHorizontal
              topics={topicsForSelector}
              selectedId={selectedTopic}
              onSelect={(id) => setSelectedTopic(id === selectedTopic ? null : id)}
            />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing[12],
              marginTop: tokens.spacing[8],
            }}>
              <AnimatedButton
                onClick={handleConnect}
                disabled={!canConnect || saving}
                size="large"
                fullWidth
              >
                {saving ? "Finding someone..." : "Connect"}
              </AnimatedButton>
              <AnimatedButton
                variant="ghost"
                onClick={handleSkip}
                size="large"
                fullWidth
                disabled={saving}
              >
                Skip
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
