/**
 * Narrative Design Tokens
 * OpenAI-inspired soft white, minimal, pill-based aesthetic
 */

export const tokens = {
  colors: {
    backgroundApp: '#F7F7F8',
    surfacePrimary: '#FFFFFF',
    surfaceSecondary: '#FAFAFB',
    surfaceDivider: '#E6E6E7',
    textPrimary: '#1A1A1C',
    textSecondary: '#66666B',
    textMuted: '#A0A0A4',
    borderSubtle: 'rgba(0,0,0,0.06)',
    borderMedium: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.10)',
    accentBlue: '#4C6EF5',
    accentGreen: '#3CB179',
    accentPurple: '#7A5AF8',
    accentOrange: '#E7883F',
    accentPink: '#C1628B',
  },
  radii: {
    pill: '24px',
    card: '24px',
    button: '24px',
    input: '24px',
    popover: '16px',
    chip: '24px',
  },
  shadows: {
    card: '0 2px 4px rgba(0,0,0,0.03)',
    elevated: '0 4px 12px rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    title: {
      fontSize: '24px',
      lineHeight: 1.3,
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    heading: {
      fontSize: '18px',
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: '0',
    },
    body: {
      fontSize: '16px',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0',
    },
    label: {
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
    28: '28px',
    32: '32px',
  },
} as const
