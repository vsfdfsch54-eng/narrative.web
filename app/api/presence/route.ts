export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * POST /api/presence
 * Update user presence (online/offline)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, isOnline, currentMatchId } = body

    if (!userId || typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing userId or isOnline' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert presence
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
        current_match_id: currentMatchId || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('[Presence] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update presence', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Presence] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/presence
 * Get user presence
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Presence] Error:', error)
      return NextResponse.json(
        { error: 'Failed to get presence' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || {
        is_online: false,
        last_seen_at: null,
      },
    })
  } catch (error: any) {
    console.error('[Presence] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

