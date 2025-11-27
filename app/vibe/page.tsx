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
  const [noMatchFound, setNoMatchFound] = useState(false)
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
  }, [user, loading, router])

  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }

  // Poll for match status and maintain active status
  const startPollingForMatch = async (userId: string) => {
    setMatching(true)
    setMatchStatus({ message: 'Finding your match...' })
    
    let pollCount = 0
    const minPolls = 60 // Minimum 2 minutes (60 polls * 2s = 120 seconds)
    const maxPolls = 120 // Maximum 4 minutes (120 polls * 2s = 240 seconds)
    let consecutiveNotInQueue = 0 // Track how many times we've seen "not in queue"
    const maxConsecutiveNotInQueue = 3 // Only stop if we see "not in queue" 3 times in a row (but only after minPolls)
    
    // Heartbeat: Update last_active in waiting_pool every 15 seconds
    // This keeps user in pool as long as tab is active
    // More frequent updates ensure users stay in pool if actively using the site
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
    }, 15000) // Every 15 seconds (more frequent to stay within 30s window)
    
    // Remove from waiting pool when tab goes to background
    // Aggressive: remove after 30 seconds of being hidden
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab went to background - remove from pool after 30 seconds
        // This ensures background tabs don't stay in pool
        setTimeout(async () => {
          if (document.hidden) {
            // Still hidden after 30 seconds - remove from pool
            console.log('[VibePage] Tab hidden for 30 seconds, removing from waiting pool')
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
        }, 30000) // 30 second delay
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
        // Trigger matchmaking processor more aggressively during polling
        // Every 3 polls (6 seconds), trigger matchmaking to ensure it runs
        if (pollCount % 3 === 0) {
          fetch('/api/matchmaking/process', {
            method: 'GET',
            cache: 'no-store',
          }).catch(() => {}) // Silently fail - best effort
        }
        
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
          console.log('[VibePage] ✅ Match found!', { otherUserId: data.otherUserId, matchId: data.match.id })
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          setMatching(false)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('beforeunload', handleBeforeUnload)
          router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
          return
        }
        
        if (data.success && data.inQueue) {
          // Reset counter - we're in queue
          consecutiveNotInQueue = 0
          // Update status with queue info
          setMatchStatus({
            queueCount: data.queueCount || 0,
            waitTime: data.waitTimeSeconds ? `${Math.floor(data.waitTimeSeconds / 60)}:${String(data.waitTimeSeconds % 60).padStart(2, '0')}` : undefined,
            message: data.estimatedWaitTime || (data.queueCount >= 2 ? 'Any moment now!' : 'Waiting for another user...'),
          })
        } else {
          // Not in queue - but don't stop immediately (might be a race condition)
          // Only check for consecutive failures after minimum polling time
          if (pollCount >= minPolls) {
            consecutiveNotInQueue++
            console.log(`[VibePage] Not in queue (attempt ${consecutiveNotInQueue}/${maxConsecutiveNotInQueue})`)
            
            // Only stop if we've seen "not in queue" multiple times in a row AND we've polled for at least 2 minutes
            if (consecutiveNotInQueue >= maxConsecutiveNotInQueue) {
              console.log('[VibePage] Not in queue after multiple checks - showing no match found')
              clearInterval(pollInterval)
              clearInterval(heartbeatInterval)
              setMatching(false)
              setNoMatchFound(true)
              document.removeEventListener('visibilitychange', handleVisibilityChange)
              window.removeEventListener('beforeunload', handleBeforeUnload)
              return
            }
          }
          
          // Continue polling - might be a temporary issue
          setMatchStatus({
            message: 'Checking match status...',
          })
        }
        
        // Stop polling after max attempts (4 minutes) - show no match found
        if (pollCount >= maxPolls) {
          console.log('[VibePage] Max polls reached (4 minutes) - showing no match found')
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          setMatching(false)
          setNoMatchFound(true)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('beforeunload', handleBeforeUnload)
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
    let inQueue = false
    
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
          setSaving(false)
          return
        }
        
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        // Immediate match - go to chat
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
        setSaving(false)
        return
      } else if (data.success && data.inQueue) {
        // In queue - start polling for match status
        // Don't set saving to false - let startPollingForMatch handle the UI state
        inQueue = true
        startPollingForMatch(userId)
        return // Exit early - don't set saving to false
      } else if (data.requiresActive) {
        // User is not active - show error message
        alert(data.error || 'You must be actively using the site to find matches. Please make sure your tab is open and active.')
        setSaving(false)
        return
      } else if (data.needsOnboarding) {
        router.push("/onboarding?step=email")
        setSaving(false)
        return
      } else {
        // Not matched and not in queue - still show matching overlay on vibe page
        // User was just added to queue, so start polling anyway
        // Don't redirect to /chat (which would redirect back to /vibe)
        console.log('[VibePage] Connect: Starting polling even if not confirmed in queue yet')
        inQueue = true
        startPollingForMatch(userId)
        return // Exit early - don't set saving to false
      }
    } catch (error: any) {
      // Check if error is about being inactive
      if (error.message?.includes('actively using') || error.message?.includes('requiresActive')) {
        alert('You must be actively using the site to find matches. Please make sure your tab is open and active.')
        setSaving(false)
        return
      }
      // On error, still try to show matching overlay
      // User might have been added to queue even if response failed
      console.error('[VibePage] Error connecting:', error)
      inQueue = true
      startPollingForMatch(userId)
      return // Exit early - don't set saving to false
    } finally {
      // Only set saving to false if we're not starting polling
      // (polling will handle its own state)
      if (!inQueue) {
        setSaving(false)
      }
    }
  }

  const handleSkip = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    let inQueue = false
    
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
          setSaving(false)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.matched && data.match && data.otherUserId) {
        router.push(`/chat/${data.otherUserId}?matchId=${data.match.id}`)
        setSaving(false)
        return
      } else if (data.success && data.inQueue) {
        // In queue - start polling for match status
        // Don't set saving to false - let startPollingForMatch handle the UI state
        inQueue = true
        startPollingForMatch(userId)
        return // Exit early - don't set saving to false
      } else {
        // Not matched and not in queue - still show matching overlay on vibe page
        // Don't redirect to /chat (which would redirect back to /vibe)
        // Instead, start polling anyway - user was just added to queue
        console.log('[VibePage] Skip: Starting polling even if not confirmed in queue yet')
        inQueue = true
        startPollingForMatch(userId)
        return // Exit early - don't set saving to false
      }
    } catch (error) {
      // On error, still try to show matching overlay
      // User might have been added to queue even if response failed
      console.error('[VibePage] Error skipping:', error)
      inQueue = true
      startPollingForMatch(userId)
      return // Exit early - don't set saving to false
    } finally {
      // Only set saving to false if we're not starting polling
      // (polling will handle its own state)
      if (!inQueue) {
        setSaving(false)
      }
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

  // Show "no match found" page after 2+ minutes with no match
  if (noMatchFound) {
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: tokens.spacing[20],
            maxWidth: tokens.layout.maxWidth,
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: tokens.spacing[8],
            }}>
              😔
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 600,
              color: tokens.colors.textPrimaryOnDark,
              marginBottom: tokens.spacing[8],
            }}>
              No match found
            </h2>
            <p style={{
              fontSize: '16px',
              color: tokens.colors.textSecondary,
              marginBottom: tokens.spacing[28],
              lineHeight: 1.5,
            }}>
              We couldn&apos;t find a match right now. Don&apos;t worry, try again and we&apos;ll keep looking!
            </p>
            <AnimatedButton
              onClick={() => {
                setNoMatchFound(false)
                setMatching(false)
                setMatchStatus(null)
                // Reset to vibe selection - user can try again
              }}
              size="large"
              fullWidth
            >
              Try Again
            </AnimatedButton>
          </div>
        </div>
      </AppShell>
    )
  }

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
