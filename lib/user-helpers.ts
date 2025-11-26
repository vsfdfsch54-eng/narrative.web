/**
 * Client-side helper to fetch app-level user record
 * Uses the /api/users endpoint
 */

import { OnboardingStep } from './onboarding'

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

