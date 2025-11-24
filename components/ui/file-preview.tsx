"use client"

import { motion } from "framer-motion"
import { Download, File } from "lucide-react"
import { tokens } from "@/lib/design-tokens"

interface FilePreviewProps {
  url: string
  fileName: string
  fileSize?: number
}

export function FilePreview({ url, fileName, fileSize }: FilePreviewProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.a
      href={url}
      download={fileName}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing[12],
        padding: tokens.spacing[12],
        borderRadius: tokens.radii.input,
        background: tokens.colors.pillUnselected,
        boxShadow: tokens.shadows.pillUnselected,
        textDecoration: 'none',
        color: tokens.colors.textOnPill,
        marginTop: tokens.spacing[8],
        cursor: 'pointer',
      }}
    >
      <div style={{
        padding: tokens.spacing[8],
        borderRadius: tokens.radii.pill,
        background: 'rgba(255,255,255,0.1)',
      }}>
        <File style={{ width: '20px', height: '20px' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          ...tokens.typography.body,
          margin: 0,
          marginBottom: tokens.spacing[4],
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </p>
        {fileSize && (
          <p style={{
            ...tokens.typography.label,
            margin: 0,
            fontSize: '11px',
            color: tokens.colors.textMuted,
          }}>
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <Download style={{ width: '16px', height: '16px' }} />
    </motion.a>
  )
}

