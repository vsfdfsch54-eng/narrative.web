"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { tokens } from "@/lib/design-tokens"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface EmailStepProps {
  email: string
  onEmailChange: (email: string) => void
  onSubmit: (email: string) => Promise<void>
  loading: boolean
  error: string | null
  onBack?: () => void
}

export function EmailStep({ email, onEmailChange, onSubmit, loading, error, onBack }: EmailStepProps) {
  const [localEmail, setLocalEmail] = useState(email)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSubmit = () => {
    if (!localEmail.trim() || !localEmail.includes('@') || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    onEmailChange(localEmail)
    
    // Call onSubmit - navigation should happen immediately (non-blocking)
    onSubmit(localEmail).catch((error) => {
      console.error('[EmailStep] Submit error:', error)
      setIsSubmitting(false)
    })
    
    // Safety timeout: ALWAYS reset isSubmitting after 500ms
    // This prevents UI freeze even if navigation is delayed
    setTimeout(() => {
      setIsSubmitting(false)
    }, 500)
    
    // Fallback navigation check after 100ms
    // If router.replace() didn't work, use window.location.href
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/onboarding') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('step') !== 'name') {
          // Router didn't navigate, force it with window.location
          window.location.href = '/onboarding?step=name'
        }
      }
    }, 100)
  }

  const handleBackToWelcome = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // Sign out first to prevent redirect bounce
    await signOut()
    // Then navigate to welcome page
    router.push('/')
  }

  const isValid = localEmail.trim() !== '' && localEmail.includes('@') && localEmail.includes('.')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[20],
    }}>
      <div>
        <h1 style={{
          ...tokens.typography.title,
          color: tokens.colors.textPrimaryOnDark,
          margin: 0,
          marginBottom: tokens.spacing[8],
          textAlign: 'center',
        }}>
          What&apos;s your email?
        </h1>
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.textSecondary,
          margin: 0,
          textAlign: 'center',
        }}>
          We&apos;ll use this to create your account (you&apos;ll set a password next)
        </p>
      </div>

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
          <Input
            type="email"
            placeholder="you@example.com"
            value={localEmail}
            onChange={(e) => {
              const newEmail = e.target.value
              setLocalEmail(newEmail)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid && !isSubmitting) {
                handleSubmit()
              }
            }}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
        <AnimatedButton
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          style={{ width: '100%' }}
        >
          {isSubmitting ? 'Continuing...' : 'Continue'}
        </AnimatedButton>

        {onBack && (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            Back
          </AnimatedButton>
        )}

        <a
          href="/"
          onClick={handleBackToWelcome}
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
        </a>

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
      </div>
    </div>
  )
}

