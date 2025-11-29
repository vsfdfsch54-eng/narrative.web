export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { inviteToEvent, updateEventStatus, getEventParticipants } from '@/lib/events-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/events/[id]/participants
 * Invite a user to an Event or update their status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { userId, status = 'invited', action = 'invite' } = body
    const { id } = await params
    const eventId = id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userId' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    let success = false
    if (action === 'invite') {
      success = await inviteToEvent(eventId, userId, status)
    } else if (action === 'update') {
      success = await updateEventStatus(eventId, userId, status)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "invite" or "update"' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update participant' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/events/[id]/participants] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * GET /api/events/[id]/participants
 * Get all participants for an Event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = id

    const participants = await getEventParticipants(eventId)

    return NextResponse.json({
      success: true,
      data: participants,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/events/[id]/participants] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

