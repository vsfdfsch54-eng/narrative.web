export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * POST /api/messages/reactions
 * Add or remove a reaction to a message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, userId, emoji } = body

    if (!messageId || !userId || !emoji) {
      return NextResponse.json(
        { error: 'Missing messageId, userId, or emoji' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get current message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Get current reactions
    const reactions = (message.reactions as Record<string, string[]>) || {}

    // Toggle reaction
    if (reactions[emoji] && reactions[emoji].includes(userId)) {
      // Remove reaction
      reactions[emoji] = reactions[emoji].filter(id => id !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      if (!reactions[emoji]) {
        reactions[emoji] = []
      }
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId)
      }
    }

    // Update message
    const { error: updateError } = await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId)

    if (updateError) {
      console.error('[Reactions] Error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reaction', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reactions })
  } catch (error: any) {
    console.error('[Reactions] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

