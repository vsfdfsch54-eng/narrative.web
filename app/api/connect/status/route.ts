export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * GET /api/connect/status
 * Check if user has been matched (for polling)
 * Replaces /api/pending-matches/status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Trigger matchmaking processor aggressively before checking status
    try {
      // Construct base URL from request (works in all environments)
      // Priority: NEXT_PUBLIC_APP_URL > origin header > host header > localhost fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (request.headers.get('origin') || 
         (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000'))
      
      // Trigger immediately
      fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(err => {
        console.error('[Connect Status] Failed to trigger processor:', err)
      })
      
      // Also trigger after a short delay to ensure processing
      // Note: setTimeout in serverless may not execute - using Promise-based delay instead
      Promise.resolve().then(() => 
        new Promise(resolve => setTimeout(resolve, 300))
      ).then(() => {
        fetch(`${baseUrl}/api/matchmaking/process`, {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => {})
      }).catch(() => {})
    } catch (err) {
      // Ignore errors
    }

    // Small delay for processing
    await new Promise(resolve => setTimeout(resolve, 200))

    // Get queue count for better feedback
    const { count: queueCount } = await supabase
      .from('waiting_pool')
      .select('*', { count: 'exact', head: true })

    // Check if user is still in waiting pool
    const { data: waitingPoolEntry, error: waitingPoolError } = await supabase
      .from('waiting_pool')
      .select('user_id, created_at')
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

        return NextResponse.json({
          success: true,
          matched: true,
          match: match,
          otherUserId: otherUserId,
          matchScore: match.match_score,
        }, {
          headers: getCorsHeaders(),
        })
      }
    }

    // Still in queue - return queue info
    if (waitingPoolEntry) {
      const waitTime = Date.now() - new Date(waitingPoolEntry.created_at).getTime()
      return NextResponse.json({
        success: true,
        matched: false,
        inQueue: true,
        queueCount: queueCount || 0,
        waitTimeSeconds: Math.floor(waitTime / 1000),
        estimatedWaitTime: queueCount && queueCount >= 2 ? 'Any moment now!' : 'Waiting for another user...',
      }, {
        headers: getCorsHeaders(),
      })
    }

    // Not in queue and not matched
    return NextResponse.json({
      success: true,
      matched: false,
      inQueue: false,
      queueCount: queueCount || 0,
    }, {
      headers: getCorsHeaders(),
    })
  } catch (error: any) {
    console.error('[Connect Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
    )
  }
}
