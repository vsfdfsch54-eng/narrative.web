export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// GET - Get notifications for a user
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
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email)
      `)
      .eq('recipient_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting notifications:', error)
      return NextResponse.json(
        { error: 'Failed to get notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, senderId, type, message } = body

    if (!recipientId || !senderId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        message: message || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Mark notification as read or accept community request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId, action } = body // action: 'read' or 'accept'

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    if (action === 'accept') {
      // Get the notification to find sender
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .single()

      if (notifError || !notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      // Create relationship (bidirectional)
      const { error: relError } = await supabase
        .from('relationships')
        .upsert({
          user1_id: userId,
          user2_id: notification.sender_id,
          relationship_tier: 'community',
          message_count: 0,
          last_interaction_at: new Date().toISOString(),
        }, {
          onConflict: 'user1_id,user2_id',
        })

      if (relError) {
        console.error('Error creating relationship:', relError)
        return NextResponse.json(
          { error: 'Failed to create relationship' },
          { status: 500 }
        )
      }

      // Create acceptance notification for the sender
      await supabase
        .from('notifications')
        .insert({
          recipient_id: notification.sender_id,
          sender_id: userId,
          type: 'community_accepted',
          message: null,
        })
    }

    // Mark notification as read
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

