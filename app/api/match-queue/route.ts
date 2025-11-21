export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// POST - Add user to match queue and try to match immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Remove user from queue if they're already in it (cleanup)
    await supabase.from('match_queue').delete().eq('user_id', userId)

    // Add user to queue
    const { error: queueError } = await supabase
      .from('match_queue')
      .insert({ user_id: userId })

    if (queueError) {
      console.error('Error adding to queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to add to queue' },
        { status: 500 }
      )
    }

    // Try to find another user in the queue
    const { data: queueUsers, error: queueLookupError } = await supabase
      .from('match_queue')
      .select('user_id')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (queueLookupError) {
      console.error('Error looking up queue:', queueLookupError)
      return NextResponse.json({ 
        success: true, 
        inQueue: true,
        message: 'Added to queue, waiting for match...' 
      })
    }

    if (queueUsers && queueUsers.length > 0) {
      // Found another user! Create match
      const otherUserId = queueUsers[0].user_id

      // Remove both users from queue
      await supabase.from('match_queue').delete().eq('user_id', userId)
      await supabase.from('match_queue').delete().eq('user_id', otherUserId)

      // Create match (use consistent UUID ordering)
      const user1Id = userId < otherUserId ? userId : otherUserId
      const user2Id = userId < otherUserId ? otherUserId : userId

      const { data: matchData, error: matchError } = await supabase
        .from('chat_matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
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
            return NextResponse.json({ 
              success: true, 
              matched: true,
              match: existingMatch,
              otherUserId: otherUserId 
            })
          }
        }
        console.error('Error creating match:', matchError)
        return NextResponse.json({ 
          success: true, 
          inQueue: true,
          message: 'Error creating match, staying in queue...' 
        })
      }

      return NextResponse.json({ 
        success: true, 
        matched: true,
        match: matchData,
        otherUserId: otherUserId 
      })
    }

    // No one else in queue, user is waiting
    return NextResponse.json({ 
      success: true, 
      inQueue: true,
      message: 'Waiting for another user...' 
    })
  } catch (error) {
    console.error('Error in POST /api/match-queue:', error)
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

    // Check if user has a new active match
    const { data: matches, error: matchesError } = await supabase
      .from('chat_matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (matchesError) {
      console.error('Error checking matches:', matchesError)
      return NextResponse.json({ success: true, matched: false, inQueue: true })
    }

    if (matches && matches.length > 0) {
      const match = matches[0]
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
      
      // Remove from queue if matched
      await supabase.from('match_queue').delete().eq('user_id', userId)

      return NextResponse.json({ 
        success: true, 
        matched: true,
        match: match,
        otherUserId: otherUserId 
      })
    }

    // Check if still in queue
    const { data: inQueue } = await supabase
      .from('match_queue')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({ 
      success: true, 
      matched: false,
      inQueue: !!inQueue 
    })
  } catch (error) {
    console.error('Error in GET /api/match-queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user from queue
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
      .from('match_queue')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing from queue:', error)
      return NextResponse.json(
        { error: 'Failed to remove from queue' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/match-queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

