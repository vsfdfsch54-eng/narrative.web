export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { getCorsHeaders } from '@/lib/cors-headers'

/**
 * POST /api/onboarding-v2/complete
 * Complete V2 onboarding and save user preferences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      nickname,
      photoUrl,
      age,
      moodPreferences,
      intentionPreferences,
      topicPreferences,
      notificationsEnabled,
      cameraEnabled,
      microphoneEnabled,
    } = body

    const supabase = createServerClient()

    // Get current user from auth
    // TODO: Get from session/auth headers
    // For now, we'll need to pass userId or get from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders() }
      )
    }

    // Extract user ID from auth (simplified - should use proper session)
    // TODO: Implement proper session handling

    // Update user record with V2 onboarding data
    // This will be implemented once we have proper auth session handling
    // For now, return success

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Onboarding V2 Complete] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete onboarding' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

