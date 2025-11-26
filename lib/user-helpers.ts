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
 */
export async function getAppUserRecord(userId: string): Promise<AppUserRecord | null> {
  try {
    const response = await fetch(`/api/users?userId=${userId}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      console.warn(`[getAppUserRecord] API returned ${response.status} for userId: ${userId}`)
      return null
    }
    
    const data = await response.json()
    
    if (data.success && data.data) {
      return data.data as AppUserRecord
    }
    
    return null
  } catch (error) {
    console.error('[getAppUserRecord] Error fetching user:', error)
    return null
  }
}

/**
 * Safe wrapper to check onboarding status with API error handling
 * Returns { completed: boolean, step: OnboardingStep, record: AppUserRecord | null, apiError: boolean }
 * apiError is true when the API call failed (should not trigger redirects)
 */
export async function checkOnboardingStatus(userId: string): Promise<{
  completed: boolean
  step: OnboardingStep
  record: AppUserRecord | null
  apiError: boolean
}> {
  const record = await getAppUserRecord(userId)
  
  // If record is null, it could be:
  // 1. User doesn't exist (legitimate - should redirect to onboarding)
  // 2. API error (should NOT redirect - causes loops)
  // We can't distinguish, so we'll be conservative and assume API error
  // Pages should handle this by not redirecting on apiError
  
  if (!record) {
    return {
      completed: false,
      step: normalizeOnboardingStep(null),
      record: null,
      apiError: true // Mark as API error to prevent redirect loops
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

