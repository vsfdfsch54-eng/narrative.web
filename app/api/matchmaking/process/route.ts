export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { findBestMatch } from '@/lib/ai/matching-service'
import { createRequestContext } from '@/lib/request-context'
import { logWithContext } from '@/lib/logger'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * AI MATCHMAKING PROCESSOR
 * Replaces FIFO matching with AI-driven personality-based matching
 * 
 * GET /api/matchmaking/process
 * Processes users in waiting_pool and finds best AI matches
 */
async function runAIMatchmaking(supabase: ReturnType<typeof createServerClient>, ctx?: ReturnType<typeof createRequestContext>) {
  const context = ctx || createRequestContext()
  
  try {
    logWithContext('info', 'MATCH_PROCESS_START', context)

    // Acquire advisory lock to prevent race conditions
    const { error: lockError } = await supabase.rpc('acquire_matching_lock')
    if (lockError) {
      logWithContext('warn', 'MATCH_LOCK_ACQUIRE_FAILED', context, { error: lockError.message })
      // Continue anyway - lock may not exist yet (graceful degradation)
    }

    try {
      // Clean stale entries:
      // 1. Entries older than 10 minutes (safety cleanup)
      // 2. Entries where last_active is older than 5 minutes (inactive users - background tabs)
      const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10).toISOString()
      const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5).toISOString()
      
      // Remove entries that are too old OR inactive for 5+ minutes
      const { error: cleanupError } = await supabase
        .from('waiting_pool')
        .delete()
        .or(`created_at.lt.${tenMinutesAgo},last_active.lt.${fiveMinutesAgo}`)

      if (cleanupError) {
        logWithContext('error', 'MATCH_CLEANUP_ERROR', context, { error: cleanupError.message })
      } else {
        logWithContext('info', 'MATCH_CLEANUP_SUCCESS', context)
      }

    // Get all users in waiting pool who are online and recently active
    // Only match users who are actively on the site (not in background)
    // Remove users inactive for 5+ minutes (background tabs)
    const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('waiting_pool')
      .select('*')
      .gte('last_active', fiveMinutesAgo) // Only users active in last 5 minutes
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('[AI Matchmaking] ❌ Error fetching waiting pool:', fetchError)
      return { matched: 0, error: fetchError.message }
    }

    if (!waitingUsers || waitingUsers.length < 2) {
      console.log(`[AI Matchmaking] ⏸️  Only ${waitingUsers?.length || 0} user(s) in waiting pool, need 2+ to match`)
      return { matched: 0, waiting: waitingUsers?.length || 0 }
    }

    console.log(`[AI Matchmaking] 📊 Found ${waitingUsers.length} users in waiting pool`)

    let matchedCount = 0
    const processedUserIds = new Set<string>()

    // Process each user in the waiting pool
    for (const waitingUser of waitingUsers) {
      // Skip if already processed
      if (processedUserIds.has(waitingUser.user_id)) {
        continue
      }

      try {
        // Verify user is still online and active before matching
        // Check both presence AND last_active timestamp (5 minute window)
        const { data: presenceData } = await supabase
          .from('user_presence')
          .select('is_online, last_seen_at')
          .eq('user_id', waitingUser.user_id)
          .single()

        const isOnline = presenceData?.is_online === true
        const lastSeenAt = presenceData?.last_seen_at ? new Date(presenceData.last_seen_at) : null
        const isRecentlyActive = lastSeenAt && (Date.now() - lastSeenAt.getTime()) < 300000 // 5 minutes
        
        // Also check last_active from waiting_pool
        const lastActive = waitingUser.last_active ? new Date(waitingUser.last_active) : null
        const isActiveInPool = lastActive && (Date.now() - lastActive.getTime()) < 300000 // 5 minutes

        if (!isOnline || !isRecentlyActive || !isActiveInPool) {
          console.log(`[AI Matchmaking] User ${waitingUser.user_id} is not online or inactive (background tab), removing from pool`)
          await supabase.from('waiting_pool').delete().eq('user_id', waitingUser.user_id)
          continue
        }

        // Get user's embedding from users table (more reliable than waiting_pool copy)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('personality_embedding')
          .eq('id', waitingUser.user_id)
          .single()

        let userEmbedding: number[] | null = null
        let hasEmbedding = false

        // Try to parse embedding if it exists
        if (!userError && userData && userData.personality_embedding) {
          const embeddingString = userData.personality_embedding
          
          if (typeof embeddingString === 'string') {
            const cleaned = embeddingString.replace(/[\[\]]/g, '')
            userEmbedding = cleaned.split(',').map(Number)
            hasEmbedding = userEmbedding.length > 0
          } else if (Array.isArray(embeddingString)) {
            userEmbedding = embeddingString
            hasEmbedding = userEmbedding.length > 0
          }
        }

        let matchResult = null

        // Try AI matching if user has embedding
        if (hasEmbedding && userEmbedding) {
          matchResult = await findBestMatch(waitingUser.user_id, userEmbedding)
        }

        // FIFO fallback: if no AI match (or no embedding), match with first available user
        if (!matchResult && waitingUsers.length > 1) {
          console.log(`[AI Matchmaking] ${hasEmbedding ? 'AI matching failed' : 'No embedding'}, using FIFO fallback for user ${waitingUser.user_id}`)
          // Find first available user in waiting pool (excluding current user)
          const otherUser = waitingUsers.find(u => 
            u.user_id !== waitingUser.user_id && 
            !processedUserIds.has(u.user_id)
          )
          
          if (otherUser) {
            // Create a basic match result for FIFO fallback
            matchResult = {
              userId: otherUser.user_id,
              matchScore: 0.5, // Default score for FIFO matches
              traitsUsed: {
                method: 'FIFO_fallback',
                reason: hasEmbedding ? 'AI matching failed or score too low' : 'No personality embedding available',
              },
            }
            console.log(`[AI Matchmaking] FIFO fallback: matching ${waitingUser.user_id} with ${otherUser.user_id}`)
          }
        }

        if (!matchResult) {
          console.log(`[AI Matchmaking] No match found for user ${waitingUser.user_id}`)
          continue
        }

        const matchedUserId = matchResult.userId
        const matchScore = matchResult.matchScore
        const traitsUsed = matchResult.traitsUsed

        // Verify matched user is still in waiting pool
        const { data: matchedUserInPool } = await supabase
          .from('waiting_pool')
          .select('user_id')
          .eq('user_id', matchedUserId)
          .maybeSingle()

        if (!matchedUserInPool) {
          console.log(`[AI Matchmaking] Matched user ${matchedUserId} no longer in waiting pool`)
          continue
        }

        // Verify we haven't already matched these users
        if (processedUserIds.has(matchedUserId)) {
          console.log(`[AI Matchmaking] Matched user ${matchedUserId} already processed`)
          continue
        }

        // Determine user1_id and user2_id (alphabetical order for consistency)
        const user1Id = waitingUser.user_id < matchedUserId ? waitingUser.user_id : matchedUserId
        const user2Id = waitingUser.user_id < matchedUserId ? matchedUserId : waitingUser.user_id

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('chat_matches')
          .select('id, status')
          .eq('user1_id', user1Id)
          .eq('user2_id', user2Id)
          .maybeSingle()

        if (existingMatch) {
          // Check if there are other users available (prefer new matches)
          const otherAvailableUsers = waitingUsers.filter(u => 
            u.user_id !== waitingUser.user_id && 
            u.user_id !== matchedUserId &&
            !processedUserIds.has(u.user_id)
          )
          
          if (otherAvailableUsers.length > 0) {
            // Other users available - skip this match (prefer new matches)
            console.log(`[AI Matchmaking] Match already exists between ${user1Id} and ${user2Id}, skipping (${otherAvailableUsers.length} other users available)`)
            continue
          } else {
            // No other users - allow rematch (Omegle-style)
            console.log(`[AI Matchmaking] Match already exists but no other users available, allowing rematch (Omegle-style)`)
            // Mark old match as ended for fresh start
            if (existingMatch.status !== 'ended') {
              await supabase
                .from('chat_matches')
                .update({ status: 'ended' })
                .eq('id', existingMatch.id)
              console.log(`[AI Matchmaking] Marked old match ${existingMatch.id} as ended for fresh start`)
            }
          }
        }

        // Mark any other existing matches between these users as "ended" (fresh start)
        const { data: oldMatches } = await supabase
          .from('chat_matches')
          .select('id')
          .eq('user1_id', user1Id)
          .eq('user2_id', user2Id)
          .in('status', ['active', 'pending'])

        if (oldMatches && oldMatches.length > 0) {
          await supabase
            .from('chat_matches')
            .update({ status: 'ended' })
            .eq('user1_id', user1Id)
            .eq('user2_id', user2Id)
            .in('status', ['active', 'pending'])
          console.log(`[AI Matchmaking] Marked ${oldMatches.length} old match(es) as ended for fresh start`)
        }

        // Create chat match (fresh start)
        const { data: chatMatch, error: matchError } = await supabase
          .from('chat_matches')
          .insert({
            user1_id: user1Id,
            user2_id: user2Id,
            status: 'active',
            match_score: matchScore,
            traits_used: traitsUsed,
          })
          .select()
          .single()

        if (matchError) {
          console.error(`[AI Matchmaking] Error creating chat match:`, matchError)
          continue
        }

        // Get user names for notifications
        const { data: user1Data } = await supabase
          .from('users')
          .select('name, first_name')
          .eq('id', user1Id)
          .single()
        
        const { data: user2Data } = await supabase
          .from('users')
          .select('name, first_name')
          .eq('id', user2Id)
          .single()

        const user1Name = user1Data?.first_name || user1Data?.name || 'Someone'
        const user2Name = user2Data?.first_name || user2Data?.name || 'Someone'

        // Create notifications for both users
        try {
          await supabase.rpc('create_notification', {
            p_user_id: user1Id,
            p_sender_id: user2Id,
            p_type: 'match_found',
            p_title: 'New Match',
            p_body: `You've been matched with ${user2Name}`,
            p_metadata: { matchId: chatMatch.id, otherUserId: user2Id },
          })

          await supabase.rpc('create_notification', {
            p_user_id: user2Id,
            p_sender_id: user1Id,
            p_type: 'match_found',
            p_title: 'New Match',
            p_body: `You've been matched with ${user1Name}`,
            p_metadata: { matchId: chatMatch.id, otherUserId: user1Id },
          })
        } catch (notifError: any) {
          console.error(`[AI Matchmaking] Error creating notifications:`, notifError)
          // Don't fail the match if notifications fail
        }

        // Remove both users from waiting pool
        await supabase.from('waiting_pool').delete().eq('user_id', waitingUser.user_id)
        await supabase.from('waiting_pool').delete().eq('user_id', matchedUserId)

        processedUserIds.add(waitingUser.user_id)
        processedUserIds.add(matchedUserId)
        matchedCount++

        console.log(`[AI Matchmaking] ✅ Matched ${waitingUser.user_id} with ${matchedUserId} (score: ${matchScore.toFixed(3)})`)
      } catch (error: any) {
        console.error(`[AI Matchmaking] Error processing user ${waitingUser.user_id}:`, error)
        // Continue with next user
      }
    }

      logWithContext('info', 'MATCH_PROCESS_COMPLETE', context, { 
        matched: matchedCount, 
        waiting: waitingUsers.length - (matchedCount * 2) 
      })
      return { matched: matchedCount, waiting: waitingUsers.length - (matchedCount * 2) }
    } finally {
      // Always release the lock
      try {
        await supabase.rpc('release_matching_lock')
      } catch {
        // Ignore errors releasing lock
      }
    }
  } catch (error: any) {
    logWithContext('error', 'MATCH_PROCESS_FATAL_ERROR', context, { error: error.message })
    return { matched: 0, error: error.message }
  }
}

// GET - Process AI matching
export async function GET(request: NextRequest) {
  const ctx = createRequestContext()
  try {
    const supabase = createServerClient()
    const result = await runAIMatchmaking(supabase, ctx)
    return NextResponse.json(result, {
      headers: getCorsHeaders(),
    })
  } catch (error: any) {
    logWithContext('error', 'MATCH_ROUTE_ERROR', ctx, { error: error.message })
    return NextResponse.json(
      { matched: 0, error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
    )
  }
}
