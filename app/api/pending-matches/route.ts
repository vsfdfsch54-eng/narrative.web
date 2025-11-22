export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// POST - Create pending match and try to match immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic, timeframe } = body

    console.log('[PendingMatches POST] Received request:', { userId, vibe, topic, timeframe })

    if (!userId) {
      console.error('[PendingMatches POST] ❌ Missing userId in request body')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Check if service role key is available
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('[PendingMatches POST] Service role key available:', hasServiceKey)
    
    if (!hasServiceKey) {
      console.error('[PendingMatches POST] ❌ SUPABASE_SERVICE_ROLE_KEY is missing!')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing service role key' 
      }, { status: 500 })
    }

    const supabase = createServerClient()
    console.log('[PendingMatches POST] ✅ Service client created')

    // CRITICAL: Verify user exists in users table (foreign key constraint)
    const { data: userRecord, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userCheckError || !userRecord) {
      console.error('[PendingMatches POST] ❌ User not found in users table:', userId)
      console.error('[PendingMatches POST] User check error:', userCheckError)
      return NextResponse.json({ 
        error: 'User not found. Please complete signup first.',
        details: userCheckError?.message || 'User does not exist in database'
      }, { status: 404 })
    }

    console.log('[PendingMatches POST] ✅ User verified in database:', { id: userRecord.id, email: userRecord.email })

    // Remove any existing pending match for this user
    const deleteResult = await supabase.from('pending_matches').delete().eq('user_id', userId)
    if (deleteResult.error) {
      console.log('[PendingMatches POST] Delete existing match error:', deleteResult.error)
    } else {
      console.log('[PendingMatches POST] Deleted existing pending match (if any)')
    }

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
      console.error('[PendingMatches POST] Error details:', JSON.stringify(insertError, null, 2))
      console.error('[PendingMatches POST] Error code:', insertError.code)
      console.error('[PendingMatches POST] Error message:', insertError.message)
      console.error('[PendingMatches POST] Error hint:', insertError.hint)
      return NextResponse.json({ 
        error: 'Failed to create pending match', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    console.log(`[PendingMatches POST] ✅ User ${userId} added to queue:`, pendingMatch)

    // CRITICAL: Verify the insert actually worked by querying it back (with retry)
    let verifyInsert = null
    for (let verifyAttempt = 0; verifyAttempt < 5; verifyAttempt++) {
      const { data, error } = await supabase
        .from('pending_matches')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        verifyInsert = data
        console.log(`[PendingMatches POST] ✅ Verified pending match exists (attempt ${verifyAttempt + 1}):`, verifyInsert)
        break
      }
      
      if (verifyAttempt < 4) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    if (!verifyInsert) {
      console.error(`[PendingMatches POST] ❌ CRITICAL: Insert verification failed after 5 attempts!`)
      console.error(`[PendingMatches POST] Returning success anyway - insert appeared to succeed`)
    }

    // Small delay to ensure database write has propagated
    await new Promise(resolve => setTimeout(resolve, 200))

    // Immediately try to find another user (with retry)
    let otherPendingMatches = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('pending_matches')
        .select('*')
        .eq('status', 'searching')
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
      
      if (error) {
        console.error(`[PendingMatches POST] Error finding other users (attempt ${attempt + 1}):`, error)
      } else {
        otherPendingMatches = data
        if (otherPendingMatches && otherPendingMatches.length > 0) {
          break
        }
      }
      
      // Wait a bit before retry
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

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
        await supabase
          .from('pending_matches')
          .update({ status: 'matched', matched_at: new Date().toISOString() })
          .in('user_id', [userId, otherUserId])

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
    
    // Call matchmaking processor endpoint
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
    
    // Wait for database updates to propagate
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check if current user was matched by the processor (with retries)
    let updatedPendingMatch = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('pending_matches')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error(`[PendingMatches POST] Error checking match status (attempt ${attempt + 1}):`, error)
      } else {
        updatedPendingMatch = data
        if (updatedPendingMatch) {
          console.log(`[PendingMatches POST] Found pending match (attempt ${attempt + 1}):`, updatedPendingMatch.status)
          if (updatedPendingMatch.status === 'matched') {
            break
          }
        }
      }
      
      if (attempt < 4) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (updatedPendingMatch && updatedPendingMatch.status === 'matched') {
      // User was matched! Find the chat match
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matchesError) {
        console.error('[PendingMatches POST] Error finding chat match:', matchesError)
      } else if (matches) {
        const match = Array.isArray(matches) ? matches[0] : matches
        if (match) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
          console.log(`[PendingMatches POST] ✅ Processor matched: ${userId} <-> ${otherUserId}`)
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        }
      }
    }

    // Final check - verify user is still in queue
    const { data: finalCheck } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (finalCheck && finalCheck.status === 'searching') {
      console.log(`[PendingMatches POST] ✅ User ${userId} confirmed in queue (status: searching)`)
      return NextResponse.json({ 
        success: true, 
        inQueue: true,
        pendingMatch: finalCheck,
        message: 'Added to queue. Matching in progress...' 
      })
    } else if (finalCheck && finalCheck.status === 'matched') {
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
          console.log(`[PendingMatches POST] ✅ User was matched during processing: ${userId} <-> ${otherUserId}`)
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        }
      }
    }

    console.log(`[PendingMatches POST] ⚠️ User ${userId} final status:`, finalCheck?.status || 'not found')
    return NextResponse.json({ 
      success: true, 
      inQueue: !!finalCheck && finalCheck.status === 'searching',
      pendingMatch: finalCheck || pendingMatch,
      message: finalCheck ? 'Processing...' : 'Added to queue. Matching in progress...' 
    })
  } catch (error) {
    console.error('[PendingMatches POST] Error in POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check if user is matched (for polling)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  console.log('[PendingMatches GET] Request received for userId:', userId)

  if (!userId) {
    console.error('[PendingMatches GET] ❌ Missing userId query parameter')
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // First, trigger matchmaking processor to catch any waiting pairs
    const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || (origin.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${origin.replace(/^https?:\/\//, '')}`
    
    try {
      console.log(`[PendingMatches GET] Triggering matchmaking processor for user ${userId}`)
      const matchmakingResponse = await fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (matchmakingResponse.ok) {
        const matchmakingData = await matchmakingResponse.json()
        console.log(`[PendingMatches GET] Matchmaking result:`, matchmakingData)
        if (matchmakingData.matched > 0) {
          console.log(`[PendingMatches GET] ✅ Matchmaking processor matched ${matchmakingData.matched} pair(s)`)
        }
      }
    } catch (err) {
      console.error('[PendingMatches GET] Error calling matchmaking processor:', err)
    }

    // Wait a moment for database updates to propagate
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if user's pending match was matched
    const { data: pendingMatch, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('[PendingMatches GET] Pending match check:', {
      found: !!pendingMatch,
      status: pendingMatch?.status,
      error: pendingError?.code
    })

    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('[PendingMatches GET] Error checking pending match:', pendingError)
      return NextResponse.json({ success: true, matched: false, inQueue: false })
    }

    if (pendingMatch && pendingMatch.status === 'matched') {
      console.log(`[PendingMatches GET] ✅ User ${userId} status is 'matched', finding chat match...`)
      
      // User was matched! Find the chat match
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matchesError) {
        console.error('[PendingMatches GET] Error finding chat match:', matchesError)
      } else if (matches) {
        const match = Array.isArray(matches) ? matches[0] : matches
        if (match) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
          console.log(`[PendingMatches GET] ✅ Found match! User ${userId} matched with ${otherUserId}`)
          
          // Clean up pending match
          await supabase.from('pending_matches').delete().eq('user_id', userId)
          
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        } else {
          console.warn(`[PendingMatches GET] ⚠️ User ${userId} has status 'matched' but no chat match found in results`)
        }
      } else {
        console.warn(`[PendingMatches GET] ⚠️ User ${userId} has status 'matched' but matches query returned null/empty`)
      }
    }

    // Check if still in queue
    if (pendingMatch && pendingMatch.status === 'searching') {
      console.log(`[PendingMatches GET] ⏳ User ${userId} still in queue (searching)`)
      return NextResponse.json({ 
        success: true, 
        matched: false,
        inQueue: true 
      })
    }

    // No pending match found - user might have been matched and cleaned up, or never joined
    console.log(`[PendingMatches GET] ℹ️ User ${userId} has no pending match (might be matched already or never joined)`)
    return NextResponse.json({ 
      success: true, 
      matched: false,
      inQueue: false 
    })
  } catch (error) {
    console.error('[PendingMatches GET] Error in GET:', error)
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PendingMatches DELETE] Error in DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
