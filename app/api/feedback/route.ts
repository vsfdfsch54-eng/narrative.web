import { NextRequest, NextResponse } from 'next/server'
import { submitFeedback } from '@/lib/supabase-helpers'

export const dynamic = "force-dynamic"
export const runtime = "nodejs" // optional but helps Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, userId, emoji, notes } = body

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'Missing matchId or userId' },
        { status: 400 }
      )
    }

    const result = await submitFeedback(matchId, userId, emoji, notes)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

