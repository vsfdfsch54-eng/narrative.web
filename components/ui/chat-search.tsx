"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"
import { tokens } from "@/lib/design-tokens"
import { Message } from "@/lib/types"

interface ChatSearchProps {
  messages: Message[]
  onMessageSelect?: (messageId: string) => void
}

export function ChatSearch({ messages, onMessageSelect }: ChatSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Message[]>([])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = messages.filter(msg =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(results)
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ background: tokens.colors.pillSelected, color: tokens.colors.textOnPill }}>
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <>
      {/* Search button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={{
          padding: tokens.spacing[8],
          borderRadius: tokens.radii.pill,
          background: 'transparent',
          border: 'none',
          color: tokens.colors.textPrimaryOnDark,
          cursor: 'pointer',
        }}
      >
        <Search style={{ width: '18px', height: '18px' }} />
      </motion.button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '20vh',
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              style={{
                width: '90%',
                maxWidth: '500px',
                maxHeight: '60vh',
                background: tokens.colors.pillUnselected,
                borderRadius: tokens.radii.input,
                boxShadow: tokens.shadows.pillUnselected,
                padding: tokens.spacing[20],
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing[16],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: `${tokens.spacing[12]} ${tokens.spacing[40]} ${tokens.spacing[12]} ${tokens.spacing[40]}`,
                    borderRadius: tokens.radii.input,
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: tokens.colors.textOnPill,
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                <Search style={{
                  position: 'absolute',
                  left: tokens.spacing[14],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: tokens.colors.textMuted,
                }} />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  style={{
                    position: 'absolute',
                    right: tokens.spacing[14],
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: tokens.spacing[4],
                    background: 'transparent',
                    border: 'none',
                    color: tokens.colors.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </motion.button>
              </div>

              {/* Search results */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing[12],
              }}>
                {searchQuery && searchResults.length === 0 && (
                  <p style={{
                    ...tokens.typography.body,
                    color: tokens.colors.textMuted,
                    textAlign: 'center',
                    padding: tokens.spacing[20],
                  }}>
                    No messages found
                  </p>
                )}

                {searchResults.map((message) => (
                  <motion.div
                    key={message.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onMessageSelect) {
                        onMessageSelect(message.id)
                      }
                      setIsOpen(false)
                    }}
                    style={{
                      padding: tokens.spacing[12],
                      borderRadius: tokens.radii.input,
                      background: 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{
                      ...tokens.typography.body,
                      margin: 0,
                      color: tokens.colors.textOnPill,
                    }}>
                      {highlightText(message.content, searchQuery)}
                    </p>
                    <p style={{
                      ...tokens.typography.label,
                      margin: 0,
                      marginTop: tokens.spacing[4],
                      fontSize: '11px',
                      color: tokens.colors.textMuted,
                    }}>
                      {message.timestamp.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

