export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * POST /api/typing
 * Update typing status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, userId, isTyping } = body

    if (!matchId || !userId || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing matchId, userId, or isTyping' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert typing status
    const { error } = await supabase
      .from('typing_status')
      .upsert({
        match_id: matchId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'match_id,user_id',
      })

    if (error) {
      console.error('[Typing] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update typing status', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Typing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/typing
 * Get typing status for a user in a match
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const userId = searchParams.get('userId')

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'Missing matchId or userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('typing_status')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Typing] Error:', error)
      return NextResponse.json(
        { error: 'Failed to get typing status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || { is_typing: false },
    })
  } catch (error: any) {
    console.error('[Typing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

