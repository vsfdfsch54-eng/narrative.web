"use client"

import { motion } from 'framer-motion'
import { useOnboardingV2 } from '@/context/OnboardingV2Context'
import { tokensV2, animations } from '@/lib/design-tokens-v2'

export function PermissionsStep() {
  const { 
    state, 
    setNotificationsEnabled, 
    setCameraEnabled, 
    setMicrophoneEnabled, 
    nextStep, 
    previousStep 
  } = useOnboardingV2()

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraEnabled(true)
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      setCameraEnabled(false)
    }
  }

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicrophoneEnabled(true)
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      setMicrophoneEnabled(false)
    }
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
          Permissions
        </h1>
        <p style={{
          fontSize: tokensV2.typography.fontSize.sm,
          color: tokensV2.colors.textSecondary,
          margin: 0,
        }}>
          Enable permissions to get the most out of Narrative
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokensV2.spacing[16],
      }}>
        {/* Notifications */}
        <div style={{
          padding: tokensV2.spacing[16],
          borderRadius: tokensV2.borderRadius.medium,
          border: `1px solid ${tokensV2.colors.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[4],
            }}>
              Notifications
            </h3>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              Get notified about matches and messages
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={requestNotifications}
            style={{
              padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
              borderRadius: tokensV2.borderRadius.medium,
              background: state.notificationsEnabled ? tokensV2.colors.accentTeal : tokensV2.colors.borderLight,
              color: state.notificationsEnabled ? tokensV2.colors.textOnDark : tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.sm,
              fontWeight: tokensV2.typography.fontWeight.medium,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {state.notificationsEnabled ? 'Enabled' : 'Enable'}
          </motion.button>
        </div>

        {/* Camera */}
        <div style={{
          padding: tokensV2.spacing[16],
          borderRadius: tokensV2.borderRadius.medium,
          border: `1px solid ${tokensV2.colors.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[4],
            }}>
              Camera
            </h3>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              For video calls in Loops
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={requestCamera}
            style={{
              padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
              borderRadius: tokensV2.borderRadius.medium,
              background: state.cameraEnabled ? tokensV2.colors.accentTeal : tokensV2.colors.borderLight,
              color: state.cameraEnabled ? tokensV2.colors.textOnDark : tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.sm,
              fontWeight: tokensV2.typography.fontWeight.medium,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {state.cameraEnabled ? 'Enabled' : 'Enable'}
          </motion.button>
        </div>

        {/* Microphone */}
        <div style={{
          padding: tokensV2.spacing[16],
          borderRadius: tokensV2.borderRadius.medium,
          border: `1px solid ${tokensV2.colors.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontSize: tokensV2.typography.fontSize.base,
              fontWeight: tokensV2.typography.fontWeight.semibold,
              color: tokensV2.colors.textPrimary,
              margin: 0,
              marginBottom: tokensV2.spacing[4],
            }}>
              Microphone
            </h3>
            <p style={{
              fontSize: tokensV2.typography.fontSize.sm,
              color: tokensV2.colors.textSecondary,
              margin: 0,
            }}>
              For voice calls in Loops
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={requestMicrophone}
            style={{
              padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
              borderRadius: tokensV2.borderRadius.medium,
              background: state.microphoneEnabled ? tokensV2.colors.accentTeal : tokensV2.colors.borderLight,
              color: state.microphoneEnabled ? tokensV2.colors.textOnDark : tokensV2.colors.textPrimary,
              fontSize: tokensV2.typography.fontSize.sm,
              fontWeight: tokensV2.typography.fontWeight.medium,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {state.microphoneEnabled ? 'Enabled' : 'Enable'}
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: tokensV2.spacing[12], marginTop: tokensV2.spacing[8] }}>
        <motion.button
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
          whileTap={{ scale: 0.95 }}
          onClick={nextStep}
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
    </motion.div>
  )
}
