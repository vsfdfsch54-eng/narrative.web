export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * MATCHMAKING PROCESSOR FUNCTION
 * FIFO matching - matches ANY two FRESH users waiting (within last 2 minutes)
 */
async function runMatchmaking(supabase: ReturnType<typeof createServerClient>) {
  try {
    // Clean stale rows before matching
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
      console.error('[Matchmaking] Error cleaning stale rows:', deleteMatchedError || deleteOldError)
    } else {
      console.log('[Matchmaking] ✅ Cleaned stale rows')
    }

    // Get ONLY fresh users waiting for a match (within last 2 minutes)
    console.log('[Matchmaking] 🔍 Querying for fresh waiting users...')
    console.log('[Matchmaking] Query filters:', {
      status: 'searching',
      created_at_gte: twoMinutesAgo,
      order: 'created_at ASC'
    })
    
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .gte('created_at', twoMinutesAgo)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('[Matchmaking] ❌ Error fetching waiting users:', fetchError)
      console.error('[Matchmaking] Error details:', JSON.stringify(fetchError, null, 2))
      return { matched: 0 }
    }

    console.log(`[Matchmaking] 📊 Query result: Found ${waitingUsers?.length || 0} fresh user(s) waiting`)
    
    if (waitingUsers && waitingUsers.length > 0) {
      console.log('[Matchmaking] Waiting users details:')
      waitingUsers.forEach((user, index) => {
        console.log(`[Matchmaking]   User ${index + 1}:`, {
          id: user.id,
          user_id: user.user_id,
          vibe: user.vibe,
          topic: user.topic,
          timeframe: user.timeframe,
          status: user.status,
          created_at: user.created_at
        })
      })
    }

    if (!waitingUsers || waitingUsers.length < 2) {
      console.log(`[Matchmaking] ⏸️  Only ${waitingUsers?.length || 0} fresh user(s) waiting, need 2+ to match`)
      return { matched: 0, waiting: waitingUsers?.length || 0 }
    }

    console.log(`[Matchmaking] ✅ Processing ${waitingUsers.length} fresh waiting users for matching`)

    let matchedCount = 0
    const processedUserIds = new Set<string>()

    // Match users in pairs
    for (let i = 0; i < waitingUsers.length - 1; i += 2) {
      const user1 = waitingUsers[i]
      const user2 = waitingUsers[i + 1]

      // Skip if either user was already processed in this run
      if (processedUserIds.has(user1.user_id) || processedUserIds.has(user2.user_id)) {
        console.log(`[Matchmaking] Skipping ${user1.user_id} or ${user2.user_id} - already processed`)
        continue
      }

      // Verify both users are still searching and fresh
      const { data: verifyUsers } = await supabase
        .from('pending_matches')
        .select('user_id, status, created_at')
        .in('user_id', [user1.user_id, user2.user_id])
        .eq('status', 'searching')
        .gte('created_at', twoMinutesAgo)

      if (!verifyUsers || verifyUsers.length !== 2) {
        console.log(`[Matchmaking] Users ${user1.user_id} and ${user2.user_id} - only ${verifyUsers?.length || 0} still searching and fresh, skipping`)
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
          const { error: updateError } = await supabase
            .from('pending_matches')
            .update({ status: 'matched', matched_at: new Date().toISOString() })
            .in('user_id', [user1.user_id, user2.user_id])

          if (updateError) {
            console.error(`[Matchmaking] Error updating status for existing match:`, updateError)
            // Retry update
            await supabase
              .from('pending_matches')
              .update({ status: 'matched', matched_at: new Date().toISOString() })
              .in('user_id', [user1.user_id, user2.user_id])
          }

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
        // ALWAYS update both pending matches to matched - try multiple times if needed
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
          // Final attempt - must succeed
          await supabase
            .from('pending_matches')
            .update({ status: 'matched', matched_at: new Date().toISOString() })
            .in('user_id', [user1.user_id, user2.user_id])
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

/**
 * GET - Run matchmaking processor
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    console.log('[Matchmaking GET] Running matchmaking processor...')
    const result = await runMatchmaking(supabase)
    
    console.log(`[Matchmaking GET] Completed: ${result.matched} pair(s) matched, ${result.waiting || 0} users waiting`)

    return NextResponse.json({ 
      success: true, 
      matched: result.matched,
      waiting: result.waiting || 0,
      message: `Matched ${result.matched} pair(s) of users` 
    })
  } catch (error) {
    console.error('[Matchmaking GET] Error in matchmaking processor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
