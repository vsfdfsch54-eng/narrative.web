export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { getLoopById } from '@/lib/loops-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * GET /api/loops/[id]?userId=UUID
 * Get a single Loop by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { id } = await params
    const loopId = id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const loop = await getLoopById(loopId, userId)

    if (!loop) {
      return NextResponse.json(
        { success: false, error: 'Loop not found or access denied' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data: loop,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/loops/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

