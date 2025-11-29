"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'
import { checkV2UserStatus } from '@/lib/user-helpers-v2'
import { Plus, Orbit } from 'lucide-react'
import { CreateLoopModal } from '@/components/ui/create-loop-modal'

export default function LoopsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loops, setLoops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Routing guard
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/onboarding-v2')
      return
    }

    const checkStatus = async () => {
      const status = await checkV2UserStatus(user.id)
      if (status.needsOnboarding) {
        router.replace('/onboarding-v2')
      }
    }

    checkStatus()
  }, [user, authLoading, router])

  // Load loops
  useEffect(() => {
    if (!user?.id) return

    const loadLoops = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/loops?userId=${user.id}`)
        const data = await response.json()

        if (data.success) {
          setLoops(data.data || [])
        }
      } catch (error) {
        console.error('[LoopsPage] Error loading loops:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLoops()
  }, [user?.id])

  const handleCreateLoop = async (data: { title: string; visibility: string; growthEnabled: boolean }) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: data.title,
          visibilityLayer: data.visibility,
          growthEnabled: data.growthEnabled,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload loops
        const loopsResponse = await fetch(`/api/loops?userId=${user.id}`)
        const loopsData = await loopsResponse.json()
        if (loopsData.success) {
          setLoops(loopsData.data || [])
        }
      } else {
        throw new Error(result.error || 'Failed to create loop')
      }
    } catch (error) {
      console.error('[LoopsPage] Error creating loop:', error)
      throw error
    }
  }

  const handleOpenLoop = (loopId: string) => {
    router.push(`/loops/${loopId}`)
  }

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: tokensV2.colors.backgroundEggshell,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: tokensV2.colors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[32]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{
            fontSize: tokensV2.typography.fontSize['3xl'],
            fontWeight: tokensV2.typography.fontWeight.bold,
            margin: 0,
          }}>
            Loops
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.full,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} color={tokensV2.colors.textOnDark} />
          </motion.button>
        </div>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          margin: 0,
          marginTop: tokensV2.spacing[8],
          opacity: 0.9,
        }}>
          Your persistent connections
        </p>
      </div>

      {/* Loops List */}
      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        {loops.length === 0 ? (
          <motion.div
            {...animations.fadeUp}
            style={{
              padding: tokensV2.spacing[48],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.colors.backgroundWhite,
              boxShadow: tokensV2.shadows.small,
              textAlign: 'center',
            }}
          >
            <Orbit size={48} color={tokensV2.colors.textMuted} style={{ marginBottom: tokensV2.spacing[16] }} />
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
              marginBottom: tokensV2.spacing[8],
            }}>
              No loops yet
            </p>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textMuted,
              margin: 0,
            }}>
              Start matching to create your first loop!
            </p>
          </motion.div>
        ) : (
          loops.map((loop) => (
            <motion.div
              key={loop.id}
              {...animations.fadeUp}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenLoop(loop.id)}
              style={{
                padding: tokensV2.spacing[24],
                borderRadius: tokensV2.borderRadius.medium,
                background: tokensV2.colors.backgroundWhite,
                boxShadow: tokensV2.shadows.small,
                cursor: 'pointer',
              }}
            >
              <h3 style={{
                fontSize: tokensV2.typography.fontSize.xl,
                fontWeight: tokensV2.typography.fontWeight.semibold,
                color: tokensV2.colors.textPrimary,
                margin: 0,
                marginBottom: tokensV2.spacing[8],
              }}>
                {loop.title}
              </h3>
              <p style={{
                fontSize: tokensV2.typography.fontSize.sm,
                color: tokensV2.colors.textSecondary,
                margin: 0,
              }}>
                {loop.visibility_layer} • Created {new Date(loop.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Loop Modal */}
      <CreateLoopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateLoop}
      />

      <NavbarV2 />
    </div>
  )
}

