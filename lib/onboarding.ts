/**
 * Onboarding State Machine
 * Single source of truth for onboarding step management
 * 
 * The ONLY source of truth for onboarding progress is: users.onboarding_step (TEXT)
 * Allowed values EXACTLY: ['start','email','name','password','interests','personality','complete']
 */

export type OnboardingStep = 'start' | 'email' | 'name' | 'password' | 'interests' | 'personality' | 'complete'

export const ONBOARDING_STEPS: OnboardingStep[] = ['start', 'email', 'name', 'password', 'interests', 'personality', 'complete']

/**
 * Step order for progression (excludes 'start' and 'complete')
 */
export const STEP_ORDER: OnboardingStep[] = ['email', 'name', 'password', 'interests', 'personality']

/**
 * Get the next step in the onboarding flow
 */
export function getNextStep(currentStep: OnboardingStep): OnboardingStep {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep)
  if (currentIndex < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[currentIndex + 1]
  }
  return 'complete'
}

/**
 * Get the next route for an onboarding step
 * This is the single source of truth for routing
 */
export function getNextOnboardingRoute(step: OnboardingStep): string {
  if (step === 'complete') {
    return '/vibe'
  }
  return '/onboarding'
}

/**
 * Get the route that should be shown for a given step
 */
export function getOnboardingRouteForStep(step: OnboardingStep): string {
  if (step === 'complete') {
    return '/vibe'
  }
  return '/onboarding'
}

/**
 * Check if a step is valid
 */
export function isValidOnboardingStep(step: string | null | undefined): step is OnboardingStep {
  return step !== null && step !== undefined && ONBOARDING_STEPS.includes(step as OnboardingStep)
}

/**
 * Get the initial step for a new user
 * Always returns 'email' - new users start at email step
 */
export function getInitialStep(): OnboardingStep {
  return 'email'
}

/**
 * Normalize onboarding step from database
 * Converts invalid/null/undefined values to 'start', then to 'email' if needed
 */
export function normalizeOnboardingStep(step: string | null | undefined): OnboardingStep {
  if (!step || !isValidOnboardingStep(step)) {
    return 'start'
  }
  // Convert 'start' to 'email' for new users
  if (step === 'start') {
    return 'email'
  }
  return step
}
