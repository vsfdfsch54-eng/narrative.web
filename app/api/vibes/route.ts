import { NextRequest, NextResponse } from 'next/server'
import { saveVibe, getLastVibe, getUserVibes } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe } = body

    if (!userId || !vibe) {
      return NextResponse.json(
        { error: 'Missing userId or vibe' },
        { status: 400 }
      )
    }

    const result = await saveVibe(userId, vibe)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save vibe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in POST /api/vibes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'last' // 'last' or 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId query parameter' },
        { status: 400 }
      )
    }

    let result
    if (type === 'all') {
      result = await getUserVibes(userId)
    } else {
      result = await getLastVibe(userId)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in GET /api/vibes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

