export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * TEST ENDPOINT - Force match any two waiting users
 * This bypasses all logic and directly matches the first two users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get first two waiting users
    const { data: waitingUsers, error } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .order('created_at', { ascending: true })
      .limit(2)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!waitingUsers || waitingUsers.length < 2) {
      return NextResponse.json({ 
        message: `Only ${waitingUsers?.length || 0} user(s) waiting, need 2 to match`,
        waiting: waitingUsers?.length || 0
      })
    }

    const user1 = waitingUsers[0]
    const user2 = waitingUsers[1]

    const user1Id = user1.user_id < user2.user_id ? user1.user_id : user2.user_id
    const user2Id = user1.user_id < user2.user_id ? user2.user_id : user1.user_id

    // Create chat match
    const { data: chatMatch, error: matchError } = await supabase
      .from('chat_matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        user1_vibe: user1.vibe || null,
        user1_topic: user1.topic || null,
        user1_timeframe: user1.timeframe || null,
        user2_vibe: user2.vibe || null,
        user2_topic: user2.topic || null,
        user2_timeframe: user2.timeframe || null,
        status: 'active',
      })
      .select()
      .single()

    if (matchError) {
      return NextResponse.json({ 
        error: 'Failed to create match',
        details: matchError.message 
      }, { status: 500 })
    }

    // Update both pending matches
    const { error: updateError } = await supabase
      .from('pending_matches')
      .update({ status: 'matched', matched_at: new Date().toISOString() })
      .in('user_id', [user1.user_id, user2.user_id])

    if (updateError) {
      return NextResponse.json({ 
        error: 'Match created but failed to update pending matches',
        details: updateError.message,
        match: chatMatch
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Matched ${user1.user_id} with ${user2.user_id}`,
      match: chatMatch,
      user1: user1.user_id,
      user2: user2.user_id
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

