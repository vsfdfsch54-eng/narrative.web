export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'
import { createLoop } from '@/lib/loops-helpers'

/**
 * POST /api/loops/create-from-match
 * Create a Loop from a matchmaking session (when both users swipe right)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or userId' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Get matchmaking session
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

    // Verify both users swiped right
    if (session.user1_swipe !== 'right' || session.user2_swipe !== 'right') {
      return NextResponse.json(
        { success: false, error: 'Both users must swipe right to create a loop' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    // Verify user is part of this session
    if (session.user1_id !== userId && session.user2_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'User not part of this session' },
        { status: 403, headers: getCorsHeaders() }
      )
    }

    // Get other user's nickname for loop title
    const otherUserId = session.user1_id === userId ? session.user2_id : session.user1_id
    const { data: otherUser } = await supabase
      .from('users')
      .select('conversation_nickname, name')
      .eq('id', otherUserId)
      .single()

    const otherUserName = otherUser?.conversation_nickname || otherUser?.name || 'User'

    // Create Loop
    const loop = await createLoop({
      title: `Loop with ${otherUserName}`,
      visibilityLayer: 'private',
      growthEnabled: false, // Start private, can enable later
      pastActivityEnabled: true,
      feedSyncEnabled: true,
      createdBy: userId,
    })

    if (!loop) {
      return NextResponse.json(
        { success: false, error: 'Failed to create loop' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Add both users as participants
    await supabase
      .from('loop_participants')
      .insert([
        {
          loop_id: loop.id,
          user_id: userId,
          role: 'owner',
        },
        {
          loop_id: loop.id,
          user_id: otherUserId,
          role: 'member',
        },
      ])

    // Update matchmaking session to mark loop created
    await supabase
      .from('matchmaking_sessions')
      .update({
        status: 'matched',
        stay_connected_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    return NextResponse.json({
      success: true,
      loopId: loop.id,
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Create Loop From Match] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

