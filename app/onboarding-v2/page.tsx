"use client"

import { OnboardingV2Provider, useOnboardingV2 } from '@/context/OnboardingV2Context'
import { EmailStep } from '@/components/onboarding-v2/steps/EmailStep'
import { PasswordStep } from '@/components/onboarding-v2/steps/PasswordStep'
import { NameStep } from '@/components/onboarding-v2/steps/NameStep'
import { QuestionsStep } from '@/components/onboarding-v2/steps/QuestionsStep'
import { InterestsStep } from '@/components/onboarding-v2/steps/InterestsStep'
import { CreateAccountStep } from '@/components/onboarding-v2/steps/CreateAccountStep'

function OnboardingV2Content() {
  const { state } = useOnboardingV2()

  const renderStep = () => {
    switch (state.step) {
      case 'email':
        return <EmailStep />
      case 'password':
        return <PasswordStep />
      case 'name':
        return <NameStep />
      case 'questions':
        return <QuestionsStep />
      case 'interests':
        return <InterestsStep />
      case 'create-account':
        return <CreateAccountStep />
      default:
        return <EmailStep />
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
