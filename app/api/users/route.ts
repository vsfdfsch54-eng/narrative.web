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
    let userData = null
    
    // First, check if user exists in database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // If user doesn't exist, try to create from auth
    if (!existingUser) {
      console.log('[Users API GET] User not found in database, creating from auth...')
      
      try {
        // Get user from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !authUser?.user?.email) {
          console.error('[Users API GET] User not found in auth:', authError)
          return NextResponse.json({ 
            success: false, 
            error: 'User not found. Please complete signup first.' 
          }, { status: 404 })
        }

        // Auto-create user record using upsert to handle duplicate email/id
        // Note: upsert returns an array, so we don't use .single()
        const { data: upsertResult, error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: authUser.user.email,
            name: authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User',
            interests: [],
          }, {
            onConflict: 'id', // Update if user with this id exists
            ignoreDuplicates: false
          })
          .select('*')

        // Log upsert error details for debugging
        if (createError) {
          console.error('[Users API GET] Upsert error details:', {
            message: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint
          })
        }

        // Always try to fetch the user after upsert to ensure we have the latest data
        // This handles cases where upsert doesn't return data or returns unexpected format
        const { data: fetchedUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle() // Use maybeSingle to handle case where user doesn't exist

        if (fetchError) {
          console.error('[Users API GET] Error fetching user after upsert:', {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details
          })
          return NextResponse.json({ 
            success: false, 
            error: 'User not found. Please complete onboarding to create your profile.',
            details: fetchError.message || createError?.message || 'Unknown error'
          }, { status: 404 })
        }

        if (!fetchedUser) {
          console.error('[Users API GET] User not found after upsert and fetch')
          return NextResponse.json({ 
            success: false, 
            error: 'User not found. Please complete onboarding to create your profile.',
            details: 'User was not created and could not be found'
          }, { status: 404 })
        }

        userData = fetchedUser
        console.log('[Users API GET] ✅ User verified:', { id: userData.id, email: userData.email })
      } catch (error: any) {
        console.error('[Users API GET] Error creating user:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'User not found. Please complete onboarding first.' 
        }, { status: 404 })
      }
    } else {
      userData = existingUser
    }

    return NextResponse.json({ success: true, data: userData })
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

    // If user doesn't exist, get email from auth and create user
    let email: string | null = null
    if (!existingUser) {
      console.log('[Users API] User not found in database, fetching from auth...')
      // Get user email from Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (authError || !authUser?.user?.email) {
        console.error('[Users API] Error fetching user from auth:', authError)
        return NextResponse.json({ 
          success: false, 
          error: 'User not found in auth. Please complete signup first.' 
        }, { status: 404 })
      }
      email = authUser.user.email
      console.log('[Users API] Found user in auth, email:', email)
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

