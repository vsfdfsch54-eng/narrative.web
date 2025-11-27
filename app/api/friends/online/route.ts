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
 * GET /api/friends/online
 * Returns online friends grouped by tier (community, innerCircle, closeFriends)
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
      console.error('[Friends Online] Error fetching relationships:', relError)
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        success: true,
        community: [],
        innerCircle: [],
        closeFriends: [],
      }, { headers: getCorsHeaders() })
    }

    // Get friend IDs
    const friendIds = relationships.map(r => r.user2_id)

    // Get online presence for friends
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select('user_id, is_online')
      .in('user_id', friendIds)
      .eq('is_online', true)

    if (presenceError) {
      console.error('[Friends Online] Error fetching presence:', presenceError)
    }

    const onlineFriendIds = new Set(
      (presenceData || []).map(p => p.user_id)
    )

    // Get user details for online friends
    const { data: onlineUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', Array.from(onlineFriendIds))

    if (usersError) {
      console.error('[Friends Online] Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Group by tier
    const community: any[] = []
    const innerCircle: any[] = []
    const closeFriends: any[] = []

    relationships.forEach(rel => {
      if (!onlineFriendIds.has(rel.user2_id)) return

      const user = onlineUsers?.find(u => u.id === rel.user2_id)
      if (!user) return

      const friendData = {
        id: user.id,
        name: user.name,
        avatar: user.avatar_url || '👤',
      }

      if (rel.relationship_tier === 'community') {
        community.push(friendData)
      } else if (rel.relationship_tier === 'inner_circle') {
        innerCircle.push(friendData)
      } else if (rel.relationship_tier === 'close_friend') {
        closeFriends.push(friendData)
      }
    })

    return NextResponse.json({
      success: true,
      community,
      innerCircle,
      closeFriends,
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Friends Online] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

