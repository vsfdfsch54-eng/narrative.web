export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { sendLoopMessage, getLoopMessages } from '@/lib/loops-helpers'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/loops/[id]/messages
 * Send a message to a Loop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { senderId, text } = body
    const { id } = await params
    const loopId = id

    if (!senderId || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: senderId, text' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const success = await sendLoopMessage(loopId, senderId, text)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[POST /api/loops/[id]/messages] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

/**
 * GET /api/loops/[id]/messages?limit=50
 * Get messages for a Loop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const { id } = await params
    const loopId = id

    const messages = await getLoopMessages(loopId, limit)

    return NextResponse.json({
      success: true,
      data: messages,
    }, { headers: getCorsHeaders() })
  } catch (error: any) {
    console.error('[GET /api/loops/[id]/messages] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

