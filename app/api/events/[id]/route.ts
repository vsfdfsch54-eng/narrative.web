export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/events-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * GET /api/events/[id]?userId=UUID
 * Get a single Event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { id } = await params
    const eventId = id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const event = await getEventById(eventId, userId)

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/events/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

