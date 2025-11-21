/**
 * Narrative Design Tokens
 * Supabase UI + Vercel Geist inspired design system
 */

export const tokens = {
  colors: {
    backgroundApp: '#F5F5F7',
    surfaceCard: '#FFFFFF',
    textPrimary: '#050816',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    borderSubtle: '#E5E7EB',
    accentPrimary: '#3B82F6',
    accentSecondary: '#A855F7',
    accentSuccess: '#22C55E',
    accentWarning: '#F59E0B',
    accentDanger: '#EF4444',
  },
  radii: {
    card: '16px',
    button: '9999px',
    input: '9999px',
    popover: '16px',
  },
  shadows: {
    card: '0 4px 12px rgba(15,23,42,0.06)',
    elevated: '0 18px 45px rgba(15,23,42,0.18)',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    headingXL: {
      fontSize: '32px',
      lineHeight: 1.1,
      fontWeight: 600,
    },
    headingL: {
      fontSize: '24px',
      lineHeight: 1.2,
      fontWeight: 600,
    },
    headingM: {
      fontSize: '20px',
      lineHeight: 1.25,
      fontWeight: 600,
    },
    body: {
      fontSize: '16px',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    caption: {
      fontSize: '14px',
      lineHeight: 1.4,
      fontWeight: 400,
    },
  },
  spacing: {
    4: '4px',
    8: '8px',
    12: '12px',
    16: '16px',
    20: '20px',
    24: '24px',
    32: '32px',
    40: '40px',
  },
} as const

