/**
 * Narrative Design Tokens
 * Graphite, eggshell, minimal, sharp aesthetic inspired by Linear, Arc, Vercel, Notion, Superhuman
 */

export const tokens = {
  colors: {
    backgroundApp: '#F2F3F5',
    surfacePrimary: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
    surfaceTertiary: '#EDEEEF',
    textPrimary: '#1A1A1C',
    textSecondary: '#5A5F65',
    textMuted: '#7A7F85',
    borderSubtle: 'rgba(0,0,0,0.06)',
    borderMedium: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.10)',
    accentBlue: '#3A63F0',
    accentPurple: '#6E5DE7',
    accentGreen: '#3EB37F',
    accentOrange: '#E38C3C',
    accentPink: '#C45D96',
  },
  radii: {
    card: '12px',
    button: '8px',
    input: '8px',
    popover: '10px',
    chip: '8px',
  },
  shadows: {
    card: '0 2px 8px rgba(0,0,0,0.04)',
    elevated: '0 12px 30px rgba(0,0,0,0.12)',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    headingXL: {
      fontSize: '28px',
      lineHeight: 1.2,
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    headingL: {
      fontSize: '22px',
      lineHeight: 1.3,
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    headingM: {
      fontSize: '18px',
      lineHeight: 1.35,
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    body: {
      fontSize: '16px',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0',
    },
    caption: {
      fontSize: '14px',
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: '0',
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
