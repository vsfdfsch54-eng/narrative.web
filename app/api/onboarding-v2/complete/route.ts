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
      userId,
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400, headers: getCorsHeaders() }
      )
    }

    const supabase = createServerClient()

    // Verify user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Update or create user record with V2 onboarding data
    const updateData: any = {
      email: email || authUser.user.email,
      nickname: nickname || null,
      profile_photo_url: photoUrl || null,
      age: age || null,
      mood: moodPreferences?.[0] || null, // Store first selected mood as default
      intention: intentionPreferences?.[0] || null, // Store first selected intention as default
      topic: topicPreferences?.[0] || null, // Store first selected topic as default
      schema_version: 'v2', // CRITICAL: Mark user as V2
      onboarding_completed: true,
      onboarding_step: 'complete',
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...updateData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single()

    if (updateError) {
      console.error('[Onboarding V2 Complete] Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save user data' },
        { status: 500, headers: getCorsHeaders() }
      )
    }

    console.log('[Onboarding V2 Complete] ✅ User updated:', {
      userId,
      schema_version: updatedUser?.schema_version,
      onboarding_completed: updatedUser?.onboarding_completed,
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
      data: updatedUser,
    }, { headers: getCorsHeaders() })

  } catch (error: any) {
    console.error('[Onboarding V2 Complete] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete onboarding' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

