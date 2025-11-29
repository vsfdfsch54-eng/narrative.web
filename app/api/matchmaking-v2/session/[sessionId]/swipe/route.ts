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
      // Both swiped right - create Loop automatically
      try {
        // Get other user ID
        const otherUserId = isUser1 ? session.user2_id : session.user1_id
        
        // Get other user's name for loop title
        const { data: otherUser } = await supabase
          .from('users')
          .select('conversation_nickname, name')
          .eq('id', otherUserId)
          .single()

        const otherUserName = otherUser?.conversation_nickname || otherUser?.name || 'User'

        // Create Loop
        const { createLoop } = await import('@/lib/loops-helpers')
        const loop = await createLoop({
          title: `Loop with ${otherUserName}`,
          visibilityLayer: 'private',
          growthEnabled: false,
          pastActivityEnabled: true,
          feedSyncEnabled: true,
          createdBy: userId,
        })

        if (loop) {
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
        }

        // Update status to matched
        await supabase
          .from('matchmaking_sessions')
          .update({
            status: 'matched',
            stay_connected_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      } catch (loopError) {
        console.error('[Matchmaking V2 Swipe] Error creating loop:', loopError)
        // Continue even if loop creation fails
      }
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

