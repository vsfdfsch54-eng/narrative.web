import { randomUUID } from 'crypto'

export interface RequestContext {
  requestId: string
  timestamp: string
  userId?: string
  matchId?: string
  [key: string]: any // Allow additional metadata
}

/**
 * Create a request-scoped logging context
 * Use this in API routes to correlate logs across services
 */
export function createRequestContext(metadata?: Partial<RequestContext>): RequestContext {
  return {
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
    ...metadata,
  }
}

/**
 * Get request context from headers (for request ID propagation)
 */
export function getRequestContextFromHeaders(headers: Headers): Partial<RequestContext> {
  const requestId = headers.get('x-request-id') || randomUUID()
  return {
    requestId,
    timestamp: new Date().toISOString(),
  }
}

