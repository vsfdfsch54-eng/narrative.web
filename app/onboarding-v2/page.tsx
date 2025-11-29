"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { OnboardingV2Provider, useOnboardingV2 } from '@/context/OnboardingV2Context'
import { WelcomeStep } from '@/components/onboarding-v2/steps/WelcomeStep'
import { CreateAccountStep } from '@/components/onboarding-v2/steps/CreateAccountStep'
import { NicknameStep } from '@/components/onboarding-v2/steps/NicknameStep'
import { ProfileBasicsStep } from '@/components/onboarding-v2/steps/ProfileBasicsStep'
import { MoodPreferencesStep } from '@/components/onboarding-v2/steps/MoodPreferencesStep'
import { IntentionPreferencesStep } from '@/components/onboarding-v2/steps/IntentionPreferencesStep'
import { TopicPreferencesStep } from '@/components/onboarding-v2/steps/TopicPreferencesStep'
import { HowItWorksStep } from '@/components/onboarding-v2/steps/HowItWorksStep'
import { PermissionsStep } from '@/components/onboarding-v2/steps/PermissionsStep'
import { YoureInStep } from '@/components/onboarding-v2/steps/YoureInStep'

function OnboardingV2Content() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state } = useOnboardingV2()

  // Redirect if already onboarded
  useEffect(() => {
    if (!authLoading && user) {
      // Check if user has completed V2 onboarding
      // TODO: Check schema_version === 'v2' in user record
      // For now, allow access
    }
  }, [user, authLoading])

  const renderStep = () => {
    switch (state.step) {
      case 'welcome':
        return <WelcomeStep />
      case 'create-account':
        return <CreateAccountStep />
      case 'nickname':
        return <NicknameStep />
      case 'profile-basics':
        return <ProfileBasicsStep />
      case 'mood-preferences':
        return <MoodPreferencesStep />
      case 'intention-preferences':
        return <IntentionPreferencesStep />
      case 'topic-preferences':
        return <TopicPreferencesStep />
      case 'how-it-works':
        return <HowItWorksStep />
      case 'permissions':
        return <PermissionsStep />
      case 'youre-in':
        return <YoureInStep />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004FFF 0%, #6D00FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
        padding: '32px',
      }}>
        {renderStep()}
      </div>
    </div>
  )
}

export default function OnboardingV2Page() {
  return (
    <OnboardingV2Provider>
      <OnboardingV2Content />
    </OnboardingV2Provider>
  )
}

