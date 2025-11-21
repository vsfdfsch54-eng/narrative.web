/**
 * Narrative Design System
 * Unified, premium, modern design system inspired by Linear, Vercel, Raycast, Notion, and Apple iOS 17
 */

// ============================================================
// COLORS
// ============================================================
export const colors = {
  // Backgrounds
  background: '#0F0F0F',
  surface1: '#151515',
  surface2: '#1A1A1A',
  surface3: '#0C0C0C',
  
  // Borders
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.20)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.38)',
  
  // Chips
  chipBg: '#FFFFFF',
  chipText: '#000000',
  chipSelectedBg: '#F2F2F2',
  
  // Accents (muted, Linear-style)
  accent: {
    blue: '#3A7CFF',
    green: '#39D98A',
    orange: '#FFB65C',
    purple: '#9B6BFF',
    red: '#FF6B6B',
  },
} as const

// ============================================================
// TYPOGRAPHY
// ============================================================
export const typography = {
  titleXL: {
    fontSize: '32px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  titleLG: {
    fontSize: '28px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  titleMD: {
    fontSize: '20px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  body: {
    fontSize: '16px',
    fontWeight: 500,
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
// RADII SYSTEM (STRICT)
// ============================================================
export const radii = {
  xs: '6px',
  sm: '8px',
  md: '12px', // Primary
  lg: '16px', // Maximum
} as const

// ============================================================
// SPACING SYSTEM (8px grid)
// ============================================================
export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '28px',
  screen: '20px', // Screen padding
  section: '28px', // Vertical sections
  component: '20px', // Component spacing
  chip: '12px', // Chip spacing
} as const

// ============================================================
// COMPONENT SPECS
// ============================================================
export const components = {
  button: {
    height: '44px',
    heightLarge: '48px',
    radius: radii.md,
    primary: {
      background: colors.chipBg,
      text: colors.chipText,
      shadow: '0 1px 3px rgba(0,0,0,0.18)',
    },
    secondary: {
      background: 'transparent',
      border: `1.25px solid ${colors.borderStrong}`,
      text: colors.textPrimary,
    },
    ghost: {
      background: 'transparent',
      text: colors.textMuted,
    },
  },
  input: {
    height: '44px',
    heightLarge: '48px',
    radius: radii.md,
    background: colors.surface1,
    border: colors.border,
  },
  chip: {
    height: '42px',
    radius: radii.md,
    background: colors.chipBg,
    text: colors.chipText,
    selected: {
      background: colors.chipSelectedBg,
      border: '1.75px solid #000000',
    },
    unselected: {
      border: `1.25px solid ${colors.border}`,
    },
    padding: '10px 12px',
    iconSize: '16px',
    gap: spacing.chip,
  },
  dropdown: {
    height: '44px',
    radius: radii.md,
    border: colors.borderStrong,
    itemHeight: '44px',
  },
  card: {
    radius: radii.md,
    background: colors.surface1,
    border: colors.border,
    padding: spacing.lg,
  },
  segmentedControl: {
    height: '40px',
    radius: '10px',
    background: 'rgba(255,255,255,0.08)',
    selected: {
      background: colors.chipBg,
      text: colors.chipText,
    },
    unselected: {
      text: `${colors.textPrimary}CC`, // 80% opacity
    },
  },
} as const

// ============================================================
// MOTION
// ============================================================
export const motion = {
  duration: {
    fast: 120,
    normal: 150,
    slow: 160,
  },
  easing: [0.42, 0, 0.58, 1], // cubic-bezier for ease-in-out
  dropdown: {
    slide: '6px',
    maxSlide: '10px',
  },
} as const

// ============================================================
// ICONS
// ============================================================
export const icons = {
  size: '16px',
  stroke: 2,
  color: {
    default: colors.textSecondary,
    selected: colors.textPrimary,
  },
} as const

