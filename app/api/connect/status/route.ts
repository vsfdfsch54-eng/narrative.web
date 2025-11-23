export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * GET /api/connect/status
 * Check if user has been matched (for polling)
 * Replaces /api/pending-matches/status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  console.log('[Connect Status] Request received for userId:', userId)

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Trigger matchmaking processor before checking status
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (request.headers.get('origin') || 'http://localhost:3000')
      
      fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(err => {
        console.error('[Connect Status] Failed to trigger processor:', err)
      })
    } catch (err) {
      // Ignore errors
    }

    // Small delay for processing
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if user is still in waiting pool
    const { data: waitingPoolEntry } = await supabase
      .from('waiting_pool')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    // If not in waiting pool, check if they were matched
    if (!waitingPoolEntry) {
      // Find active chat match for this user
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matchesError) {
        console.error('[Connect Status] Error finding chat match:', matchesError)
      } else if (matches && matches.length > 0) {
        const match = matches[0]
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

        console.log(`[Connect Status] ✅ User ${userId} matched with ${otherUserId}`)

        return NextResponse.json({
          success: true,
          matched: true,
          match: match,
          otherUserId: otherUserId,
          matchScore: match.match_score,
        })
      }
    }

    // Still in queue
    if (waitingPoolEntry) {
      console.log(`[Connect Status] ⏳ User ${userId} still in waiting pool`)
      return NextResponse.json({
        success: true,
        matched: false,
        inQueue: true,
      })
    }

    // Not in queue and not matched
    return NextResponse.json({
      success: true,
      matched: false,
      inQueue: false,
    })
  } catch (error: any) {
    console.error('[Connect Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
