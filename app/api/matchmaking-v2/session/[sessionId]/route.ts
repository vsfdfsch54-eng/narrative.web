export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * GET /api/matchmaking-v2/session/[sessionId]
 * Get match session details and profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID' },
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

    // Get other user's profile
    const otherUserId = session.user1_id // Simplified - should determine based on current user
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, conversation_nickname, mood_preferences, intention_preferences, topic_preferences')
      .eq('id', otherUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Calculate shared topics
    const sharedTopics = (profile.topic_preferences || []).filter((t: string) =>
      (session.topic || '').includes(t)
    )

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        nickname: profile.conversation_nickname || 'User',
        mood: session.mood,
        intention: session.intention,
        topic: session.topic,
        compatibilityScore: Math.round(session.match_score || 0),
        sharedTopics,
      },
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Matchmaking V2 Session] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

