export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { getAllTopics, getTopicsByCategory } from '@/lib/supabase-helpers'

export async function GET(request: NextRequest) {
  // Access searchParams outside try/catch to ensure Next.js recognizes dynamic usage
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  try {

    let result
    if (category) {
      result = await getTopicsByCategory(category)
    } else {
      result = await getAllTopics()
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error in GET /api/topics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

