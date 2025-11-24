"use client"

import { motion } from "framer-motion"
import { Download, X } from "lucide-react"
import { useState } from "react"
import { tokens } from "@/lib/design-tokens"

interface ImagePreviewProps {
  url: string
  fileName?: string
  onClose?: () => void
}

export function ImagePreview({ url, fileName, onClose }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div style={{ position: 'relative', marginTop: tokens.spacing[8] }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'relative',
          borderRadius: tokens.radii.input,
          overflow: 'hidden',
          maxWidth: '300px',
          cursor: 'pointer',
        }}
        onClick={() => setIsFullscreen(true)}
      >
        <img
          src={url}
          alt={fileName || 'Image'}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: tokens.radii.input,
          }}
        />
        {fileName && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: tokens.spacing[8],
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            color: 'white',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {fileName}
          </div>
        )}
      </motion.div>

      {/* Fullscreen modal */}
      {isFullscreen && (
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
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing[20],
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreen(false)
            }}
            style={{
              position: 'absolute',
              top: tokens.spacing[20],
              right: tokens.spacing[20],
              padding: tokens.spacing[12],
              borderRadius: tokens.radii.pill,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </motion.button>

          <img
            src={url}
            alt={fileName || 'Image'}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: tokens.radii.input,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  )
}

