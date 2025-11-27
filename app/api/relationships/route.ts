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
    
    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('relationships')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single()

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

    if (error) {
      console.error('Error creating relationship:', error)
      return NextResponse.json(
        { error: 'Failed to create relationship' },
        { status: 500 }
      )
    }

    // If relationship didn't exist before, create notification for user2
    if (!existing) {
      // Get user1's name for the notification
      const { data: senderData } = await supabase
        .from('users')
        .select('name, first_name')
        .eq('id', user1Id)
        .single()

      const senderName = senderData?.first_name || senderData?.name || 'Someone'

      // Create notification for user2 using RPC function
      await supabase.rpc('create_notification', {
        p_user_id: user2Id,
        p_sender_id: user1Id,
        p_type: 'community_added',
        p_title: `${senderName} wants to add you`,
        p_body: `${senderName} wants to add you to their community. Tap to accept or decline.`,
        p_metadata: { userId: user1Id },
      })
    }

    // Handle array response from upsert
    const finalData = Array.isArray(data) ? data[0] : data
    return NextResponse.json({ success: true, data: finalData })
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

