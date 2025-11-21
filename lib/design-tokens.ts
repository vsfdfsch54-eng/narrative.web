/**
 * Narrative Design Tokens
 * Pure Black Background + Floating White Pills/Circles
 */

export const tokens = {
  colors: {
    backgroundApp: '#0B0B0D',
    surfacePrimary: '#FFFFFF',
    textPrimary: '#000000',
    textPrimaryOnDark: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.60)',
    textMuted: 'rgba(0,0,0,0.40)',
    accentBlue: '#4A6CF6',
    accentGreen: '#38B57A',
    accentOrange: '#E69A3B',
    accentPurple: '#7B6CF9',
    accentPink: '#C970A8',
  },
  radii: {
    pill: '28px',
    circle: '50%',
    button: '28px',
    input: '28px',
  },
  shadows: {
    dock: '0 8px 28px rgba(0,0,0,0.45)',
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
    10: '10px',
    12: '12px',
    14: '14px',
    16: '16px',
    18: '18px',
    20: '20px',
    22: '22px',
    28: '28px',
  },
  layout: {
    maxWidth: '430px',
    paddingHorizontal: '20px',
    verticalSpacingLarge: '28px',
    verticalSpacingMedium: '20px',
    verticalSpacingSmall: '12px',
  },
} as const
