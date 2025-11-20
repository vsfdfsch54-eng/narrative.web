import { NextRequest, NextResponse } from 'next/server'
import { createMatch, getNextMatch, updateMatchStatus } from '@/lib/supabase-helpers'

// Force dynamic rendering - must be at top level
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {

    const result = await getNextMatch(userId)

    return NextResponse.json({ success: true, data: result })
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

