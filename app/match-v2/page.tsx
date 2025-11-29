"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { MatchmakingProvider, useMatchmaking } from '@/context/MatchmakingContext'
import { MoodStep } from '@/components/match-v2/MoodStep'
import { IntentionStep } from '@/components/match-v2/IntentionStep'
import { TopicStep } from '@/components/match-v2/TopicStep'
import { FindingStep } from '@/components/match-v2/FindingStep'
import { PreviewStep } from '@/components/match-v2/PreviewStep'
import { EphemeralChatStep } from '@/components/match-v2/EphemeralChatStep'
import { SwipeResultStep } from '@/components/match-v2/SwipeResultStep'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2 } from '@/lib/design-tokens-v2'

function MatchV2Content() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { context, reset } = useMatchmaking()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/onboarding-v2')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  const renderStep = () => {
    switch (context.state) {
      case 'mood':
        return <MoodStep />
      case 'intention':
        return <IntentionStep />
      case 'topic':
        return <TopicStep />
      case 'finding':
        return <FindingStep />
      case 'preview':
        return <PreviewStep />
      case 'ephemeral_chat':
        return <EphemeralChatStep />
      case 'swipe_result':
        return <SwipeResultStep />
      case 'messaging_only':
        // Should navigate to messaging-only page, not render here
        router.push(`/messaging-only/${context.matchSessionId}`)
        return null
      case 'matched':
        // Should navigate to loop, not render here
        router.push(`/loops?matched=${context.matchSessionId}`)
        return null
      case 'dissolved':
        return (
          <div style={{
            padding: tokensV2.spacing[24],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: tokensV2.spacing[24],
          }}>
            <div style={{ fontSize: '64px' }}>👋</div>
            <div>
              <h1 style={{
                fontSize: tokensV2.typography.fontSize['2xl'],
                fontWeight: tokensV2.typography.fontWeight.bold,
                color: tokensV2.colors.textPrimary,
                margin: 0,
                marginBottom: tokensV2.spacing[8],
                textAlign: 'center',
              }}>
                Match dissolved
              </h1>
              <p style={{
                fontSize: tokensV2.typography.fontSize.base,
                color: tokensV2.colors.textSecondary,
                margin: 0,
                textAlign: 'center',
              }}>
                You can try matching again
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                reset()
                router.push('/match-v2')
              }}
              style={{
                padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[24]}`,
                borderRadius: tokensV2.borderRadius.medium,
                background: tokensV2.gradients.primary,
                color: tokensV2.colors.textOnDark,
                fontSize: tokensV2.typography.fontSize.base,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </motion.button>
          </div>
        )
      default:
        return <MoodStep />
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      paddingBottom: '80px',
    }}>
      {renderStep()}
      <NavbarV2 />
    </div>
  )
}

export default function MatchV2Page() {
  return (
    <MatchmakingProvider>
      <MatchV2Content />
    </MatchmakingProvider>
  )
}

