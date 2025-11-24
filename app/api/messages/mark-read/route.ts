export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * POST /api/messages/mark-read
 * Mark messages as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, userId, messageIds } = body

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'Missing matchId or userId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Mark messages as read
    const updateData: any = {
      read_at: new Date().toISOString(),
    }

    let query = supabase
      .from('messages')
      .update(updateData)
      .eq('match_id', matchId)
      .neq('sender_id', userId) // Only mark messages from other user as read
      .is('read_at', null) // Only update unread messages

    // If specific message IDs provided, filter by those
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in('id', messageIds)
    }

    const { error } = await query

    if (error) {
      console.error('[Mark Read] Error:', error)
      return NextResponse.json(
        { error: 'Failed to mark messages as read', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Mark Read] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

