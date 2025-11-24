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
        console.log('[Users API GET] Attempting to upsert user:', {
          userId,
          email: authUser.user.email,
          name: authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        })
        
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

        // Log upsert result and error details for debugging
        console.log('[Users API GET] Upsert result:', {
          hasResult: !!upsertResult,
          isArray: Array.isArray(upsertResult),
          length: Array.isArray(upsertResult) ? upsertResult.length : 'N/A',
          result: upsertResult
        })
        
        if (createError) {
          console.error('[Users API GET] Upsert error details:', {
            message: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint
          })
        }

        // First, try to use the upsert result if available
        if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
          userData = upsertResult[0]
          console.log('[Users API GET] ✅ User from upsert result:', { id: userData.id, email: userData.email })
        } else if (upsertResult && !Array.isArray(upsertResult) && typeof upsertResult === 'object') {
          // Handle case where upsert returns a single object instead of array
          userData = upsertResult as any
          console.log('[Users API GET] ✅ User from upsert result (single object):', { id: (userData as any).id, email: (userData as any).email })
        } else {
          // If upsert didn't return data, try fetching with retry logic
          console.log('[Users API GET] Upsert returned no data, fetching user with retry...')
          console.log('[Users API GET] Upsert had error?', !!createError)
          console.log('[Users API GET] Upsert result type:', typeof upsertResult)
          
          let fetchedUser = null
          
          // Retry up to 5 times with increasing delays
          for (let attempt = 0; attempt < 5; attempt++) {
            const delay = 200 * (attempt + 1) // 200ms, 400ms, 600ms, 800ms, 1000ms
            console.log(`[Users API GET] Fetch attempt ${attempt + 1}, waiting ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            const { data: userData, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .maybeSingle()

            console.log(`[Users API GET] Fetch attempt ${attempt + 1} result:`, {
              hasData: !!userData,
              hasError: !!fetchError,
              error: fetchError ? {
                message: fetchError.message,
                code: fetchError.code,
                details: fetchError.details
              } : null
            })

            if (fetchError) {
              console.error(`[Users API GET] Fetch attempt ${attempt + 1} error:`, {
                message: fetchError.message,
                code: fetchError.code,
                details: fetchError.details
              })
              // Continue to next attempt
              continue
            }

            if (userData) {
              fetchedUser = userData
              console.log(`[Users API GET] ✅ User found on attempt ${attempt + 1}:`, { id: fetchedUser.id, email: fetchedUser.email })
              break
            }
          }

          if (!fetchedUser) {
            console.error('[Users API GET] ❌ User not found after upsert and all fetch attempts')
            console.error('[Users API GET] Final upsert result:', JSON.stringify(upsertResult, null, 2))
            console.error('[Users API GET] Final upsert error:', createError)
            
            // Try one more direct query to see if user exists at all
            const { data: finalCheck, error: finalError } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', userId)
              .maybeSingle()
            
            console.log('[Users API GET] Final direct check:', {
              hasData: !!finalCheck,
              hasError: !!finalError,
              error: finalError?.message
            })
            
            return NextResponse.json({ 
              success: false, 
              error: 'User not found. Please complete onboarding to create your profile.',
              details: createError 
                ? `Upsert failed: ${createError.message}` 
                : 'User was not created and could not be found after multiple attempts. Please try again.'
            }, { 
              status: 404,
              headers: {
                'Content-Type': 'application/json',
              }
            })
          }

          userData = fetchedUser
          console.log('[Users API GET] ✅ User verified after retry:', { id: userData.id, email: userData.email })
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
      return NextResponse.json(
        { success: false, error: 'Failed to save user data' }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

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

