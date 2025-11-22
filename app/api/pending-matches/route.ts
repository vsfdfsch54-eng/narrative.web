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
      console.error('[Matchmaking] Error details:', JSON.stringify(fetchError, null, 2))
      return { matched: 0 }
    }

    if (!waitingUsers || waitingUsers.length < 2) {
      console.log(`[Matchmaking] Only ${waitingUsers?.length || 0} user(s) waiting, need 2+ to match`)
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
        // Update both pending matches to matched - try multiple times if needed
        let updateSuccess = false
        for (let updateAttempt = 0; updateAttempt < 3; updateAttempt++) {
          const { error: updateError, data: updateData } = await supabase
            .from('pending_matches')
            .update({ status: 'matched', matched_at: new Date().toISOString() })
            .in('user_id', [user1.user_id, user2.user_id])
            .select()

          if (updateError) {
            console.error(`[Matchmaking] Error updating pending matches (attempt ${updateAttempt + 1}):`, updateError)
            if (updateAttempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          } else {
            console.log(`[Matchmaking] ✅ Updated ${updateData?.length || 0} pending match(es) to 'matched'`)
            updateSuccess = true
            break
          }
        }

        if (!updateSuccess) {
          console.error(`[Matchmaking] ⚠️ Failed to update pending matches after 3 attempts, but match was created`)
        }

        matchedCount++
        processedUserIds.add(user1.user_id)
        processedUserIds.add(user2.user_id)
        console.log(`[Matchmaking] ✅ Matched: ${user1.user_id} <-> ${user2.user_id} (chat_match created)`)
      } else {
        console.warn(`[Matchmaking] ⚠️ Chat match creation returned null for ${user1.user_id} and ${user2.user_id}`)
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

    // Small delay to ensure database write has propagated
    await new Promise(resolve => setTimeout(resolve, 100))

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
        console.error(`[PendingMatches] Error finding other users (attempt ${attempt + 1}):`, error)
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
    
    // Wait a bit for database updates to propagate
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Check if current user was matched by the processor (with retry)
    let updatedPendingMatch = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('pending_matches')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error(`[PendingMatches] Error checking match status (attempt ${attempt + 1}):`, error)
      } else {
        updatedPendingMatch = data
        if (updatedPendingMatch && updatedPendingMatch.status === 'matched') {
          break
        }
      }
      
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 150))
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
        console.error('[PendingMatches] Error finding chat match:', matchesError)
      } else if (matches) {
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

  console.log('[PendingMatches GET] Request received for userId:', userId)

  if (!userId) {
    console.error('[PendingMatches GET] ❌ Missing userId query parameter')
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // First, check current status before running matchmaking
    const { data: initialPendingMatch } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('[PendingMatches GET] Initial pending match status:', initialPendingMatch?.status || 'not found')

    // First, run matchmaking processor to catch any waiting pairs
    console.log(`[PendingMatches GET] Running matchmaking for user ${userId}`)
    const matchmakingResult = await runMatchmaking(supabase)
    console.log(`[PendingMatches GET] Matchmaking result:`, matchmakingResult)
    if (matchmakingResult.matched > 0) {
      console.log(`[PendingMatches GET] ✅ Matchmaking processor matched ${matchmakingResult.matched} pair(s)`)
    } else {
      console.log(`[PendingMatches GET] ⏳ No matches made (${matchmakingResult.waiting || 0} users waiting)`)
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
