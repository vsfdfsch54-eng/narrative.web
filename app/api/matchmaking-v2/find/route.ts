export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'
import { calculateMatchScore } from '@/lib/matchmaking-scorer'

/**
 * POST /api/matchmaking-v2/find
 * Find a match based on mood, intention, and topic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mood, intention, topic } = body

    if (!userId || !mood || !intention || !topic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Get user's preferences for matching
    const { data: currentUser } = await supabase
      .from('users')
      .select('mood_preferences, intention_preferences, topic_preferences')
      .eq('id', userId)
      .single()

    // Find potential matches (users who are online and have compatible preferences)
    // For now, simplified - will be enhanced with proper matching algorithm
    const { data: potentialMatches, error: matchError } = await supabase
      .from('users')
      .select('id, conversation_nickname, mood_preferences, intention_preferences, topic_preferences')
      .neq('id', userId)
      .eq('schema_version', 'v2')
      .limit(20)

    if (matchError) {
      console.error('[Matchmaking V2] Error finding matches:', matchError)
      return NextResponse.json(
        { success: false, error: 'Failed to find matches' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    if (!potentialMatches || potentialMatches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matches found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Calculate match scores and find best match
    let bestMatch: any = null
    let bestScore = 0

    for (const candidate of potentialMatches) {
      // Get safety flags and block history
      const { data: safetyFlags } = await supabase
        .from('safety_flags')
        .select('*')
        .or(`user_id.eq.${userId},flagged_user_id.eq.${userId}`)

      // Calculate score
      const score = calculateMatchScore({
        user1Mood: mood,
        user2Mood: candidate.mood_preferences?.[0] || 'neutral',
        user1Intention: intention,
        user2Intention: candidate.intention_preferences?.[0] || 'talk',
        user1Topic: topic,
        user2Topic: candidate.topic_preferences?.[0] || 'deep-talk',
        user1Id: userId,
        user2Id: candidate.id,
        safetyFlags: safetyFlags || [],
      })

      if (score.totalScore > bestScore && score.totalScore >= 50) {
        bestScore = score.totalScore
        bestMatch = candidate
      }
    }

    if (!bestMatch) {
      return NextResponse.json(
        { success: false, error: 'No compatible matches found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Create matchmaking session
    const { data: session, error: sessionError } = await supabase
      .from('matchmaking_sessions')
      .insert({
        user1_id: userId,
        user2_id: bestMatch.id,
        mood,
        intention,
        topic,
        match_score: bestScore,
        status: 'preview',
        preview_started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[Matchmaking V2] Error creating session:', sessionError)
      return NextResponse.json(
        { success: false, error: 'Failed to create match session' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      matchUserId: bestMatch.id,
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Matchmaking V2] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

