"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useAuth } from "@/hooks/use-auth"
import { tokensV2 } from "@/lib/design-tokens-v2"
import { checkV2UserStatus } from "@/lib/user-helpers-v2"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()

  // Redirect if user is already authenticated
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      return
    }
      
    async function checkAndRedirect() {
      if (!user) return
      
      try {
        const userId = user.id
        const status = await checkV2UserStatus(userId)
        
        if (status.needsOnboarding) {
          router.replace('/onboarding-v2')
          return
        }
        
        router.replace('/home-v2')
      } catch (error) {
        console.error('[LoginPage] Error checking user status:', error)
        router.replace("/onboarding-v2")
      }
    }

    checkAndRedirect()
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        const userId = (result as any).data?.user?.id || user?.id
        if (!userId) {
          router.replace("/onboarding-v2")
          return
        }
            
        // Ensure user record exists
        try {
          await fetch(`/api/users?userId=${userId}`, {
            method: 'GET',
            cache: 'no-store',
          })
        } catch (error) {
          console.error('[LoginPage] Error ensuring user record:', error)
        }
            
        try {
          const status = await checkV2UserStatus(userId)
          
          if (status.needsOnboarding) {
            router.replace('/onboarding-v2')
            return
          }
          
          router.replace('/home-v2')
        } catch (err) {
          console.error('[LoginPage] Error checking onboarding:', err)
          router.replace("/onboarding-v2")
        }
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (user && !authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const isValid = email.trim() !== '' && email.includes('@') && email.includes('.') && password.length > 0

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokensV2.spacing[24],
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[20],
      }}>
        <div>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['2xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[8],
            textAlign: 'center',
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: tokensV2.typography.fontSize.base,
            color: tokensV2.colors.textSecondary,
            margin: 0,
            textAlign: 'center',
          }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[16] }}>
          {error && (
            <div style={{
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: tokensV2.typography.fontSize.sm,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[16] }}>
            <div>
              <label style={{
                fontSize: tokensV2.typography.fontSize.sm,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                color: tokensV2.colors.textSecondary,
                marginBottom: tokensV2.spacing[8],
                display: 'block',
              }}>
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label style={{
                fontSize: tokensV2.typography.fontSize.sm,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                color: tokensV2.colors.textSecondary,
                marginBottom: tokensV2.spacing[8],
                display: 'block',
              }}>
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[12] }}>
            <AnimatedButton
              type="submit"
              disabled={!isValid || loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </AnimatedButton>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokensV2.spacing[8],
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: tokensV2.typography.fontSize.sm,
                color: tokensV2.colors.textSecondary,
                margin: 0,
              }}>
                Don&apos;t have an account?{" "}
                <Link href="/onboarding-v2" style={{ 
                  color: tokensV2.colors.accentSky, 
                  textDecoration: 'underline' 
                }}>
                  Create account
                </Link>
              </p>
              <Link 
                href="/auth/reset-password" 
                style={{ 
                  fontSize: tokensV2.typography.fontSize.sm,
                  color: tokensV2.colors.textSecondary,
                  textDecoration: 'underline',
                }}
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
