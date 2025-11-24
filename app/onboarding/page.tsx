"use client"

import { Suspense } from "react"
import { OnboardingController } from "@/components/onboarding/OnboardingController"

function OnboardingContent() {
  return <OnboardingController />
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0B0B0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.60)' }}>Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
