export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { autoMatchUser } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    const matches = await autoMatchUser(userId)

    return NextResponse.json({ 
      success: true, 
      data: matches,
      count: matches.length 
    })
  } catch (error: any) {
    console.error('Error in POST /api/users/auto-match:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

