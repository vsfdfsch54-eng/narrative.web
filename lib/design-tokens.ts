/**
 * Narrative Design Tokens
 * Midnight-black + soft-white pill theme with perfect alignment
 */

export const tokens = {
  colors: {
    backgroundApp: '#0B0B0D',
    backgroundSoft: '#0F0F11',
    surfacePrimary: '#FFFFFF',
    surfaceSecondary: '#F9F9FA',
    surfaceDivider: 'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    borderMedium: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#D3D3D6',
    textMuted: '#9A9AA1',
    textDark: '#111111',
    accentBlue: '#4C6EF5',
    accentGreen: '#3BB47A',
    accentOrange: '#E3983C',
    accentPurple: '#6D5DEE',
    accentPink: '#C86DA5',
  },
  radii: {
    pill: '28px',
    card: '28px',
    button: '28px',
    input: '28px',
    popover: '16px',
    chip: '28px',
  },
  shadows: {
    card: '0 2px 6px rgba(0,0,0,0.20)',
    elevated: '0 4px 12px rgba(0,0,0,0.30)',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    title: {
      fontSize: '24px',
      lineHeight: 1.3,
      fontWeight: 600,
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
    28: '28px',
  },
} as const
