"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function ProfileBasicsStep() {
  const { state, setPhotoUrl, setAge, nextStep, previousStep } = useOnboardingV2()
  const [localAge, setLocalAge] = useState(state.age?.toString() || '')

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Upload to storage and get URL
      // For now, just create a local URL
      const url = URL.createObjectURL(file)
      setPhotoUrl(url)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ageNum = localAge ? parseInt(localAge, 10) : null
    if (ageNum && ageNum >= 13 && ageNum <= 120) {
      setAge(ageNum)
    }
    nextStep()
  }

  return (
    <motion.div
      {...animations.fadeUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[24],
      }}
    >
      <div>
        <h1 style={{
          fontSize: tokensV2.typography.fontSize['2xl'],
          fontWeight: tokensV2.typography.fontWeight.bold,
          color: tokensV2.colors.textPrimary,
          margin: 0,
          marginBottom: tokensV2.spacing[8],
        }}>
          Profile Basics
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Add a photo and confirm your age (optional)
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokensV2.spacing[20] }}>
        {/* Photo Upload */}
        <div>
          <label style={{
            display: 'block',
            fontSize: tokensV2.typography.fontSize.sm,
            fontWeight: tokensV2.typography.fontWeight.medium,
            color: tokensV2.colors.textPrimary,
            marginBottom: tokensV2.spacing[8],
          }}>
            Photo (Optional)
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokensV2.spacing[16],
          }}>
            {state.photoUrl ? (
              <img
                src={state.photoUrl}
                alt="Profile"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: tokensV2.borderRadius.full,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: tokensV2.borderRadius.full,
                background: tokensV2.colors.borderLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                👤
              </div>
            )}
            <label style={{
              padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderMedium}`,
              background: tokensV2.colors.backgroundWhite,
              color: tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.sm,
              fontWeight: tokensV2.typography.fontWeight.medium,
              cursor: 'pointer',
            }}>
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Age */}
        <div>
          <label style={{
            display: 'block',
            fontSize: tokensV2.typography.fontSize.sm,
            fontWeight: tokensV2.typography.fontWeight.medium,
            color: tokensV2.colors.textPrimary,
            marginBottom: tokensV2.spacing[8],
          }}>
            Age (Optional)
          </label>
          <input
            type="number"
            value={localAge}
            onChange={(e) => setLocalAge(e.target.value)}
            placeholder="Enter your age"
            min={13}
            max={120}
            style={{
              width: '100%',
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderLight}`,
              fontSize: tokensV2.typography.fontSize.base,
              background: tokensV2.colors.backgroundWhite,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: tokensV2.spacing[12], marginTop: tokensV2.spacing[8] }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={previousStep}
            style={{
              flex: 1,
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              border: `1px solid ${tokensV2.colors.borderMedium}`,
              background: tokensV2.colors.backgroundWhite,
              color: tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              padding: tokensV2.spacing[12],
              borderRadius: tokensV2.borderRadius.medium,
              background: tokensV2.gradients.primary,
              color: tokensV2.colors.textOnDark,
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Continue
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

