/**
 * Onboarding State Machine
 * Single source of truth for onboarding step management
 * 
 * The ONLY source of truth for onboarding progress is: users.onboarding_step (TEXT)
 * Allowed values EXACTLY: ['start','email','password','name','questions','interests','confirmation','complete']
 * 
 * Flow:
 * 1. Email - 'email'
 * 2. Password - 'password' (account created here)
 * 3. Name (first & last) - 'name'
 * 4. Questions (10 questions) - 'questions'
 * 5. Interests - 'interests'
 * 6. Final confirmation page - 'confirmation'
 * 7. Redirect to main app (/chat) - 'complete'
 */

export type OnboardingStep = 'start' | 'email' | 'password' | 'name' | 'questions' | 'interests' | 'confirmation' | 'complete'

export const ONBOARDING_STEPS: OnboardingStep[] = ['start', 'email', 'password', 'name', 'questions', 'interests', 'confirmation', 'complete']

/**
 * Step order for progression (excludes 'start' and 'complete')
 */
export const STEP_ORDER: OnboardingStep[] = ['email', 'password', 'name', 'questions', 'interests', 'confirmation']

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
    return '/chat'
  }
  return '/onboarding'
}

/**
 * Get the route that should be shown for a given step
 */
export function getOnboardingRouteForStep(step: OnboardingStep): string {
  if (step === 'complete') {
    return '/chat'
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
 * Check if a step transition is valid
 * Allows forward progression by one step, or backward by any number of steps
 */
export function isValidStepTransition(from: OnboardingStep, to: OnboardingStep): boolean {
  const fromIndex = STEP_ORDER.indexOf(from)
  const toIndex = STEP_ORDER.indexOf(to)
  
  if (toIndex === -1 || fromIndex === -1) return false
  // Can go forward one step, or backward any number
  return toIndex === fromIndex + 1 || toIndex < fromIndex
}

/**
 * Normalize onboarding step from database
 * 
 * NOTE:
 * The database default for onboarding_step is "start".
 * The UI expects initial step = "email".
 * normalizeOnboardingStep() converts "start" → "email" intentionally.
 * This is expected behavior and prevents inconsistencies.
 * 
 * Converts invalid/null/undefined values to 'email' (not 'start')
 */
export function normalizeOnboardingStep(step: string | null | undefined): OnboardingStep {
  if (!step || !isValidOnboardingStep(step)) {
    return 'email'
  }
  // Convert 'start' to 'email' for new users
  if (step === 'start') {
    return 'email'
  }
  return step
}
