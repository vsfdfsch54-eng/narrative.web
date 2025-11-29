/**
 * V2 User Helpers
 * Simplified helpers for V2 schema
 */

export interface V2UserStatus {
  schemaVersion: 'v1' | 'v2'
  onboardingCompleted: boolean
  needsOnboarding: boolean
}

/**
 * Check user's V2 status
 */
export async function checkV2UserStatus(userId: string): Promise<V2UserStatus> {
  try {
    const response = await fetch(`/api/users?userId=${userId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      // Default to needs onboarding on error
      return {
        schemaVersion: 'v1',
        onboardingCompleted: false,
        needsOnboarding: true,
      }
    }

    const data = await response.json()
    
    if (data.success && data.data) {
      const schemaVersion = (data.data.schema_version || 'v1') as 'v1' | 'v2'
      const onboardingCompleted = data.data.onboarding_completed || false
      
      return {
        schemaVersion,
        onboardingCompleted,
        needsOnboarding: schemaVersion !== 'v2' || !onboardingCompleted,
      }
    }

    // No user record - needs onboarding
    return {
      schemaVersion: 'v1',
      onboardingCompleted: false,
      needsOnboarding: true,
    }
  } catch (error) {
    console.error('[checkV2UserStatus] Error:', error)
    // Default to needs onboarding on error
    return {
      schemaVersion: 'v1',
      onboardingCompleted: false,
      needsOnboarding: true,
    }
  }
}

