export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { autoMatchUser } from '@/lib/supabase-helpers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, interests } = body

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'User ID and name required' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // If user doesn't exist, get email from auth
    let email: string | null = null
    if (!existingUser) {
      // Get user email from Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (authError || !authUser?.user?.email) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found in auth or email missing' 
        }, { status: 400 })
      }
      email = authUser.user.email
    } else {
      email = existingUser.email
    }

    // Now upsert with email and interests
    // Use upsert to handle both new users and existing users
    // onConflict: 'id' means update if user with this id exists
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: name,
        interests: interests || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false // Update if exists
      })
      .select()

    if (upsertError) {
      // Handle duplicate email error gracefully
      if (upsertError.message.includes('duplicate key') || upsertError.message.includes('unique constraint') || upsertError.code === '23505') {
        // Email already exists, try to update by id instead
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            name: name,
            interests: interests || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
        
        if (updateError) {
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

        // Handle array response
        const finalData = Array.isArray(updateData) ? updateData[0] : updateData
        return NextResponse.json({ success: true, data: finalData })
      }
      
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
    }

    // Handle array response from upsert
    const finalData = Array.isArray(upsertData) ? upsertData[0] : upsertData
    if (!finalData) {
      return NextResponse.json({ success: false, error: 'Failed to save user data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: finalData })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

