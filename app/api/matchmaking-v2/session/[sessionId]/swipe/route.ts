export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/matchmaking-v2/session/[sessionId]/swipe
 * Record a swipe action (left or right)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { userId, direction } = body

    if (!sessionId || !userId || !direction || !['left', 'right'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid parameters' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('matchmaking_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Determine which user is swiping
    const isUser1 = session.user1_id === userId
    const updateField = isUser1 ? 'user1_swipe' : 'user2_swipe'

    // Update swipe direction
    const { data: updatedSession, error: updateError } = await supabase
      .from('matchmaking_sessions')
      .update({
        [updateField]: direction,
        status: direction === 'left' ? 'dissolved' : 'ephemeral_chat',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('[Matchmaking V2 Swipe] Error updating session:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to record swipe' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Check if both users swiped right (mutual match)
    const bothSwipedRight = 
      updatedSession.user1_swipe === 'right' && 
      updatedSession.user2_swipe === 'right'

    if (bothSwipedRight) {
      // Update status to matched
      await supabase
        .from('matchmaking_sessions')
        .update({
          status: 'matched',
          stay_connected_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      success: true,
      matched: bothSwipedRight,
      otherUserSwipe: isUser1 ? updatedSession.user2_swipe : updatedSession.user1_swipe,
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Matchmaking V2 Swipe] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

