export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// GET - Check if user is matched (for polling)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  console.log('[PendingMatches Status GET] Request received for userId:', userId)

  if (!userId) {
    console.error('[PendingMatches Status GET] ❌ Missing userId query parameter')
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // First, trigger matchmaking processor to catch any waiting pairs
    const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || (origin.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${origin.replace(/^https?:\/\//, '')}`
    
    try {
      console.log(`[PendingMatches Status GET] Triggering matchmaking processor for user ${userId}`)
      const matchmakingResponse = await fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (matchmakingResponse.ok) {
        const matchmakingData = await matchmakingResponse.json()
        console.log(`[PendingMatches Status GET] Matchmaking result:`, matchmakingData)
        if (matchmakingData.matched > 0) {
          console.log(`[PendingMatches Status GET] ✅ Matchmaking processor matched ${matchmakingData.matched} pair(s)`)
        }
      }
    } catch (err) {
      console.error('[PendingMatches Status GET] Error calling matchmaking processor:', err)
    }

    // Wait for database updates to propagate
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if user's pending match was matched
    const { data: pendingMatch, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('[PendingMatches Status GET] Pending match check:', {
      found: !!pendingMatch,
      status: pendingMatch?.status,
      error: pendingError?.code
    })

    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('[PendingMatches Status GET] Error checking pending match:', pendingError)
      return NextResponse.json({ success: true, matched: false, inQueue: false })
    }

    if (pendingMatch && pendingMatch.status === 'matched') {
      console.log(`[PendingMatches Status GET] ✅ User ${userId} status is 'matched', finding chat match...`)
      
      // User was matched! Find the chat match
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (matchesError) {
        console.error('[PendingMatches Status GET] Error finding chat match:', matchesError)
      } else if (matches) {
        const match = Array.isArray(matches) ? matches[0] : matches
        if (match) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
          console.log(`[PendingMatches Status GET] ✅ Found match! User ${userId} matched with ${otherUserId}`)
          
          // Clean up pending match
          await supabase.from('pending_matches').delete().eq('user_id', userId)
          
          return NextResponse.json({ 
            success: true, 
            matched: true,
            match: match,
            otherUserId: otherUserId 
          })
        } else {
          console.warn(`[PendingMatches Status GET] ⚠️ User ${userId} has status 'matched' but no chat match found`)
        }
      } else {
        console.warn(`[PendingMatches Status GET] ⚠️ User ${userId} has status 'matched' but matches query returned null/empty`)
      }
    }

    // Check if still in queue
    if (pendingMatch && pendingMatch.status === 'searching') {
      console.log(`[PendingMatches Status GET] ⏳ User ${userId} still in queue (searching)`)
      return NextResponse.json({ 
        success: true, 
        matched: false,
        inQueue: true 
      })
    }

    // No pending match found
    console.log(`[PendingMatches Status GET] ℹ️ User ${userId} has no pending match`)
    return NextResponse.json({ 
      success: true, 
      matched: false,
      inQueue: false 
    })
  } catch (error) {
    console.error('[PendingMatches Status GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

