export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * PUT /api/notifications/mark-read
 * Mark a single notification as read
 * Body: { notificationId: string, userId: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId } = body

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing notificationId or userId' },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(notificationId) || !uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid UUID format' },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      )
    }

    const supabase = createServerClient()

    // Update notification (only if it belongs to the user)
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Notifications API] Error marking notification as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notification as read', details: error.message },
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { 
          status: 404,
          headers: getCorsHeaders(),
        }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data,
      },
      {
        headers: getCorsHeaders(),
      }
    )
  } catch (error: any) {
    console.error('[Notifications API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
    )
  }
}

