export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createEvent, getUserEvents } from '@/lib/events-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/events
 * Create a new Event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      dateTime,
      location,
      visibilityLayer,
      growthEnabled,
      participantListVisible,
      pastActivityEnabled,
      syncToFeed,
      privateLink,
      guestModeEnabled,
      loopId,
      createdBy,
    } = body

    if (!title || !dateTime || !createdBy || !visibilityLayer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, dateTime, createdBy, visibilityLayer' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const event = await createEvent({
      title,
      dateTime,
      location,
      visibilityLayer,
      growthEnabled,
      participantListVisible,
      pastActivityEnabled,
      syncToFeed,
      privateLink,
      guestModeEnabled,
      loopId,
      createdBy,
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Failed to create event' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/events] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * GET /api/events?userId=UUID
 * Get all Events for a user
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

    const events = await getUserEvents(userId)

    return NextResponse.json({
      success: true,
      data: events,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/events] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

