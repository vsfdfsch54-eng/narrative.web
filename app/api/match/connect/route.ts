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
 * POST /api/match/connect
 * When user A presses Connect on user B:
 * 1. Insert pending connection into match_queue
 * 2. Check if user B has already connected with user A (mutual match)
 * 3. If mutual match: create match, create chat room, notify both users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetId } = body

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'Missing userId or targetId' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    if (userId === targetId) {
      return NextResponse.json(
        { error: 'Cannot connect with yourself' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('match_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Match Connect] Error checking existing connection:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // If connection already exists and is matched, return success
    if (existingConnection && existingConnection.status === 'matched') {
      return NextResponse.json({
        success: true,
        matched: true,
        message: 'Already matched',
      }, { headers: getCorsHeaders() })
    }

    // Insert or update connection as pending
    const { data: connection, error: insertError } = await supabase
      .from('match_queue')
      .upsert({
        user_id: userId,
        target_id: targetId,
        status: 'pending',
      }, {
        onConflict: 'user_id,target_id',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Match Connect] Error inserting connection:', insertError)
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    // Check for mutual match (user B has already connected with user A)
    const { data: mutualConnection, error: mutualError } = await supabase
      .from('match_queue')
      .select('*')
      .eq('user_id', targetId)
      .eq('target_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (mutualError && mutualError.code !== 'PGRST116') {
      console.error('[Match Connect] Error checking mutual connection:', mutualError)
      // Continue - not a critical error
    }

    // If mutual match found, create match and chat room
    if (mutualConnection) {
      // Create chat match
      const { data: match, error: matchError } = await supabase
        .from('chat_matches')
        .insert({
          user1_id: userId,
          user2_id: targetId,
          status: 'active',
          matched_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (matchError) {
        console.error('[Match Connect] Error creating match:', matchError)
        return NextResponse.json(
          { error: 'Failed to create match' },
          { status: 500, headers: getCorsHeaders() }
        )
      }

      // Create chat room
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user1_id: userId,
          user2_id: targetId,
        })
        .select()
        .single()

      if (chatError) {
        console.error('[Match Connect] Error creating chat room:', chatError)
        // Continue - match is created, chat can be created later
      }

      // Update both match_queue entries to 'matched'
      await supabase
        .from('match_queue')
        .update({ status: 'matched' })
        .or(`id.eq.${connection.id},id.eq.${mutualConnection.id}`)

      // Create notifications for both users
      try {
        await supabase.rpc('create_notification', {
          p_user_id: userId,
          p_sender_id: targetId,
          p_type: 'match_found',
          p_title: 'New Match!',
          p_body: `You matched with ${targetId}`,
          p_metadata: { otherUserId: targetId, matchId: match.id, roomId: chat?.room_id },
        })

        await supabase.rpc('create_notification', {
          p_user_id: targetId,
          p_sender_id: userId,
          p_type: 'match_found',
          p_title: 'New Match!',
          p_body: `You matched with ${userId}`,
          p_metadata: { otherUserId: userId, matchId: match.id, roomId: chat?.room_id },
        })
      } catch (notifError) {
        console.error('[Match Connect] Error creating notifications:', notifError)
        // Continue - notifications are not critical
      }

      return NextResponse.json({
        success: true,
        matched: true,
        matchId: match.id,
        roomId: chat?.room_id || null,
        message: 'Match found!',
      }, { headers: getCorsHeaders() })
    }

    // No mutual match yet - just pending connection
    return NextResponse.json({
      success: true,
      matched: false,
      message: 'Connection pending',
    }, { headers: getCorsHeaders() })

  } catch (error) {
    console.error('[Match Connect] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

