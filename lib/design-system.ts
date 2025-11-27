/**
 * Narrative Design System
 * White, Clean, Colorful, Premium design inspired by Apple, Linear, Notion, Airbnb, Duolingo, Arc Browser
 */

// ============================================================
// COLORS
// ============================================================
export const colors = {
  // Backgrounds
  background: '#FFFFFF',
  
  // Text
  textPrimary: '#0B0B0B',
  textSecondary: '#6A6A6A',
  textMuted: '#9E9E9E',
  
  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.12)',
  
  // Accent Colors (for categories, moods, chips, buttons)
  accent: {
    green: '#4ADE80',
    blue: '#3B82F6',
    purple: '#A855F7',
    orange: '#F59E0B',
    pink: '#EC4899',
  },
  
  // Surfaces
  surface: '#FFFFFF',
  surfaceHover: '#F9F9F9',
} as const

// ============================================================
// TYPOGRAPHY
// ============================================================
export const typography = {
  h1: {
    fontSize: '32px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '20px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  body: {
    fontSize: '16px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5,
  },
  label: {
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.4,
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.4,
  },
} as const

// ============================================================
// RADII SYSTEM
// ============================================================
export const radii = {
  card: '16px',
  input: '14px',
  button: '12px',
  chip: '16px', // rounded pill
} as const

// ============================================================
// SPACING SYSTEM
// ============================================================
export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  xxl: '32px',
  screen: '24px', // Screen padding (24-32px)
  section: '32px', // Vertical sections (24-32px)
} as const

// ============================================================
// SHADOWS
// ============================================================
export const shadows = {
  card: '0 4px 12px rgba(0, 0, 0, 0.06)',
  button: '0 2px 8px rgba(0, 0, 0, 0.08)',
} as const

// ============================================================
// COMPONENT SPECS
// ============================================================
export const components = {
  button: {
    height: '44px',
    heightLarge: '48px',
    radius: radii.button,
    primary: {
      background: colors.textPrimary,
      text: colors.background,
      shadow: shadows.button,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${colors.borderStrong}`,
      text: colors.textPrimary,
    },
    ghost: {
      background: 'transparent',
      text: colors.textSecondary,
    },
  },
  input: {
    height: '44px',
    heightLarge: '48px',
    radius: radii.input,
    background: colors.background,
    border: colors.border,
  },
  chip: {
    height: '44px',
    radius: radii.chip,
    background: colors.background,
    text: colors.textPrimary,
    selected: {
      background: colors.accent.blue,
      text: colors.background,
    },
    unselected: {
      border: `1px solid ${colors.border}`,
    },
    padding: '12px 16px',
    iconSize: '18px',
    gap: spacing.sm,
  },
  dropdown: {
    height: '44px',
    radius: radii.input,
    border: colors.borderStrong,
    itemHeight: '44px',
  },
  card: {
    radius: radii.card,
    background: colors.background,
    border: colors.border,
    padding: spacing.xl,
    shadow: shadows.card,
  },
  segmentedControl: {
    height: '44px',
    radius: radii.input,
    background: 'rgba(0, 0, 0, 0.04)',
    selected: {
      background: colors.textPrimary,
      text: colors.background,
    },
    unselected: {
      text: colors.textPrimary,
    },
  },
} as const

// ============================================================
// MOTION
// ============================================================
export const motion = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: [0.4, 0, 0.2, 1], // cubic-bezier for ease-in-out
} as const
