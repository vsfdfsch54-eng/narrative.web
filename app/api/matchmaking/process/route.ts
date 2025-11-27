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
      // Clean stale entries (older than 10 minutes - more lenient)
      const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10).toISOString()
      
      const { error: cleanupError } = await supabase
        .from('waiting_pool')
        .delete()
        .lt('created_at', tenMinutesAgo)

      if (cleanupError) {
        logWithContext('error', 'MATCH_CLEANUP_ERROR', context, { error: cleanupError.message })
      } else {
        logWithContext('info', 'MATCH_CLEANUP_SUCCESS', context)
      }

    // Get all users in waiting pool
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('waiting_pool')
      .select('*')
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
          .select('id')
          .eq('user1_id', user1Id)
          .eq('user2_id', user2Id)
          .single()

        if (existingMatch) {
          console.log(`[AI Matchmaking] Match already exists between ${user1Id} and ${user2Id}`)
          // Remove both from waiting pool
          await supabase.from('waiting_pool').delete().eq('user_id', waitingUser.user_id)
          await supabase.from('waiting_pool').delete().eq('user_id', matchedUserId)
          processedUserIds.add(waitingUser.user_id)
          processedUserIds.add(matchedUserId)
          continue
        }

        // Create chat match
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
