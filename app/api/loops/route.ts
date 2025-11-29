export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createLoop, getUserLoops } from '@/lib/loops-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/loops
 * Create a new Loop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      visibilityLayer,
      growthEnabled,
      pastActivityEnabled,
      feedSyncEnabled,
      privateLink,
      createdBy,
    } = body

    if (!title || !createdBy || !visibilityLayer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, createdBy, visibilityLayer' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const loop = await createLoop({
      title,
      visibilityLayer,
      growthEnabled,
      pastActivityEnabled,
      feedSyncEnabled,
      privateLink,
      createdBy,
    })

    if (!loop) {
      return NextResponse.json(
        { success: false, error: 'Failed to create loop' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data: loop,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/loops] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * GET /api/loops?userId=UUID
 * Get all Loops for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const loops = await getUserLoops(userId)

    return NextResponse.json({
      success: true,
      data: loops,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/loops] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

