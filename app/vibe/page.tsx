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
      
      try {
        const { completed, apiError } = await checkOnboardingStatus(user.id)
        
        if (apiError) {
          // API error - allow access to prevent loops
          console.warn('[VibePage] API error checking onboarding, allowing access')
          return
        }
        
        if (!completed) {
          router.replace("/onboarding?step=email")
          return
        }
      } catch (error) {
        console.error('[VibePage] Error checking onboarding:', error)
        // Allow access on error to prevent loops
      }
    }

    checkOnboarding()
  }, [user, loading, router])

  const getUserId = () => {
    if (user?.id) return user.id
    return null
  }

  const handleSave = async () => {
    const userId = getUserId()
    
    if (!userId) {
      router.push("/")
      return
    }
    
    setSaving(true)
    
    try {
      const selectedVibeObj = VIBES.find(v => v.id === selectedVibe)
      const selectedTopicObj = TOPICS.find(t => t.id === selectedTopic)
      
      // Save vibe and topic to user profile
      const updates: any = {}
      
      if (selectedVibeObj) {
        updates.vibe = selectedVibeObj.label
        localStorage.setItem("selectedVibe", selectedVibeObj.id)
      }
      
      if (selectedTopicObj) {
        updates.topic = selectedTopicObj.label
        localStorage.setItem("selectedTopic", selectedTopicObj.id)
      }
      
      // Update user profile
      if (Object.keys(updates).length > 0) {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            ...updates,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to save preferences')
        }
      }
      
      // Navigate to match page
      router.push('/match')
    } catch (error) {
      console.error('[VibePage] Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: tokens.spacing[20],
        }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
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
        padding: `${tokens.spacing[20]} ${tokens.layout.paddingHorizontal}`,
      }}>
        <h1 style={{
          ...tokens.typography.heading,
          color: tokens.colors.textPrimaryOnDark,
          marginBottom: tokens.spacing[32],
        }}>
          Choose your vibe
        </h1>

        <div style={{ marginBottom: tokens.spacing[32] }}>
          <VibeSelectorHorizontal
            vibes={VIBES.map(v => ({ id: v.id, emoji: v.icon, label: v.label }))}
            selectedId={selectedVibe}
            onSelect={setSelectedVibe}
          />
        </div>

        <h2 style={{
          ...tokens.typography.heading,
          color: tokens.colors.textPrimaryOnDark,
          marginBottom: tokens.spacing[32],
        }}>
          Choose a topic
        </h2>

        <div style={{ marginBottom: tokens.spacing[40] }}>
          <TopicSelectorHorizontal
            topics={TOPICS}
            selectedId={selectedTopic}
            onSelect={setSelectedTopic}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: tokens.spacing[12],
          marginTop: 'auto',
          paddingTop: tokens.spacing[20],
        }}>
          <AnimatedButton
            onClick={() => router.push('/match')}
            style={{
              flex: 1,
              height: '52px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              color: tokens.colors.textPrimaryOnDark,
            }}
          >
            Skip
          </AnimatedButton>

          <AnimatedButton
            onClick={handleSave}
            disabled={saving || (!selectedVibe && !selectedTopic)}
            style={{
              flex: 1,
              height: '52px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : 'Continue'}
          </AnimatedButton>
        </div>
      </div>
    </AppShell>
  )
}
