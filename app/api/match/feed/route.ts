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
 * Excludes already matched users and users already connected with
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

    // Get all users the current user has already matched with
    const { data: existingMatches, error: matchesError } = await supabase
      .from('chat_matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')

    if (matchesError) {
      console.error('[Match Feed] Error fetching existing matches:', matchesError)
    }

    const matchedUserIds = new Set<string>()
    if (existingMatches) {
      existingMatches.forEach(match => {
        if (match.user1_id === userId) {
          matchedUserIds.add(match.user2_id)
        } else {
          matchedUserIds.add(match.user1_id)
        }
      })
    }

    // Get all users the current user has pending connections with
    const { data: pendingConnections, error: pendingError } = await supabase
      .from('match_queue')
      .select('target_id')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (pendingError) {
      console.error('[Match Feed] Error fetching pending connections:', pendingError)
    }

    const pendingUserIds = new Set<string>()
    if (pendingConnections) {
      pendingConnections.forEach(conn => pendingUserIds.add(conn.target_id))
    }

    // Get current user's vibe and topic for preference matching
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('vibe, topic')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[Match Feed] Error fetching current user:', userError)
    }

    // Build exclusion list
    const excludeIds = Array.from(new Set([userId, ...matchedUserIds, ...pendingUserIds]))

    // Fetch potential matches
    // Prefer users with same vibe/topic, fallback to any active user
    let query = supabase
      .from('users')
      .select('id, name, interests, vibe, topic, reputation_emojis, communities')
      .neq('id', userId)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(50)

    // If user has vibe/topic, prefer matching those
    if (currentUser?.vibe || currentUser?.topic) {
      // First try to get users with matching vibe/topic
      const { data: preferredMatches, error: preferredError } = await query
        .or(`vibe.eq.${currentUser.vibe || ''},topic.eq.${currentUser.topic || ''}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!preferredError && preferredMatches && preferredMatches.length > 0) {
        // Shuffle and return preferred matches
        const shuffled = preferredMatches.sort(() => Math.random() - 0.5)
        return NextResponse.json({
          success: true,
          profiles: shuffled.map(formatProfile),
        }, { headers: getCorsHeaders() })
      }
    }

    // Fallback: Get any active users (active in last 48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    const { data: allMatches, error: allError } = await supabase
      .from('users')
      .select('id, name, interests, vibe, topic, reputation_emojis, communities')
      .neq('id', userId)
      .not('id', 'in', `(${excludeArray.join(',')})`)
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    if (allError) {
      console.error('[Match Feed] Error fetching all matches:', allError)
      return NextResponse.json(
        { error: 'Failed to fetch match feed' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Shuffle results for variety
    const shuffled = (allMatches || []).sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      profiles: shuffled.map(formatProfile),
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Match Feed] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

function formatProfile(user: any) {
  return {
    id: user.id,
    name: user.name || 'User',
    interests: Array.isArray(user.interests) ? user.interests : [],
    vibe: user.vibe || null,
    topic: user.topic || null,
    reputation_emojis: Array.isArray(user.reputation_emojis) ? user.reputation_emojis : [],
    communities: Array.isArray(user.communities) ? user.communities : [],
    mutual_friends: 0, // TODO: Calculate from relationships table
    mutual_communities: 0, // TODO: Calculate from communities
  }
}

