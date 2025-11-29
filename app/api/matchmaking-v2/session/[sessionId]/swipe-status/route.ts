export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * GET /api/matchmaking-v2/session/[sessionId]/swipe-status
 * Get swipe status for both users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID or user ID' },
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

    // Determine which user is which
    const isUser1 = session.user1_id === userId
    const otherUserSwipe = isUser1 ? session.user2_swipe : session.user1_swipe

    return NextResponse.json({
      success: true,
      userSwipe: isUser1 ? session.user1_swipe : session.user2_swipe,
      otherUserSwipe,
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Matchmaking V2 Swipe Status] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

