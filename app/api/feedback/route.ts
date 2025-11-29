export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/feedback
 * Submit feedback (V2 structure)
 * 
 * Body:
 * - target_user_id: UUID (optional, for user feedback)
 * - target_loop_id: UUID (optional, for loop feedback)
 * - target_event_id: UUID (optional, for event feedback)
 * - target_session_id: UUID (optional, for matchmaking session feedback)
 * - feedback_type: 'user' | 'loop' | 'event' | 'matchmaking' | 'call'
 * - rating: number (1-5)
 * - tags: string[] (optional)
 * - notes: string (optional)
 * - userId: UUID (the user submitting feedback)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      target_user_id,
      target_loop_id,
      target_event_id,
      target_session_id,
      feedback_type,
      rating,
      tags,
      notes,
      userId,
    } = body

    if (!userId || !feedback_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, feedback_type' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    // Validate feedback_type
    const validTypes = ['user', 'loop', 'event', 'matchmaking', 'call']
    if (!validTypes.includes(feedback_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid feedback_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    // Validate at least one target is provided
    if (!target_user_id && !target_loop_id && !target_event_id && !target_session_id) {
      return NextResponse.json(
        { success: false, error: 'At least one target (target_user_id, target_loop_id, target_event_id, or target_session_id) must be provided' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Store feedback in ai_signals table (V2 structure)
    const { data, error } = await supabase
      .from('ai_signals')
      .insert({
        user_id: userId,
        signal_type: 'feedback',
        signal_data: {
          target_user_id: target_user_id || null,
          target_loop_id: target_loop_id || null,
          target_event_id: target_event_id || null,
          target_session_id: target_session_id || null,
          feedback_type,
          rating: rating || null,
          tags: tags || [],
          notes: notes || null,
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/feedback] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to submit feedback' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/feedback] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}
