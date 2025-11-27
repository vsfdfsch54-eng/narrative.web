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
 * GET /api/friends/offline
 * Returns offline friends (all tiers combined)
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

    // Get all relationships for this user
    const { data: relationships, error: relError } = await supabase
      .from('relationships')
      .select('user2_id, relationship_tier')
      .eq('user1_id', userId)

    if (relError) {
      console.error('[Friends Offline] Error fetching relationships:', relError)
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        success: true,
        friends: [],
      }, { headers: getCorsHeaders() })
    }

    // Get friend IDs
    const friendIds = relationships.map(r => r.user2_id)

    // Get offline presence for friends (is_online = false OR not in presence table)
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select('user_id, is_online')
      .in('user_id', friendIds)
      .eq('is_online', false)

    if (presenceError) {
      console.error('[Friends Offline] Error fetching presence:', presenceError)
    }

    const onlineFriendIds = new Set(
      (presenceData || []).filter(p => p.is_online).map(p => p.user_id)
    )

    // Get all friends, then filter out online ones
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', friendIds)

    if (usersError) {
      console.error('[Friends Offline] Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Filter to only offline friends
    const offlineFriends = (allUsers || [])
      .filter(user => !onlineFriendIds.has(user.id))
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar_url || '👤',
      }))

    return NextResponse.json({
      success: true,
      friends: offlineFriends,
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Friends Offline] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

