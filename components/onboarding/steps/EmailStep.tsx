"use client"

import { useState } from "react"
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
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSubmit = async () => {
    if (!localEmail.trim() || !localEmail.includes('@')) {
      return
    }
    onEmailChange(localEmail)
    await onSubmit(localEmail)
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
              if (e.key === 'Enter' && isValid && !loading) {
                handleSubmit()
              }
            }}
            disabled={loading}
            autoFocus
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[12] }}>
        <AnimatedButton
          onClick={handleSubmit}
          disabled={!isValid || loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </AnimatedButton>

        {onBack && (
          <AnimatedButton
            variant="ghost"
            onClick={onBack}
            disabled={loading}
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

