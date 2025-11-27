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
 * PUT /api/notifications/mark-all-read
 * Mark all notifications for a user as read
 * Body: { userId: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      )
    }

    const supabase = createServerClient()

    // Update all unread notifications for this user
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    if (error) {
      console.error('[Notifications API] Error marking all notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read', details: error.message },
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        count: data?.length || 0,
        data: data || [],
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

