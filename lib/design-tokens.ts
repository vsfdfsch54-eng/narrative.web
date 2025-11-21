/**
 * Narrative Design Tokens
 * Pure Black Background + Darker Eggshell White Pills
 */

export const tokens = {
  colors: {
    backgroundApp: '#0B0B0D',
    pillUnselected: '#E5E5E7',
    pillSelected: '#D8D8DB',
    textOnPill: '#000000',
    textPrimaryOnDark: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.60)',
    textMuted: 'rgba(0,0,0,0.45)',
    accentBlue: '#4A6CF6',
    accentGreen: '#38B57A',
    accentOrange: '#E69A3B',
    accentPurple: '#7B6CF9',
    accentPink: '#C970A8',
  },
  radii: {
    pill: '18px',
    circle: '50%',
    button: '18px',
    input: '18px',
  },
  shadows: {
    pillUnselected: '0 2px 10px rgba(0,0,0,0.25)',
    pillSelected: '0 4px 16px rgba(0,0,0,0.28)',
    dock: '0 8px 28px rgba(0,0,0,0.45)',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    title: {
      fontSize: '22px',
      lineHeight: 1.25,
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    heading: {
      fontSize: '17px',
      lineHeight: 1.3,
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    body: {
      fontSize: '15px',
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0',
    },
    label: {
      fontSize: '13px',
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: '0',
    },
  },
  spacing: {
    4: '4px',
    8: '8px',
    10: '10px',
    12: '12px',
    14: '14px',
    16: '16px',
    18: '18px',
    20: '20px',
    22: '22px',
    28: '28px',
    32: '32px',
  },
  layout: {
    maxWidth: '430px',
    paddingHorizontal: '20px',
    topTitleSpacing: '32px',
    sectionSpacing: '28px',
    elementSpacing: '20px',
  },
} as const
