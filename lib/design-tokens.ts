/**
 * Narrative Design Tokens
 * Midnight Black + Eggshell Floating Pill Design System
 */

export const tokens = {
  colors: {
    backgroundApp: '#0C0C0E',
    backgroundSoft: '#111114',
    surfacePrimary: '#F8F8F9',
    surfaceSecondary: '#F3F3F4',
    borderSubtle: 'rgba(255,255,255,0.08)',
    borderMedium: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#1A1A1C',
    textSecondary: '#5E5E63',
    textMuted: '#8A8A90',
    textPrimaryOnDark: '#F2F2F3',
    textSecondaryOnDark: '#BEBEC4',
    textDark: '#1A1A1C',
    accentBlue: '#4A6CF6',
    accentGreen: '#38B57A',
    accentOrange: '#E69A3B',
    accentPurple: '#7B6CF9',
    accentPink: '#C970A8',
  },
  radii: {
    pill: '24px',
    card: '24px',
    button: '24px',
    input: '24px',
    popover: '20px',
    chip: '24px',
  },
  shadows: {
    card: '0 8px 32px rgba(0,0,0,0.35)',
    elevated: '0 12px 40px rgba(0,0,0,0.40)',
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
    14: '14px',
    16: '16px',
    20: '20px',
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
