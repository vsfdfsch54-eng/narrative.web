import { NextRequest, NextResponse } from 'next/server'
import { getAllTopics, getTopicsByCategory } from '@/lib/supabase-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let result
    if (category) {
      result = await getTopicsByCategory(category)
    } else {
      result = await getAllTopics()
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in GET /api/topics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

