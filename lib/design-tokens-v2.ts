/**
 * Narrative V2.0 Design Tokens
 * Modern, minimal, premium design system
 */

export const tokensV2 = {
  colors: {
    // Primary gradient
    gradientStart: '#004FFF',
    gradientEnd: '#6D00FF',
    
    // Accent colors
    accentSky: '#4A90E2',
    accentTeal: '#00C4CC',
    accentPink: '#FF4F81',
    
    // Backgrounds
    backgroundEggshell: '#FAFAFA',
    backgroundWhite: '#FFFFFF',
    
    // Text
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    textOnDark: '#FFFFFF',
    
    // Borders
    borderLight: 'rgba(0, 0, 0, 0.08)',
    borderMedium: 'rgba(0, 0, 0, 0.12)',
    borderDark: 'rgba(0, 0, 0, 0.20)',
    
    // Overlays
    overlayLight: 'rgba(255, 255, 255, 0.8)',
    overlayDark: 'rgba(0, 0, 0, 0.4)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #004FFF 0%, #6D00FF 100%)',
    primaryReverse: 'linear-gradient(135deg, #6D00FF 0%, #004FFF 100%)',
    accent: 'linear-gradient(135deg, #4A90E2 0%, #00C4CC 100%)',
    subtle: 'linear-gradient(135deg, rgba(0, 79, 255, 0.1) 0%, rgba(109, 0, 255, 0.1) 100%)',
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
    40: '40px',
    48: '48px',
    56: '56px',
    64: '64px',
  },
  
  borderRadius: {
    small: '8px',
    medium: '14px', // Primary card radius
    large: '20px',
    full: '9999px',
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    large: '0 8px 32px rgba(0, 0, 0, 0.16)',
    glow: '0 0 24px rgba(0, 79, 255, 0.3)',
  },
  
  transitions: {
    fast: '150ms ease-out',
    normal: '250ms ease-out',
    slow: '350ms ease-out',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    tooltip: 500,
  },
} as const

// Animation variants for Framer Motion
export const animations = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

// Helper function to get gradient style
export function getGradientStyle(gradient: keyof typeof tokensV2.gradients) {
  return {
    background: tokensV2.gradients[gradient],
  }
}

// Helper function to get card style
export function getCardStyle() {
  return {
    background: tokensV2.colors.backgroundWhite,
    borderRadius: tokensV2.borderRadius.medium,
    boxShadow: tokensV2.shadows.medium,
    padding: tokensV2.spacing[24],
  }
}

