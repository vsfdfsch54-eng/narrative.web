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
import { Loader2 } from "lucide-react"

export default function VibePage() {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchStatus, setMatchStatus] = useState<{ queueCount?: number; waitTime?: string; message?: string } | null>(null)
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

  // Poll for match status and maintain active status
  const startPollingForMatch = async (userId: string) => {
    setMatching(true)
    setMatchStatus({ message: 'Finding your match...' })
    
    let pollCount = 0
    const maxPolls = 60 // Poll for up to 60 seconds (30 polls * 2s)
    
    // Heartbeat: Update last_active in waiting_pool every 30 seconds
    // This keeps user in pool as long as tab is active
    const heartbeatInterval = setInterval(async () => {
      // Only send heartbeat if tab is visible (not in background)
      if (!document.hidden) {
        try {
          await fetch('/api/connect', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, updateActivity: true }),
            cache: 'no-store',
          }).catch(() => {}) // Silently fail - heartbeat is best effort
        } catch (error) {
          // Ignore heartbeat errors
        }
      }
    }, 30000) // Every 30 seconds
    
    // Remove from waiting pool when tab goes to background
    // More aggressive: remove after 1 minute of being hidden (not 10 seconds)
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab went to background - remove from pool after 1 minute
        // This ensures background tabs don't stay in pool
        setTimeout(async () => {
          if (document.hidden) {
            // Still hidden after 1 minute - remove from pool
            console.log('[VibePage] Tab hidden for 1 minute, removing from waiting pool')
            try {
              await fetch('/api/connect', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
                cache: 'no-store',
              }).catch(() => {})
            } catch (error) {
              // Ignore errors
            }
          }
        }, 60000) // 1 minute delay (more aggressive than 10 seconds)
      } else {
        // Tab became visible again - update activity immediately
        try {
          await fetch('/api/connect', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, updateActivity: true }),
            cache: 'no-store',
          }).catch(() => {})
        } catch (error) {
          // Ignore errors
        }
      }
    }
    
    const handleBeforeUnload = async () => {
      // Tab is closing - remove from pool immediately
      try {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon('/api/connect', JSON.stringify({ userId, remove: true }))
      } catch (error) {
        // Fallback: try fetch (may not complete)
        fetch('/api/connect', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
          keepalive: true,
        }).catch(() => {})
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    const pollInterval = setInterval(async () => {
      pollCount++
      
      // Check if tab is hidden - if so, stop polling
      if (document.hidden) {
        clearInterval(pollInterval)
        clearInterval(heartbeatInterval)
        setMatching(false)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        return
      }
      
      try {
        const response = await fetch(`/api/connect/status?userId=${userId}`, {
          method: 'GET',
          cache: 'no-store',
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.matched && data.match && data.otherUserId) {
          // Match found!
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          setMatching(false)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('beforeunload', handleBeforeUnload)
          router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
          return
        }
        
        if (data.success && data.inQueue) {
          // Update status with queue info
          setMatchStatus({
            queueCount: data.queueCount || 0,
            waitTime: data.waitTimeSeconds ? `${Math.floor(data.waitTimeSeconds / 60)}:${String(data.waitTimeSeconds % 60).padStart(2, '0')}` : undefined,
            message: data.estimatedWaitTime || (data.queueCount >= 2 ? 'Any moment now!' : 'Waiting for another user...'),
          })
        } else {
          // Not in queue anymore but not matched - go to chat page
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          setMatching(false)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('beforeunload', handleBeforeUnload)
          router.push("/chat")
          return
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          setMatching(false)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('beforeunload', handleBeforeUnload)
          router.push("/chat")
        }
      } catch (error) {
        console.error('[VibePage] Error polling match status:', error)
        // Continue polling on error
      }
    }, 2000) // Poll every 2 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval)
      clearInterval(heartbeatInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
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
        // Immediate match - go to chat
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
      } else if (data.success && data.inQueue) {
        // In queue - start polling for match status
        startPollingForMatch(userId)
      } else if (data.requiresActive) {
        // User is not active - show error message
        alert(data.error || 'You must be actively using the site to find matches. Please make sure your tab is open and active.')
        setSaving(false)
        return
      } else if (data.needsOnboarding) {
        router.push("/onboarding?step=email")
      } else {
        router.push("/chat")
      }
    } catch (error: any) {
      // Check if error is about being inactive
      if (error.message?.includes('actively using') || error.message?.includes('requiresActive')) {
        alert('You must be actively using the site to find matches. Please make sure your tab is open and active.')
        setSaving(false)
        return
      }
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

  // Show matching overlay if in queue
  if (matching) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: tokens.spacing[20],
          textAlign: 'center',
        }}>
          <Loader2 className="h-12 w-12 animate-spin mb-6" style={{ color: tokens.colors.textPrimaryOnDark }} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: tokens.colors.textPrimaryOnDark,
            marginBottom: tokens.spacing[8],
          }}>
            Finding your match...
          </h2>
          {matchStatus && (
            <>
              {matchStatus.message && (
                <p style={{
                  fontSize: '16px',
                  color: tokens.colors.textSecondary,
                  marginBottom: tokens.spacing[4],
                }}>
                  {matchStatus.message}
                </p>
              )}
              {matchStatus.queueCount !== undefined && (
                <p style={{
                  fontSize: '14px',
                  color: tokens.colors.textSecondary,
                  marginBottom: tokens.spacing[4],
                }}>
                  {matchStatus.queueCount} {matchStatus.queueCount === 1 ? 'person' : 'people'} in queue
                </p>
              )}
              {matchStatus.waitTime && (
                <p style={{
                  fontSize: '14px',
                  color: tokens.colors.textSecondary,
                }}>
                  Waiting: {matchStatus.waitTime}
                </p>
              )}
            </>
          )}
        </div>
      </AppShell>
    )
  }

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
