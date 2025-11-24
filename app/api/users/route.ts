export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { autoMatchUser } from '@/lib/supabase-helpers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' }, 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
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
      return NextResponse.json(
        { success: false, error: fetchError.message }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
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
          }, { 
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            }
          })
        }

        // Auto-create user record using upsert to handle duplicate email/id
        // Note: upsert returns an array, so we don't use .single()
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        console.log('[Users API GET] Attempting to upsert user:', {
          userId,
          email: authUser.user.email,
          name: userName
        })
        
        const { data: upsertResult, error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: authUser.user.email,
            name: userName,
            interests: [],
          }, {
            onConflict: 'id', // Update if user with this id exists
            ignoreDuplicates: false
          })
          .select('*')

        // Log upsert result and error details for debugging
        if (createError) {
          console.error('[Users API GET] ❌ Upsert error:', {
            message: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint
          })
          
          // If upsert fails, try a direct insert (in case of unique constraint on email)
          if (createError.code === '23505' || createError.message.includes('duplicate key')) {
            console.log('[Users API GET] Duplicate key error, trying to fetch existing user...')
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .maybeSingle()
            
            if (existingUser && !fetchError) {
              userData = existingUser
              console.log('[Users API GET] ✅ Found existing user:', { id: userData.id, email: userData.email })
            } else {
              return NextResponse.json({ 
                success: false, 
                error: 'Failed to create user record. Please try again.',
                details: createError.message
              }, { 
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                }
              })
            }
          } else {
            return NextResponse.json({ 
              success: false, 
              error: 'Failed to create user record.',
              details: createError.message
            }, { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              }
            })
          }
        } else {
          // Handle upsert result - it's always an array
          if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
            userData = upsertResult[0]
            console.log('[Users API GET] ✅ User created/updated:', { id: userData.id, email: userData.email })
          } else {
            // If no data returned, try fetching once
            console.log('[Users API GET] Upsert returned no data, fetching user...')
            const { data: fetchedUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .maybeSingle()
            
            if (fetchedUser && !fetchError) {
              userData = fetchedUser
              console.log('[Users API GET] ✅ User found after fetch:', { id: userData.id, email: userData.email })
            } else {
              return NextResponse.json({ 
                success: false, 
                error: 'User was created but could not be retrieved. Please try again.',
                details: fetchError?.message || 'Unknown error'
              }, { 
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                }
              })
            }
          }
        }
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

    return NextResponse.json(
      { success: true, data: userData },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, interests } = body

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and name required' }, 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    const supabase = createServerClient()
    
    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
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
        }, { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }
      email = authUser.user.email
      console.log('[Users API] Found user in auth, email:', email)
    } else {
      email = existingUser.email
    }

    // Now upsert with email and interests
    // Use upsert to handle both new users and existing users
    // onConflict: 'id' means update if user with this id exists
    console.log('[Users API PUT] Upserting user:', { userId, email, name, interestsCount: interests?.length || 0 })
    
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
      console.error('[Users API PUT] ❌ Upsert error:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details
      })
      
      // Handle duplicate email error gracefully
      if (upsertError.message.includes('duplicate key') || upsertError.message.includes('unique constraint') || upsertError.code === '23505') {
        // Email already exists, try to update by id instead
        console.log('[Users API PUT] Duplicate email detected, updating by id...')
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
          console.error('[Users API PUT] ❌ Update error:', updateError.message)
          return NextResponse.json(
            { success: false, error: updateError.message }, 
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              }
            }
          )
        }

        // Handle array response
        const finalData = Array.isArray(updateData) ? updateData[0] : updateData
        console.log('[Users API PUT] ✅ User updated:', { id: finalData?.id, email: finalData?.email })
        return NextResponse.json(
          { success: true, data: finalData },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      }
      
      return NextResponse.json(
        { success: false, error: upsertError.message }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Handle array response from upsert
    const finalData = Array.isArray(upsertData) ? upsertData[0] : upsertData
    if (!finalData) {
      console.error('[Users API PUT] ❌ Upsert returned no data')
      return NextResponse.json(
        { success: false, error: 'Failed to save user data. Please try again.' }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    console.log('[Users API PUT] ✅ User saved successfully:', { id: finalData.id, email: finalData.email })
    return NextResponse.json(
      { success: true, data: finalData },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

