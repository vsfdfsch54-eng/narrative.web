"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export function InviteModal({ isOpen, onClose, currentUserId }: InviteModalProps) {
  const [onlineFriends, setOnlineFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !currentUserId) return

    async function loadOnlineFriends() {
      try {
        setLoading(true)
        const response = await fetch(`/api/friends/online?userId=${currentUserId}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Combine all tiers
            const allFriends = [
              ...(data.community || []),
              ...(data.innerCircle || []),
              ...(data.closeFriends || []),
            ]
            setOnlineFriends(allFriends)
          }
        }
      } catch (error) {
        console.error('[InviteModal] Error loading online friends:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOnlineFriends()
  }, [isOpen, currentUserId])

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
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: tokens.colors.backgroundApp,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: tokens.spacing[20],
              paddingBottom: `calc(${tokens.spacing[20]} + env(safe-area-inset-bottom, 0px))`,
              maxHeight: '80vh',
              overflowY: 'auto',
              zIndex: 9999,
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: tokens.spacing[20],
            }}>
              <h2 style={{
                ...tokens.typography.heading,
                color: tokens.colors.textPrimaryOnDark,
                margin: 0,
              }}>
                Invite Friends
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  padding: tokens.spacing[8],
                  borderRadius: tokens.radii.button,
                  background: 'transparent',
                  border: 'none',
                  color: tokens.colors.textPrimaryOnDark,
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </motion.button>
            </div>

            {/* Online Friends List */}
            {loading ? (
              <p style={{
                color: tokens.colors.textSecondary,
                textAlign: 'center',
                padding: tokens.spacing[32],
              }}>
                Loading...
              </p>
            ) : onlineFriends.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing[12],
              }}>
                {onlineFriends.map((friend) => (
                  <motion.button
                    key={friend.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // TODO: Implement invite logic
                      console.log('Invite friend:', friend.id)
                      onClose()
                    }}
                    style={{
                      width: '100%',
                      padding: tokens.spacing[16],
                      borderRadius: tokens.radii.button,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing[12],
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      position: 'relative',
                    }}>
                      <span>{friend.avatar || '👤'}</span>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#38B57A',
                        border: '2px solid #0B0B0D',
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        ...tokens.typography.body,
                        color: tokens.colors.textPrimaryOnDark,
                        margin: 0,
                        fontWeight: 500,
                      }}>
                        {friend.name || 'User'}
                      </p>
                      <p style={{
                        ...tokens.typography.label,
                        color: tokens.colors.textSecondary,
                        margin: 0,
                        marginTop: tokens.spacing[4],
                      }}>
                        Online
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p style={{
                color: tokens.colors.textSecondary,
                textAlign: 'center',
                padding: tokens.spacing[32],
              }}>
                No friends online right now
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

