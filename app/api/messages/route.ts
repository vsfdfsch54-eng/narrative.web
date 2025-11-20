import { NextRequest, NextResponse } from 'next/server'
import { sendMessage, getMessages } from '@/lib/supabase-helpers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, senderId, text } = body

    if (!matchId || !senderId || !text) {
      return NextResponse.json(
        { error: 'Missing matchId, senderId, or text' },
        { status: 400 }
      )
    }

    const result = await sendMessage(matchId, senderId, text)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json(
        { error: 'Missing matchId query parameter' },
        { status: 400 }
      )
    }

    const result = await getMessages(matchId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in GET /api/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

