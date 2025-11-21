export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// Helper function to run matchmaking synchronously
async function runMatchmaking(supabase: ReturnType<typeof createServerClient>) {
  try {
    // Get all users waiting for a match
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('[Matchmaking] Error fetching waiting users:', fetchError)
      return { matched: 0 }
    }

    if (!waitingUsers || waitingUsers.length < 2) {
      return { matched: 0, waiting: waitingUsers?.length || 0 }
    }

    console.log(`[Matchmaking] Processing ${waitingUsers.length} waiting users`)

    let matchedCount = 0
    const processedUserIds = new Set<string>()

    // Match users in pairs
    for (let i = 0; i < waitingUsers.length - 1; i += 2) {
      const user1 = waitingUsers[i]
      const user2 = waitingUsers[i + 1]

      if (processedUserIds.has(user1.user_id) || processedUserIds.has(user2.user_id)) {
        continue
      }

      const user1Id = user1.user_id < user2.user_id ? user1.user_id : user2.user_id
      const user2Id = user1.user_id < user2.user_id ? user2.user_id : user1.user_id
      const isUser1First = user1.user_id === user1Id

      // Create chat match
      const { data: chatMatch, error: matchError } = await supabase
        .from('chat_matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          user1_vibe: isUser1First ? (user1.vibe || null) : (user2.vibe || null),
          user1_topic: isUser1First ? (user1.topic || null) : (user2.topic || null),
          user1_timeframe: isUser1First ? (user1.timeframe || null) : (user2.timeframe || null),
          user2_vibe: isUser1First ? (user2.vibe || null) : (user1.vibe || null),
          user2_topic: isUser1First ? (user2.topic || null) : (user1.topic || null),
          user2_timeframe: isUser1First ? (user2.timeframe || null) : (user1.timeframe || null),
          status: 'active',
        })
        .select()
        .single()

      if (matchError) {
        if (matchError.code === '23505' || matchError.message.includes('duplicate')) {
          // Match already exists, just update pending statuses
          await supabase
            .from('pending_matches')
            .update({ status: 'matched', matched_at: new Date().toISOString() })
            .in('user_id', [user1.user_id, user2.user_id])
          matchedCount++
          processedUserIds.add(user1.user_id)
          processedUserIds.add(user2.user_id)
          console.log(`[Matchmaking] ✅ Matched existing: ${user1.user_id} <-> ${user2.user_id}`)
        } else {
          console.error(`[Matchmaking] Error creating match:`, matchError)
        }
        continue
      }

      if (chatMatch) {
        // Update both pending matches to matched
        const { error: updateError } = await supabase
          .from('pending_matches')
          .update({ status: 'matched', matched_at: new Date().toISOString() })
          .in('user_id', [user1.user_id, user2.user_id])

        if (updateError) {
          console.error(`[Matchmaking] Error updating pending:`, updateError)
        }

        matchedCount++
        processedUserIds.add(user1.user_id)
        processedUserIds.add(user2.user_id)
        console.log(`[Matchmaking] ✅ Matched: ${user1.user_id} <-> ${user2.user_id}`)
      }
    }

    return { matched: matchedCount }
  } catch (error) {
    console.error('[Matchmaking] Error:', error)
    return { matched: 0 }
  }
}

// POST - Create pending match and try to match immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic, timeframe } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Remove any existing pending match for this user
    await supabase.from('pending_matches').delete().eq('user_id', userId)

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
      console.error('[PendingMatches] Error creating pending match:', insertError)
      return NextResponse.json({ error: 'Failed to create pending match' }, { status: 500 })
    }

    console.log(`[PendingMatches] User ${userId} added to queue`)

    // Immediately try to find another user
    const { data: otherPendingMatches } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (otherPendingMatches && otherPendingMatches.length > 0) {
      const otherMatch = otherPendingMatches[0]
      const otherUserId = otherMatch.user_id

      const user1Id = userId < otherUserId ? userId : otherUserId
      const user2Id = userId < otherUserId ? otherUserId : userId
      const isUser1 = userId === user1Id

      // Create chat match
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
        if (matchError.code === '23505' || matchError.message.includes('duplicate')) {
          const { data: existingMatch } = await supabase
            .from('chat_matches')
            .select('*')
            .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
            .single()

          if (existingMatch) {
            await supabase
              .from('pending_matches')
              .update({ status: 'matched', matched_at: new Date().toISOString() })
              .in('user_id', [userId, otherUserId])

            console.log(`[PendingMatches] ✅ Immediate match (existing): ${userId} <-> ${otherUserId}`)
            return NextResponse.json({ 
              success: true, 
              matched: true,
              match: existingMatch,
              otherUserId: otherUserId 
            })
          }
        }
        console.error('[PendingMatches] Error creating match:', matchError)
      } else if (chatMatch) {
        await supabase
          .from('pending_matches')
          .update({ status: 'matched', matched_at: new Date().toISOString() })
          .in('user_id', [userId, otherUserId])

        console.log(`[PendingMatches] ✅ Immediate match: ${userId} <-> ${otherUserId}`)
        return NextResponse.json({ 
          success: true, 
          matched: true,
          match: chatMatch,
          otherUserId: otherUserId 
        })
      }
    }

    // No immediate match - run matchmaking processor synchronously
    console.log(`[PendingMatches] No immediate match, running matchmaking processor...`)
    const matchmakingResult = await runMatchmaking(supabase)
    
    // Check if current user was matched by the processor
    const { data: updatedPendingMatch } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (updatedPendingMatch && updatedPendingMatch.status === 'matched') {
      // User was matched! Find the chat match
      const { data: matches } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matches) {
        const match = Array.isArray(matches) ? matches[0] : matches
        if (match) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
          console.log(`[PendingMatches] ✅ Processor matched: ${userId} <-> ${otherUserId}`)
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        }
      }
    }

    console.log(`[PendingMatches] User ${userId} in queue (${matchmakingResult.matched} pairs matched by processor)`)
    return NextResponse.json({ 
      success: true, 
      inQueue: true,
      pendingMatch: pendingMatch,
      message: 'Added to queue. Matching in progress...' 
    })
  } catch (error) {
    console.error('[PendingMatches] Error in POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check if user is matched (for polling)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // First, run matchmaking processor to catch any waiting pairs
    await runMatchmaking(supabase)

    // Check if user's pending match was matched
    const { data: pendingMatch, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('[PendingMatches] Error checking pending match:', pendingError)
      return NextResponse.json({ success: true, matched: false, inQueue: false })
    }

    if (pendingMatch && pendingMatch.status === 'matched') {
      // User was matched! Find the chat match
      const { data: matches } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matches) {
        const match = Array.isArray(matches) ? matches[0] : matches
        if (match) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
          await supabase.from('pending_matches').delete().eq('user_id', userId)
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        }
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
    console.error('[PendingMatches] Error in GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove user from pending matches
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('pending_matches').delete().eq('user_id', userId)

    if (error) {
      console.error('[PendingMatches] Error removing from pending matches:', error)
      return NextResponse.json({ error: 'Failed to remove from pending matches' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PendingMatches] Error in DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
