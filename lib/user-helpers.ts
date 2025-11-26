/**
 * Client-side helper to fetch app-level user record
 * Uses the /api/users endpoint
 */

import { OnboardingStep, normalizeOnboardingStep } from './onboarding'

export interface AppUserRecord {
  id: string
  email: string | null
  onboarding_step: OnboardingStep | null
  onboarding_completed: boolean | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  interests?: string[] | null
  questions_answers?: Record<string, string> | null
  [key: string]: any // Allow other fields
}

/**
 * Get the app-level user record from the database
 * Returns null if user not found or on error
 * 
 * CRITICAL: Distinguishes between:
 * - 404/400: User doesn't exist (legitimate)
 * - 500/network error: API failure (should not trigger redirects)
 */
export async function getAppUserRecord(userId: string): Promise<AppUserRecord | null> {
  try {
    const response = await fetch(`/api/users?userId=${userId}`, {
      cache: 'no-store',
      // Add timeout to prevent hanging (longer for mobile networks)
      signal: AbortSignal.timeout(15000), // 15 second timeout (increased for mobile)
    })
    
    if (!response.ok) {
      const status = response.status
      console.warn(`[getAppUserRecord] API returned ${status} for userId: ${userId}`)
      
      // 404/400 = user doesn't exist (legitimate case)
      // 500/502/503/504 = server error (should not trigger redirects)
      // Store error type for checkOnboardingStatus to use
      if (status >= 500) {
        // Server error - mark in session storage to prevent redirect loops
        // Use try-catch for mobile browsers that may restrict sessionStorage
        try {
          const errorKey = `api_error_${userId}`
          const errorCount = parseInt(sessionStorage.getItem(errorKey) || '0', 10)
          sessionStorage.setItem(errorKey, String(errorCount + 1))
          console.warn(`[getAppUserRecord] Server error (${status}) - error count: ${errorCount + 1}`)
        } catch (e) {
          // sessionStorage may be unavailable on mobile - log but continue
          console.warn('[getAppUserRecord] Could not access sessionStorage:', e)
        }
      }
      
      return null
    }
    
    // Success - clear any error tracking
    try {
      const errorKey = `api_error_${userId}`
      sessionStorage.removeItem(errorKey)
    } catch (e) {
      // sessionStorage may be unavailable on mobile - ignore
    }
    
    const data = await response.json()
    
    if (data.success && data.data) {
      return data.data as AppUserRecord
    }
    
    return null
  } catch (error: any) {
    console.error('[getAppUserRecord] Error fetching user:', error)
    
    // Network/timeout errors - mark in session storage
    // Use try-catch for mobile browsers that may restrict sessionStorage
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      try {
        const errorKey = `api_error_${userId}`
        const errorCount = parseInt(sessionStorage.getItem(errorKey) || '0', 10)
        sessionStorage.setItem(errorKey, String(errorCount + 1))
        console.warn(`[getAppUserRecord] Network/timeout error - error count: ${errorCount + 1}`)
      } catch (e) {
        // sessionStorage may be unavailable on mobile - log but continue
        console.warn('[getAppUserRecord] Could not access sessionStorage:', e)
      }
    }
    
    return null
  }
}

/**
 * Safe wrapper to check onboarding status with API error handling
 * Returns { completed: boolean, step: OnboardingStep, record: AppUserRecord | null, apiError: boolean }
 * apiError is true when the API call failed (should not trigger redirects)
 * 
 * CRITICAL: Pages should NEVER redirect when apiError is true - this prevents redirect loops
 * 
 * ADDITIONAL SAFEGUARDS:
 * - Tracks API errors in sessionStorage to detect repeated failures
 * - Circuit breaker: If 3+ consecutive errors, always return apiError=true
 * - Prevents redirect loops even if error detection fails
 */
export async function checkOnboardingStatus(userId: string): Promise<{
  completed: boolean
  step: OnboardingStep
  record: AppUserRecord | null
  apiError: boolean
}> {
  // Circuit breaker: Check if we've had repeated API errors
  // Use try-catch for mobile browsers that may restrict sessionStorage
  let errorCount = 0
  if (typeof window !== 'undefined') {
    try {
      const errorKey = `api_error_${userId}`
      errorCount = parseInt(sessionStorage.getItem(errorKey) || '0', 10)
      
      // If 3+ consecutive errors, assume API is down - don't even try
      if (errorCount >= 3) {
        console.warn(`[checkOnboardingStatus] Circuit breaker active - ${errorCount} consecutive errors for userId: ${userId}`)
        return {
          completed: false,
          step: normalizeOnboardingStep(null),
          record: null,
          apiError: true // Always return apiError when circuit breaker is active
        }
      }
    } catch (e) {
      // sessionStorage may be unavailable on mobile - continue without circuit breaker
      console.warn('[checkOnboardingStatus] Could not access sessionStorage, continuing without circuit breaker:', e)
    }
  }
  
  const record = await getAppUserRecord(userId)
  
  // If record is null, check error count to determine if it's an API error
  if (!record) {
    let isApiError = true // Default to true (conservative - prevents loops)
    
    // On mobile, if sessionStorage fails, always assume API error to prevent loops
    if (typeof window !== 'undefined') {
      try {
        const errorKey = `api_error_${userId}`
        const currentErrorCount = parseInt(sessionStorage.getItem(errorKey) || '0', 10)
        
        // If we have error tracking, it's likely an API error
        // If no error tracking but record is null, be conservative and assume API error
        // This prevents redirect loops
        isApiError = currentErrorCount > 0 || errorCount > 0
      } catch (e) {
        // sessionStorage unavailable on mobile - default to apiError=true (conservative)
        console.warn('[checkOnboardingStatus] Could not check error count, assuming API error:', e)
        isApiError = true // Conservative: assume API error to prevent loops
      }
    }
    
    return {
      completed: false,
      step: normalizeOnboardingStep(null),
      record: null,
      apiError: isApiError // Mark as API error to prevent redirect loops
    }
  }
  
  // Success - clear error tracking
  if (typeof window !== 'undefined') {
    try {
      const errorKey = `api_error_${userId}`
      sessionStorage.removeItem(errorKey)
    } catch (e) {
      // sessionStorage may be unavailable on mobile - ignore
    }
  }
  
  const step = normalizeOnboardingStep(record.onboarding_step ?? null)
  const completed = step === 'complete' || record.onboarding_completed === true
  
  return {
    completed,
    step,
    record,
    apiError: false
  }
}

