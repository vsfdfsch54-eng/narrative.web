/**
 * Sentry error monitoring and performance tracking
 * Initialize this in your Next.js app for production error monitoring
 * 
 * To use Sentry, install: npm install @sentry/nextjs
 * Then set SENTRY_DSN in your environment variables
 */

let sentryInitialized = false

export function initSentry() {
  // Only initialize if SENTRY_DSN is set (Sentry is optional)
  if (!process.env.SENTRY_DSN) {
    return // Sentry not configured - that's okay
  }
  
  if (sentryInitialized) return
  
  // Sentry initialization is optional - only runs if package is installed
  // This prevents build errors if Sentry is not installed
  try {
    // Check if we're in a Node.js environment (server-side)
    if (typeof window === 'undefined') {
      // Dynamic require for server-side only
      const Sentry = require('@sentry/nextjs')
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      })
      sentryInitialized = true
      console.log('[Sentry] ✅ Error monitoring initialized')
    }
  } catch (error) {
    // Sentry not installed or not available - that's okay
    // This is expected if @sentry/nextjs is not installed
  }
}

/**
 * Capture an exception in Sentry (optional - only works if Sentry is installed)
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized || !process.env.SENTRY_DSN) return
  
  try {
    const Sentry = require('@sentry/nextjs')
    Sentry.captureException(error, {
      extra: context,
    })
  } catch {
    // Sentry not available - ignore
  }
}

/**
 * Capture a message in Sentry (optional - only works if Sentry is installed)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (!sentryInitialized || !process.env.SENTRY_DSN) return
  
  try {
    const Sentry = require('@sentry/nextjs')
    Sentry.captureMessage(message, {
      level: level as any,
      extra: context,
    })
  } catch {
    // Sentry not available - ignore
  }
}

