export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createMatch, getNextMatch, updateMatchStatus } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user1Id, user2Id, topic } = body

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: 'Missing user1Id or user2Id' },
        { status: 400 }
      )
    }

    const result = await createMatch(user1Id, user2Id, topic)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create match' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in POST /api/matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Access searchParams outside try/catch to ensure Next.js recognizes dynamic usage
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const matchId = searchParams.get('matchId')

  // If matchId is provided, fetch that specific match
  if (matchId) {
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId query parameter (required when matchId is provided)' },
        { status: 400 }
      )
    }

    try {
      const { createServerClient } = await import('@/lib/supabaseClient')
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('chat_matches')
        .select('*')
        .eq('id', matchId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle()

      if (error) {
        console.error('Error fetching match:', error)
        return NextResponse.json(
          { error: 'Failed to fetch match' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error in GET /api/matches:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // If no matchId, return next match for userId (legacy behavior)
  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    // Legacy 'find' action removed - use /api/connect instead
    // This endpoint now only returns existing matches
    const result = await getNextMatch(userId)

    return NextResponse.json({ success: true, data: result, inQueue: false })
  } catch (error) {
    console.error('Error in GET /api/matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, status } = body

    if (!matchId || !status) {
      return NextResponse.json(
        { error: 'Missing matchId or status' },
        { status: 400 }
      )
    }

    if (!['pending', 'active', 'ended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, active, or ended' },
        { status: 400 }
      )
    }

    const success = await updateMatchStatus(matchId, status)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update match status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

