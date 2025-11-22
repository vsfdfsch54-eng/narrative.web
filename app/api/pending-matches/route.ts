export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// Helper function to clean stale rows
async function cleanStaleRows(supabase: ReturnType<typeof createServerClient>) {
  const twoMinutesAgo = new Date(Date.now() - 1000 * 60 * 2).toISOString()
  
  // Delete rows that are matched or null status
  const { error: deleteMatchedError } = await supabase
    .from('pending_matches')
    .delete()
    .or('status.eq.matched,status.is.null')
  
  // Delete rows older than 2 minutes
  const { error: deleteOldError } = await supabase
    .from('pending_matches')
    .delete()
    .lt('created_at', twoMinutesAgo)
  
  if (deleteMatchedError || deleteOldError) {
    console.error('[PendingMatches] Error cleaning stale rows:', deleteMatchedError || deleteOldError)
  } else {
    console.log('[PendingMatches] ✅ Cleaned stale rows')
  }
}

// POST - Create pending match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic, timeframe } = body

    console.log('[PendingMatches POST] Received request:', { userId, vibe, topic, timeframe })

    if (!userId) {
      console.error('[PendingMatches POST] ❌ Missing userId in request body')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()
    console.log('[PendingMatches POST] ✅ Service client created')

    // Clean stale rows before processing
    await cleanStaleRows(supabase)

    // Verify user exists in users table
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userCheckError || !userRecord) {
      console.error('[PendingMatches POST] ❌ User not found in users table:', userId)
      return NextResponse.json({ 
        error: 'User not found. Please complete signup first.',
        details: userCheckError?.message || 'User does not exist in database'
      }, { status: 404 })
    }

    console.log('[PendingMatches POST] ✅ User verified in database:', { id: userRecord.id, email: userRecord.email })

    // Close any existing active chat matches for this user
    const { error: closeMatchesError } = await supabase
      .from('chat_matches')
      .update({ status: 'ended' })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')

    if (closeMatchesError) {
      console.error('[PendingMatches POST] Failed to close active matches:', closeMatchesError)
    } else {
      console.log('[PendingMatches POST] Closed previous active matches for this user')
    }

    // BEFORE inserting: Clean ONLY this user's old rows
    await supabase.from('pending_matches').delete().eq('user_id', userId)
    console.log('[PendingMatches POST] Cleaned old rows for user:', userId)

    // Create new pending match
    const insertData = {
      user_id: userId,
      vibe: vibe || null,
      topic: topic || null,
      timeframe: timeframe || null,
      status: 'searching',
    }
    console.log('[PendingMatches POST] Inserting pending match:', insertData)
    
    const { data: pendingMatch, error: insertError } = await supabase
      .from('pending_matches')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('[PendingMatches POST] ❌ Error creating pending match:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create pending match', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    console.log(`[PendingMatches POST] ✅ User ${userId} added to queue:`, pendingMatch)

    // Small delay for database propagation
    await new Promise(resolve => setTimeout(resolve, 200))

    // Try immediate match with another FRESH user (within last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 1000 * 60 * 2).toISOString()
    const { data: otherPendingMatches } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .neq('user_id', userId)
      .gte('created_at', twoMinutesAgo)
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
            // ALWAYS update both users' status to matched
            await supabase
              .from('pending_matches')
              .update({ status: 'matched', matched_at: new Date().toISOString() })
              .in('user_id', [userId, otherUserId])

            console.log(`[PendingMatches POST] ✅ Immediate match (existing): ${userId} <-> ${otherUserId}`)
            return NextResponse.json({ 
              success: true, 
              matched: true,
              match: existingMatch,
              otherUserId: otherUserId 
            })
          }
        }
        console.error('[PendingMatches POST] Error creating match:', matchError)
      } else if (chatMatch) {
        // ALWAYS update both users' status to matched
        const { error: updateError } = await supabase
          .from('pending_matches')
          .update({ status: 'matched', matched_at: new Date().toISOString() })
          .in('user_id', [userId, otherUserId])

        if (updateError) {
          console.error('[PendingMatches POST] ⚠️ Error updating status but match created:', updateError)
          // Retry update
          await supabase
            .from('pending_matches')
            .update({ status: 'matched', matched_at: new Date().toISOString() })
            .in('user_id', [userId, otherUserId])
        }

        console.log(`[PendingMatches POST] ✅ Immediate match: ${userId} <-> ${otherUserId}`)
        return NextResponse.json({ 
          success: true, 
          matched: true,
          match: chatMatch,
          otherUserId: otherUserId 
        })
      }
    }

    // No immediate match - trigger matchmaking processor
    console.log(`[PendingMatches POST] No immediate match, triggering matchmaking processor...`)
    
    const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || (origin.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${origin.replace(/^https?:\/\//, '')}`
    
    try {
      const matchmakingResponse = await fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (matchmakingResponse.ok) {
        const matchmakingData = await matchmakingResponse.json()
        console.log(`[PendingMatches POST] Matchmaking processor result:`, matchmakingData)
      }
    } catch (err) {
      console.error('[PendingMatches POST] Error calling matchmaking processor:', err)
    }
    
    // Wait for database updates
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check if user was matched
    const { data: finalCheck } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (finalCheck && finalCheck.status === 'matched') {
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
          console.log(`[PendingMatches POST] ✅ User was matched: ${userId} <-> ${otherUserId}`)
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        }
      }
    }

    // User is in queue
    console.log(`[PendingMatches POST] ✅ User ${userId} in queue`)
    return NextResponse.json({ 
      success: true, 
      inQueue: true,
      pendingMatch: finalCheck || pendingMatch,
      message: 'Added to queue. Matching in progress...' 
    })
  } catch (error) {
    console.error('[PendingMatches POST] Error:', error)
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
      console.error('[PendingMatches DELETE] Error removing from pending matches:', error)
      return NextResponse.json({ error: 'Failed to remove from pending matches' }, { status: 500 })
    }

    console.log(`[PendingMatches DELETE] ✅ Removed user ${userId} from queue`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PendingMatches DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
