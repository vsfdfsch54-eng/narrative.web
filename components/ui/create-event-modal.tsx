"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { tokensV2 } from '@/lib/design-tokens-v2'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: {
    title: string
    description: string
    dateTime: string
    location: string
    visibility: string
    growthEnabled: boolean
    loopId?: string
  }) => Promise<void>
  availableLoops?: Array<{ id: string; title: string }>
}

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', description: 'Only you and invited participants' },
  { value: 'close-friends', label: 'Close Friends', description: 'Your close friends circle' },
  { value: 'inner-circle', label: 'Inner Circle', description: 'Your inner circle' },
  { value: 'community', label: 'Community', description: 'Your community' },
  { value: 'public', label: 'Public', description: 'Everyone can see' },
]

export function CreateEventModal({ isOpen, onClose, onCreate, availableLoops = [] }: CreateEventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [location, setLocation] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [growthEnabled, setGrowthEnabled] = useState(false)
  const [loopId, setLoopId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get default datetime (next hour)
  const getDefaultDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    now.setMinutes(0)
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dateTime) return

    setIsSubmitting(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        dateTime: new Date(dateTime).toISOString(),
        location: location.trim(),
        visibility,
        growthEnabled,
        loopId: loopId || undefined,
      })
      // Reset form
      setTitle('')
      setDescription('')
      setDateTime('')
      setLocation('')
      setVisibility('private')
      setGrowthEnabled(false)
      setLoopId('')
      onClose()
    } catch (error) {
      console.error('[CreateEventModal] Error creating event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: tokensV2.colors.overlayDark,
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokensV2.spacing[24],
            }}
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                borderRadius: tokensV2.borderRadius.large,
                background: tokensV2.colors.backgroundWhite,
                boxShadow: tokensV2.shadows.large,
                padding: tokensV2.spacing[32],
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokensV2.spacing[24],
              }}>
                <h2 style={{
                  fontSize: tokensV2.typography.fontSize['2xl'],
                  fontWeight: tokensV2.typography.fontWeight.bold,
                  color: tokensV2.colors.textPrimary,
                  margin: 0,
                }}>
                  Create Event
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    padding: tokensV2.spacing[8],
                    borderRadius: tokensV2.borderRadius.full,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} color={tokensV2.colors.textSecondary} />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Title Input */}
                <div style={{ marginBottom: tokensV2.spacing[20] }}>
                  <label style={{
                    display: 'block',
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    marginBottom: tokensV2.spacing[8],
                  }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Coffee Meetup"
                    required
                    style={{
                      width: '100%',
                      padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                      borderRadius: tokensV2.borderRadius.medium,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      fontSize: tokensV2.typography.fontSize.base,
                      color: tokensV2.colors.textPrimary,
                      background: tokensV2.colors.backgroundWhite,
                    }}
                  />
                </div>

                {/* Description Input */}
                <div style={{ marginBottom: tokensV2.spacing[20] }}>
                  <label style={{
                    display: 'block',
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    marginBottom: tokensV2.spacing[8],
                  }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this event about?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                      borderRadius: tokensV2.borderRadius.medium,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      fontSize: tokensV2.typography.fontSize.base,
                      color: tokensV2.colors.textPrimary,
                      background: tokensV2.colors.backgroundWhite,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Date & Time */}
                <div style={{ marginBottom: tokensV2.spacing[20] }}>
                  <label style={{
                    display: 'block',
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    marginBottom: tokensV2.spacing[8],
                  }}>
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={dateTime || getDefaultDateTime()}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                      borderRadius: tokensV2.borderRadius.medium,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      fontSize: tokensV2.typography.fontSize.base,
                      color: tokensV2.colors.textPrimary,
                      background: tokensV2.colors.backgroundWhite,
                    }}
                  />
                </div>

                {/* Location */}
                <div style={{ marginBottom: tokensV2.spacing[20] }}>
                  <label style={{
                    display: 'block',
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    marginBottom: tokensV2.spacing[8],
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Central Park, NYC"
                    style={{
                      width: '100%',
                      padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                      borderRadius: tokensV2.borderRadius.medium,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      fontSize: tokensV2.typography.fontSize.base,
                      color: tokensV2.colors.textPrimary,
                      background: tokensV2.colors.backgroundWhite,
                    }}
                  />
                </div>

                {/* Associated Loop (Optional) */}
                {availableLoops.length > 0 && (
                  <div style={{ marginBottom: tokensV2.spacing[20] }}>
                    <label style={{
                      display: 'block',
                      fontSize: tokensV2.typography.fontSize.sm,
                      fontWeight: tokensV2.typography.fontWeight.medium,
                      color: tokensV2.colors.textPrimary,
                      marginBottom: tokensV2.spacing[8],
                    }}>
                      Associate with Loop (Optional)
                    </label>
                    <select
                      value={loopId}
                      onChange={(e) => setLoopId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: `${tokensV2.spacing[12]} ${tokensV2.spacing[16]}`,
                        borderRadius: tokensV2.borderRadius.medium,
                        border: `1px solid ${tokensV2.colors.borderLight}`,
                        fontSize: tokensV2.typography.fontSize.base,
                        color: tokensV2.colors.textPrimary,
                        background: tokensV2.colors.backgroundWhite,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">None</option>
                      {availableLoops.map((loop) => (
                        <option key={loop.id} value={loop.id}>
                          {loop.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Visibility Selection */}
                <div style={{ marginBottom: tokensV2.spacing[20] }}>
                  <label style={{
                    display: 'block',
                    fontSize: tokensV2.typography.fontSize.sm,
                    fontWeight: tokensV2.typography.fontWeight.medium,
                    color: tokensV2.colors.textPrimary,
                    marginBottom: tokensV2.spacing[12],
                  }}>
                    Visibility
                  </label>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokensV2.spacing[8],
                  }}>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setVisibility(option.value)}
                        style={{
                          padding: tokensV2.spacing[16],
                          borderRadius: tokensV2.borderRadius.medium,
                          border: `1px solid ${visibility === option.value ? tokensV2.colors.gradientStart : tokensV2.colors.borderLight}`,
                          background: visibility === option.value
                            ? tokensV2.gradients.subtle
                            : tokensV2.colors.backgroundWhite,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          fontSize: tokensV2.typography.fontSize.base,
                          fontWeight: tokensV2.typography.fontWeight.semibold,
                          color: tokensV2.colors.textPrimary,
                          marginBottom: tokensV2.spacing[4],
                        }}>
                          {option.label}
                        </div>
                        <div style={{
                          fontSize: tokensV2.typography.fontSize.sm,
                          color: tokensV2.colors.textSecondary,
                        }}>
                          {option.description}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Growth Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: tokensV2.spacing[16],
                  borderRadius: tokensV2.borderRadius.medium,
                  background: tokensV2.colors.backgroundEggshell,
                  marginBottom: tokensV2.spacing[32],
                }}>
                  <div>
                    <div style={{
                      fontSize: tokensV2.typography.fontSize.base,
                      fontWeight: tokensV2.typography.fontWeight.medium,
                      color: tokensV2.colors.textPrimary,
                      marginBottom: tokensV2.spacing[4],
                    }}>
                      Growth Enabled
                    </div>
                    <div style={{
                      fontSize: tokensV2.typography.fontSize.sm,
                      color: tokensV2.colors.textSecondary,
                    }}>
                      Allow participants to invite others
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGrowthEnabled(!growthEnabled)}
                    style={{
                      width: '48px',
                      height: '28px',
                      borderRadius: tokensV2.borderRadius.full,
                      background: growthEnabled ? tokensV2.gradients.primary : tokensV2.colors.borderMedium,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}
                  >
                    <motion.div
                      animate={{
                        x: growthEnabled ? 20 : 4,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: tokensV2.colors.backgroundWhite,
                        boxShadow: tokensV2.shadows.small,
                      }}
                    />
                  </motion.button>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: tokensV2.spacing[12],
                }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[24]}`,
                      borderRadius: tokensV2.borderRadius.full,
                      border: `1px solid ${tokensV2.colors.borderLight}`,
                      background: tokensV2.colors.backgroundWhite,
                      color: tokensV2.colors.textPrimary,
                      fontSize: tokensV2.typography.fontSize.base,
                      fontWeight: tokensV2.typography.fontWeight.medium,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={!title.trim() || !dateTime || isSubmitting}
                    style={{
                      flex: 1,
                      padding: `${tokensV2.spacing[16]} ${tokensV2.spacing[24]}`,
                      borderRadius: tokensV2.borderRadius.full,
                      border: 'none',
                      background: tokensV2.gradients.primary,
                      color: tokensV2.colors.textOnDark,
                      fontSize: tokensV2.typography.fontSize.base,
                      fontWeight: tokensV2.typography.fontWeight.semibold,
                      cursor: !title.trim() || !dateTime || isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: !title.trim() || !dateTime || isSubmitting ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

