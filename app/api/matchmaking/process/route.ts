export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * MATCHMAKING PROCESSOR
 * Runs every 5 seconds to pair waiting users (FIFO)
 * No filtering - matches ANY two users waiting
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all users waiting for a match (FIFO order)
    // Use a small delay to ensure database consistency
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .order('created_at', { ascending: true }) // FIFO: oldest first

    if (fetchError) {
      console.error('Error fetching waiting users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch waiting users', details: fetchError.message },
        { status: 500 }
      )
    }

    console.log(`[Matchmaking] Found ${waitingUsers?.length || 0} users waiting`)

    if (!waitingUsers || waitingUsers.length < 2) {
      return NextResponse.json({ 
        success: true, 
        matched: 0,
        waiting: waitingUsers?.length || 0,
        message: `Only ${waitingUsers?.length || 0} user(s) waiting, need 2+ to match` 
      })
    }

    let matchedCount = 0
    const pairs: Array<{ user1: string, user2: string }> = []
    const processedUserIds = new Set<string>()

    // Pair users in FIFO order (first two, then next two, etc.)
    for (let i = 0; i < waitingUsers.length - 1; i += 2) {
      const user1 = waitingUsers[i]
      const user2 = waitingUsers[i + 1]

      // Skip if either user was already processed in this run
      if (processedUserIds.has(user1.user_id) || processedUserIds.has(user2.user_id)) {
        continue
      }

      // Use consistent UUID ordering for chat_matches
      const user1Id = user1.user_id < user2.user_id ? user1.user_id : user2.user_id
      const user2Id = user1.user_id < user2.user_id ? user2.user_id : user1.user_id

      // Determine which user's data goes where
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
        // If duplicate, try to get existing match
        if (matchError.code === '23505' || matchError.message.includes('duplicate')) {
          const { data: existingMatch } = await supabase
            .from('chat_matches')
            .select('*')
            .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
            .single()

          if (existingMatch) {
            // Match already exists, just update pending statuses
            await supabase
              .from('pending_matches')
              .update({ 
                status: 'matched', 
                matched_at: new Date().toISOString() 
              })
              .in('user_id', [user1.user_id, user2.user_id])

            matchedCount++
            pairs.push({ user1: user1.user_id, user2: user2.user_id })
            continue
          }
        }
        
        console.error(`Error creating match for ${user1.user_id} and ${user2.user_id}:`, matchError)
        continue // Skip this pair and continue with next
      }

      if (chatMatch) {
        // Update both pending matches to matched
        const { error: updateError } = await supabase
          .from('pending_matches')
          .update({ 
            status: 'matched', 
            matched_at: new Date().toISOString() 
          })
          .in('user_id', [user1.user_id, user2.user_id])

        if (updateError) {
          console.error('Error updating pending matches:', updateError)
        } else {
          matchedCount++
          pairs.push({ user1: user1.user_id, user2: user2.user_id })
          processedUserIds.add(user1.user_id)
          processedUserIds.add(user2.user_id)
          console.log(`[Matchmaking] Matched ${user1.user_id} with ${user2.user_id}`)
        }
      }
    }

    console.log(`[Matchmaking] Completed: ${matchedCount} pair(s) matched`)

    return NextResponse.json({ 
      success: true, 
      matched: matchedCount,
      pairs: pairs.length,
      message: `Matched ${matchedCount} pair(s) of users` 
    })
  } catch (error) {
    console.error('Error in matchmaking processor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

