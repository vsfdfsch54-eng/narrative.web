/**
 * Centralized logging utility
 * Replace console.log/error with this for better control
 */

import { RequestContext } from './request-context'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Log with request context for correlation
 */
export function logWithContext(
  level: 'info' | 'warn' | 'error',
  message: string,
  ctx: RequestContext,
  data?: any
) {
  const logEntry = {
    level,
    message,
    ...ctx,
    ...data,
  }
  console.log(JSON.stringify(logEntry))
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },
  
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
  
  // Structured logging for API routes
  api: {
    request: (route: string, data?: Record<string, unknown>) => {
      if (isDevelopment) {
        console.log(`[API] ${route}`, data || '')
      }
    },
    response: (route: string, status: number, data?: unknown) => {
      if (isDevelopment) {
        console.log(`[API] ${route} → ${status}`, data || '')
      }
    },
    error: (route: string, error: unknown) => {
      console.error(`[API] ${route} → ERROR`, error)
    },
  },
  
  // Matching-specific logs
  matching: {
    start: () => {
      if (isDevelopment) {
        console.log('[Matching] 🔍 Starting matching process...')
      }
    },
    found: (count: number) => {
      if (isDevelopment) {
        console.log(`[Matching] 📊 Found ${count} users in waiting pool`)
      }
    },
    matched: (user1: string, user2: string, score?: number) => {
      console.log(`[Matching] ✅ Matched ${user1} with ${user2}${score ? ` (score: ${score.toFixed(3)})` : ''}`)
    },
    error: (error: unknown) => {
      console.error('[Matching] ❌ Error:', error)
    },
  },
  
  // Onboarding-specific logs
  onboarding: {
    start: (userId: string) => {
      if (isDevelopment) {
        console.log(`[Onboarding] Starting for user ${userId}`)
      }
    },
    complete: (userId: string) => {
      console.log(`[Onboarding] ✅ Completed for user ${userId}`)
    },
    error: (userId: string, error: unknown) => {
      console.error(`[Onboarding] ❌ Error for user ${userId}:`, error)
    },
  },
}

