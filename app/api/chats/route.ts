import { NextRequest, NextResponse } from 'next/server'
import { getRecentChats, getUserMatches } from '@/lib/supabase-helpers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'recent' // 'recent' or 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId query parameter' },
        { status: 400 }
      )
    }

    let result
    if (type === 'all') {
      result = await getUserMatches(userId)
    } else {
      const limit = parseInt(searchParams.get('limit') || '10')
      result = await getRecentChats(userId, limit)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in GET /api/chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

