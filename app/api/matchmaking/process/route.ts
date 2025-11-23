export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { findBestMatch } from '@/lib/ai/matching-service'

/**
 * AI MATCHMAKING PROCESSOR
 * Replaces FIFO matching with AI-driven personality-based matching
 * 
 * GET /api/matchmaking/process
 * Processes users in waiting_pool and finds best AI matches
 */
async function runAIMatchmaking(supabase: ReturnType<typeof createServerClient>) {
  try {
    console.log('[AI Matchmaking] 🔍 Starting AI matching process...')

    // Clean stale entries (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5).toISOString()
    
    const { error: cleanupError } = await supabase
      .from('waiting_pool')
      .delete()
      .lt('created_at', fiveMinutesAgo)

    if (cleanupError) {
      console.error('[AI Matchmaking] Error cleaning stale entries:', cleanupError)
    } else {
      console.log('[AI Matchmaking] ✅ Cleaned stale waiting pool entries')
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

        if (userError || !userData || !userData.personality_embedding) {
          console.error(`[AI Matchmaking] User ${waitingUser.user_id} has no embedding, skipping`)
          // Remove from waiting pool if no embedding
          await supabase.from('waiting_pool').delete().eq('user_id', waitingUser.user_id)
          continue
        }

        // Parse embedding
        const embeddingString = userData.personality_embedding
        let userEmbedding: number[]
        
        if (typeof embeddingString === 'string') {
          const cleaned = embeddingString.replace(/[\[\]]/g, '')
          userEmbedding = cleaned.split(',').map(Number)
        } else if (Array.isArray(embeddingString)) {
          userEmbedding = embeddingString
        } else {
          console.error(`[AI Matchmaking] Invalid embedding format for user ${waitingUser.user_id}`)
          continue
        }

        // Find best match using AI matching service
        const matchResult = await findBestMatch(waitingUser.user_id, userEmbedding)

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
          .single()

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

    console.log(`[AI Matchmaking] ✅ Completed: ${matchedCount} match(es) created`)
    return { matched: matchedCount, waiting: waitingUsers.length - (matchedCount * 2) }
  } catch (error: any) {
    console.error('[AI Matchmaking] Fatal error:', error)
    return { matched: 0, error: error.message }
  }
}

// GET - Process AI matching
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const result = await runAIMatchmaking(supabase)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[AI Matchmaking] Route error:', error)
    return NextResponse.json(
      { matched: 0, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
