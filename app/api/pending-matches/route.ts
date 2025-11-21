export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// POST - Create pending match and try to match immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic, timeframe } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Remove any existing pending match for this user
    await supabase
      .from('pending_matches')
      .delete()
      .eq('user_id', userId)

    // Create new pending match
    const { data: pendingMatch, error: insertError } = await supabase
      .from('pending_matches')
      .insert({
        user_id: userId,
        vibe: vibe || null,
        topic: topic || null,
        timeframe: timeframe || null,
        status: 'searching',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating pending match:', insertError)
      return NextResponse.json(
        { error: 'Failed to create pending match' },
        { status: 500 }
      )
    }

    // Trigger the matchmaking processor (non-blocking)
    // The processor will run every 5 seconds and match users
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matchmaking/process`, {
      method: 'GET',
    }).catch(err => {
      // Non-blocking - if this fails, the cron job will handle it
      console.log('Matchmaking processor trigger failed (non-critical):', err)
    })

    // User is now in queue - the matchmaking processor will pair them
    return NextResponse.json({ 
      success: true, 
      inQueue: true,
      pendingMatch: pendingMatch,
      message: 'Added to queue. Matching every 5 seconds...' 
    })
  } catch (error) {
    console.error('Error in POST /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Check if user is matched (for polling)
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

    // Check if user's pending match was matched
    const { data: pendingMatch, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pendingError && pendingError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking pending match:', pendingError)
      return NextResponse.json({ success: true, matched: false, inQueue: false })
    }

    if (pendingMatch && pendingMatch.status === 'matched') {
      // User was matched! Find the chat match
      const { data: matches, error: matchesError } = await supabase
        .from('chat_matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!matchesError && matches && matches.length > 0) {
        const match = matches[0]
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

        // Clean up pending match
        await supabase.from('pending_matches').delete().eq('user_id', userId)

        return NextResponse.json({ 
          success: true, 
          matched: true,
          match: match,
          otherUserId: otherUserId 
        })
      }
    }

    // Check if still in queue
    if (pendingMatch && pendingMatch.status === 'searching') {
      return NextResponse.json({ 
        success: true, 
        matched: false,
        inQueue: true 
      })
    }

    return NextResponse.json({ 
      success: true, 
      matched: false,
      inQueue: false 
    })
  } catch (error) {
    console.error('Error in GET /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user from pending matches
export async function DELETE(request: NextRequest) {
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
    
    const { error } = await supabase
      .from('pending_matches')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing from pending matches:', error)
      return NextResponse.json(
        { error: 'Failed to remove from pending matches' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/pending-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

