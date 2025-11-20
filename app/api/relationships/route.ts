export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user1Id, user2Id } = body

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: 'Missing user1Id or user2Id' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Create relationship (or update if exists)
    const { data, error } = await supabase
      .from('relationships')
      .upsert({
        user1_id: user1Id,
        user2_id: user2Id,
        relationship_tier: 'community',
        message_count: 0,
        last_interaction_at: new Date().toISOString(),
      }, {
        onConflict: 'user1_id,user2_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating relationship:', error)
      return NextResponse.json(
        { error: 'Failed to create relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/relationships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId query parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_interaction_at', { ascending: false })

    if (error) {
      console.error('Error getting relationships:', error)
      return NextResponse.json(
        { error: 'Failed to get relationships' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error in GET /api/relationships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

