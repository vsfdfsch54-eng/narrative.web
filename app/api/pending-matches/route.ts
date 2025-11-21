export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// POST - Create pending match and try to match immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic, timeframe } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Remove any existing pending match for this user
    await supabase
      .from('pending_matches')
      .delete()
      .eq('user_id', userId)

    // Create new pending match
    const { data: pendingMatch, error: insertError } = await supabase
      .from('pending_matches')
      .insert({
        user_id: userId,
        vibe: vibe || null,
        topic: topic || null,
        timeframe: timeframe || null,
        status: 'searching',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating pending match:', insertError)
      return NextResponse.json(
        { error: 'Failed to create pending match' },
        { status: 500 }
      )
    }

    // Immediately try to find another user searching for a match (FIFO)
    const { data: otherPendingMatches, error: searchError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .neq('user_id', userId)
      .order('created_at', { ascending: true }) // FIFO: oldest first
      .limit(1)

    if (searchError) {
      console.error('Error searching for matches:', searchError)
      return NextResponse.json({ 
        success: true, 
        inQueue: true,
        pendingMatch: pendingMatch,
        message: 'Added to queue, waiting for match...' 
      })
    }

    if (otherPendingMatches && otherPendingMatches.length > 0) {
      // Found a match! Pair them up
      const otherMatch = otherPendingMatches[0]
      const otherUserId = otherMatch.user_id

      // Use consistent UUID ordering for chat_matches
      const user1Id = userId < otherUserId ? userId : otherUserId
      const user2Id = userId < otherUserId ? otherUserId : userId

      // Determine which user is user1 and which is user2
      const isUser1 = userId === user1Id

      // Create chat match with both users' selections
      const { data: chatMatch, error: matchError } = await supabase
        .from('chat_matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          user1_vibe: isUser1 ? (vibe || null) : (otherMatch.vibe || null),
          user1_topic: isUser1 ? (topic || null) : (otherMatch.topic || null),
          user1_timeframe: isUser1 ? (timeframe || null) : (otherMatch.timeframe || null),
          user2_vibe: isUser1 ? (otherMatch.vibe || null) : (vibe || null),
          user2_topic: isUser1 ? (otherMatch.topic || null) : (topic || null),
          user2_timeframe: isUser1 ? (otherMatch.timeframe || null) : (timeframe || null),
          status: 'active',
        })
        .select()
        .single()

      if (matchError) {
        // If duplicate, try to get existing match
        if (matchError.code === '23505' || matchError.message.includes('duplicate')) {
          const { data: existingMatch } = await supabase
            .from('chat_matches')
            .select('*')
            .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
            .single()

          if (existingMatch) {
            // Update both pending matches to matched
            await supabase
              .from('pending_matches')
              .update({ status: 'matched', matched_at: new Date().toISOString() })
              .in('user_id', [userId, otherUserId])

            return NextResponse.json({ 
              success: true, 
              matched: true,
              match: existingMatch,
              otherUserId: otherUserId 
            })
          }
        }
        console.error('Error creating chat match:', matchError)
        return NextResponse.json({ 
          success: true, 
          inQueue: true,
          pendingMatch: pendingMatch,
          message: 'Error creating match, staying in queue...' 
        })
      }

      // Update both pending matches to matched
      await supabase
        .from('pending_matches')
        .update({ status: 'matched', matched_at: new Date().toISOString() })
        .in('user_id', [userId, otherUserId])

      return NextResponse.json({ 
        success: true, 
        matched: true,
        match: chatMatch,
        otherUserId: otherUserId 
      })
    }

    // No match found, user is in queue
    return NextResponse.json({ 
      success: true, 
      inQueue: true,
      pendingMatch: pendingMatch,
      message: 'Waiting for another user...' 
    })
  } catch (error) {
    console.error('Error in POST /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Check if user is matched (for polling)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Check if user's pending match was matched
    const { data: pendingMatch, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pendingError && pendingError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking pending match:', pendingError)
      return NextResponse.json({ success: true, matched: false, inQueue: false })
    }

    if (pendingMatch && pendingMatch.status === 'matched') {
      // User was matched! Find the chat match
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!matchesError && matches && matches.length > 0) {
        const match = matches[0]
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

        // Clean up pending match
        await supabase.from('pending_matches').delete().eq('user_id', userId)

        return NextResponse.json({ 
          success: true, 
          matched: true,
          match: match,
          otherUserId: otherUserId 
        })
      }
    }

    // Check if still in queue
    if (pendingMatch && pendingMatch.status === 'searching') {
      return NextResponse.json({ 
        success: true, 
        matched: false,
        inQueue: true 
      })
    }

    return NextResponse.json({ 
      success: true, 
      matched: false,
      inQueue: false 
    })
  } catch (error) {
    console.error('Error in GET /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user from pending matches
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('pending_matches')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing from pending matches:', error)
      return NextResponse.json(
        { error: 'Failed to remove from pending matches' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

