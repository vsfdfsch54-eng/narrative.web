export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { getMessages } from '@/lib/supabase-helpers'
import { createServerClient } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, senderId, text, messageType, fileUrl, fileName, fileSize } = body

    if (!matchId || !senderId) {
      return NextResponse.json(
        { error: 'Missing matchId or senderId' },
        { status: 400 }
      )
    }

    // Text messages require text content
    if ((!messageType || messageType === 'text') && !text) {
      return NextResponse.json(
        { error: 'Missing text content for text message' },
        { status: 400 }
      )
    }

    // File/image messages require fileUrl
    if ((messageType === 'file' || messageType === 'image') && !fileUrl) {
      return NextResponse.json(
        { error: 'Missing fileUrl for file/image message' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert message with new fields
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        text: text || '',
        message_type: messageType || 'text',
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error in POST /api/messages:', error)
      return NextResponse.json(
        { error: 'Failed to send message', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Access searchParams outside try/catch to ensure Next.js recognizes dynamic usage
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return NextResponse.json(
      { error: 'Missing matchId query parameter' },
      { status: 400 }
    )
  }

  try {

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

