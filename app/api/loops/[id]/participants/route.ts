export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { addParticipantToLoop, removeParticipantFromLoop, getLoopParticipants } from '@/lib/loops-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/loops/[id]/participants
 * Add a participant to a Loop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { userId, role = 'member' } = body
    const { id } = await params
    const loopId = id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userId' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const success = await addParticipantToLoop(loopId, userId, role)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to add participant' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/loops/[id]/participants] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * DELETE /api/loops/[id]/participants?userId=UUID
 * Remove a participant from a Loop
 */
export async function DELETE(
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

    const success = await removeParticipantFromLoop(loopId, userId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove participant' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[DELETE /api/loops/[id]/participants] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * GET /api/loops/[id]/participants
 * Get all participants for a Loop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const loopId = id

    const participants = await getLoopParticipants(loopId)

    return NextResponse.json({
      success: true,
      data: participants,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/loops/[id]/participants] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

