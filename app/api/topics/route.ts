export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { getAllTopics, getTopicsByCategory } from '@/lib/supabase-helpers'

export async function GET(request: NextRequest) {
  try {
    // Access searchParams inside try/catch to handle URL parsing errors
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let result
    if (category) {
      result = await getTopicsByCategory(category)
    } else {
      result = await getAllTopics()
    }

    // Ensure we always return a valid response, even if result is empty
    return NextResponse.json({ 
      success: true, 
      data: result || [] 
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error: any) {
    console.error('[Topics API] Error:', error)
    // Return empty array instead of error to prevent breaking the UI
    return NextResponse.json(
      { 
        success: true, 
        data: [],
        error: error?.message || 'Failed to load topics'
      },
      { 
        status: 200, // Return 200 so client can handle gracefully
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

