export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * GET /api/match/feed
 * Returns a feed of potential matches for the user
 * STRICT REQUIREMENT: Only returns online users (is_online = true, last_seen_at within 5 min)
 * Uses single RPC call for high performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId query parameter' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Single RPC call - all filtering done in SQL
    const { data, error } = await supabase.rpc('get_online_match_feed', {
      current_user_id: userId,
    })

    if (error) {
      console.error('[Match Feed] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch match feed', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Format profiles for frontend
    const profiles = (data || []).map((user: any) => ({
      id: user.id,
      name: user.name || 'User',
      interests: Array.isArray(user.interests) ? user.interests : [],
      mood: user.mood || null,
      topic: user.topic || null,
      reputation_emojis: Array.isArray(user.reputation_emojis) ? user.reputation_emojis : [],
      communities: Array.isArray(user.communities) ? user.communities : [],
      mutual_friends: 0, // TODO: Calculate from relationships table
      mutual_communities: 0, // TODO: Calculate from communities
    }))

    return NextResponse.json({
      success: true,
      profiles,
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Match Feed] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}
