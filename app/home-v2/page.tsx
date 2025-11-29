"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { NavbarV2 } from '@/components/ui/navbar-v2'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

const MOODS = [
  { id: 'happy', emoji: '😄', label: 'Happy' },
  { id: 'content', emoji: '🙂', label: 'Content' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
]

export default function HomeV2Page() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: tokensV2.colors.backgroundEggshell,
      paddingBottom: '80px', // Space for navbar
    }}>
      {/* Gradient Header */}
      <div style={{
        background: tokensV2.gradients.primary,
        padding: `${tokensV2.spacing[32]} ${tokensV2.spacing[24]}`,
        color: tokensV2.colors.textOnDark,
      }}>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['3xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          Welcome Back
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.base,
          margin: 0,
          opacity: 0.9,
        }}>
          Ready to connect?
        </p>
      </div>

      <div style={{
        padding: tokensV2.spacing[24],
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[32],
      }}>
        {/* Mood Quick Selector */}
        <section>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            How are you feeling?
          </h2>
          <div style={{
            display: 'flex',
            gap: tokensV2.spacing[12],
            overflowX: 'auto',
            paddingBottom: tokensV2.spacing[8],
          }}>
            {MOODS.map((mood) => (
              <motion.button
                key={mood.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood.id)}
                style={{
                  padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[24]}`,
                  borderRadius: tokensV2.borderRadius.full,
                  border: `2px solid ${selectedMood === mood.id ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                  background: selectedMood === mood.id ? tokensV2.gradients.subtle : tokensV2.colors.backgroundWhite,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokensV2.spacing[8],
                  whiteSpace: 'nowrap',
                  boxShadow: selectedMood === mood.id ? tokensV2.shadows.small : 'none',
                }}
              >
                <span style={{ fontSize: '24px' }}>{mood.emoji}</span>
                <span style={{
                  fontSize: tokensV2.typography.fontSize.base,
                  fontWeight: tokensV2.typography.fontWeight.medium,
                  color: tokensV2.colors.textPrimary,
                }}>
                  {mood.label}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Today's Intention */}
        <section>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            Today&apos;s Intention
          </h2>
          <div style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
          }}>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              What do you want to do today?
            </p>
          </div>
        </section>

        {/* AI Suggestions */}
        <section>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            AI Suggestions
          </h2>
          <div style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
          }}>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              Suggestions will appear here based on your preferences
            </p>
          </div>
        </section>

        {/* Quick Loop Access */}
        <section>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            Your Loops
          </h2>
          <div style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              No loops yet. Start matching to create your first loop!
            </p>
          </div>
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 style={{
            fontSize: tokensV2.typography.fontSize.xl,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            color: tokensV2.colors.textPrimary,
            margin: 0,
            marginBottom: tokensV2.spacing[16],
          }}>
            Upcoming Events
          </h2>
          <div style={{
            padding: tokensV2.spacing[24],
            borderRadius: tokensV2.borderRadius.medium,
            background: tokensV2.colors.backgroundWhite,
            boxShadow: tokensV2.shadows.small,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: tokensV2.typography.fontSize.base,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              No upcoming events
            </p>
          </div>
        </section>

        {/* Primary CTA: Find Someone */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/match-v2')}
          style={{
            width: '100%',
            padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[32]}`,
            borderRadius: tokensV2.borderRadius.full,
            background: tokensV2.gradients.primary,
            color: tokensV2.colors.textOnDark,
            fontSize: tokensV2.typography.fontSize.lg,
            fontWeight: tokensV2.typography.fontWeight.semibold,
            border: 'none',
            cursor: 'pointer',
            boxShadow: tokensV2.shadows.medium,
            marginTop: tokensV2.spacing[16],
          }}
        >
          Find Someone
        </motion.button>
      </div>

      <NavbarV2 />
    </div>
  )
}

