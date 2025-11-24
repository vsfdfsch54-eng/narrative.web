/**
 * Onboarding Utility Functions
 * Single source of truth for onboarding step management
 */

export type OnboardingStep = 'start' | 'email' | 'name' | 'password' | 'interests' | 'personality' | 'complete'

export const ONBOARDING_STEPS: OnboardingStep[] = ['start', 'email', 'name', 'password', 'interests', 'personality', 'complete']

/**
 * Step order for progression (excludes 'start' and 'complete')
 */
export const STEP_ORDER: OnboardingStep[] = ['email', 'name', 'password', 'interests', 'personality']

/**
 * Get the next route for an onboarding step
 * This is the single source of truth for routing
 */
export function getNextOnboardingRoute(step: OnboardingStep): string {
  switch (step) {
    case 'start':
    case 'email':
      return '/onboarding'
    case 'name':
      return '/onboarding'
    case 'password':
      return '/onboarding'
    case 'interests':
      return '/onboarding'
    case 'personality':
      return '/onboarding'
    case 'complete':
      return '/vibe'
    default:
      return '/onboarding'
  }
}

/**
 * Get the route that should be shown for a given step
 * (All steps are shown on /onboarding, but this helps with redirects)
 */
export function getOnboardingRouteForStep(step: OnboardingStep): string {
  if (step === 'complete') {
    return '/vibe'
  }
  return '/onboarding'
}

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
 * Check if a step is valid
 */
export function isValidOnboardingStep(step: string | null | undefined): step is OnboardingStep {
  return step !== null && step !== undefined && ONBOARDING_STEPS.includes(step as OnboardingStep)
}

/**
 * Get the initial step for a new user
 */
export function getInitialStep(): OnboardingStep {
  return 'email'
}

