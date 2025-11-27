export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * POST /api/match/skip
 * When user presses Skip, do nothing (no DB write)
 * This is just for tracking/analytics if needed in the future
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetId } = body

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'Missing userId or targetId' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    // No database write for skip - just return success
    // In the future, we could track skipped users to avoid showing them again
    return NextResponse.json({
      success: true,
      message: 'Skipped',
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Match Skip] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

