/**
 * REDIRECT LOOP PREVENTION SYSTEM
 * 
 * This module provides a global safeguard against redirect loops.
 * It tracks redirects and prevents infinite loops.
 */

const REDIRECT_HISTORY_KEY = 'redirect_history'
const MAX_REDIRECTS = 3
const REDIRECT_WINDOW_MS = 5000 // 5 seconds

interface RedirectEntry {
  from: string
  to: string
  timestamp: number
}

/**
 * Check if a redirect would cause a loop
 * Returns true if redirect is safe, false if it would cause a loop
 */
export function isRedirectSafe(from: string, to: string): boolean {
  if (typeof window === 'undefined') return true // SSR safety
  
  try {
    const historyJson = sessionStorage.getItem(REDIRECT_HISTORY_KEY)
    const history: RedirectEntry[] = historyJson ? JSON.parse(historyJson) : []
    
    const now = Date.now()
    
    // Filter to recent redirects (within window)
    const recentHistory = history.filter(
      entry => now - entry.timestamp < REDIRECT_WINDOW_MS
    )
    
    // Check for loops: same from->to pattern repeated
    const sameRedirectCount = recentHistory.filter(
      entry => entry.from === from && entry.to === to
    ).length
    
    if (sameRedirectCount >= MAX_REDIRECTS) {
      console.error(`[RedirectGuard] ⛔ BLOCKED: Redirect loop detected! ${sameRedirectCount} redirects from ${from} to ${to} in ${REDIRECT_WINDOW_MS}ms`)
      return false
    }
    
    // Check for circular patterns: A->B->A
    if (recentHistory.length >= 2) {
      const lastTwo = recentHistory.slice(-2)
      if (lastTwo[0].to === to && lastTwo[0].from === from) {
        console.error(`[RedirectGuard] ⛔ BLOCKED: Circular redirect detected! ${from} -> ${to} -> ${from}`)
        return false
      }
    }
    
    // Record this redirect
    recentHistory.push({
      from,
      to,
      timestamp: now
    })
    
    // Keep only recent history
    const filtered = recentHistory.filter(
      entry => now - entry.timestamp < REDIRECT_WINDOW_MS
    )
    
    sessionStorage.setItem(REDIRECT_HISTORY_KEY, JSON.stringify(filtered))
    
    return true
  } catch (error) {
    console.error('[RedirectGuard] Error checking redirect safety:', error)
    // On error, allow redirect (fail open)
    return true
  }
}

/**
 * Clear redirect history (useful after successful navigation)
 */
export function clearRedirectHistory(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(REDIRECT_HISTORY_KEY)
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Safe redirect wrapper that checks for loops before redirecting
 * Returns true if redirect was performed, false if blocked
 */
export function safeRedirect(
  router: { replace: (path: string) => void },
  from: string,
  to: string
): boolean {
  if (!isRedirectSafe(from, to)) {
    console.warn(`[RedirectGuard] Redirect blocked: ${from} -> ${to}`)
    return false
  }
  
  router.replace(to)
  return true
}

