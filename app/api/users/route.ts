export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

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

        // FIRST: Check if a user with this email already exists (to prevent duplicate email errors)
        const userEmail = authUser.user.email
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        
        const { data: existingUserByEmail, error: emailCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle()
        
        if (existingUserByEmail) {
          // User with this email already exists
          if (existingUserByEmail.id === userId) {
            // Same user, same email - use existing record
            userData = existingUserByEmail
          } else {
            // Email exists but with different id - this is a conflict
            console.warn('[Users API GET] ⚠️ Email conflict: email exists with different id', {
              existingId: existingUserByEmail.id,
              requestedId: userId,
              email: userEmail
            })
            return NextResponse.json({ 
              success: false, 
              error: 'An account with this email already exists. Please sign in instead.',
              details: 'Email is already registered with a different account.'
            }, { 
              status: 409, // Conflict
              headers: {
                'Content-Type': 'application/json',
              }
            })
          }
        } else {
          // No user with this email exists - safe to create new user
          const { data: upsertResult, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: userEmail,
              name: userName,
              interests: [],
              onboarding_step: 'email', // Start at email step, not 'start'
            }, {
              onConflict: 'id', // Update if user with this id exists
              ignoreDuplicates: false
            })
            .select('*')

          if (createError) {
            console.error('[Users API GET] ❌ Upsert error:', {
              message: createError.message,
              code: createError.code,
              details: createError.details
            })
            
            // If duplicate email error, check by email (in case email was created between our check and upsert)
            if (createError.code === '23505' || createError.message.includes('duplicate key') || createError.message.includes('user_email_key')) {
              const { data: existingByEmail, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle()
              
              if (existingByEmail && !fetchError) {
                userData = existingByEmail
              } else {
                return NextResponse.json({ 
                  success: false, 
                  error: 'Failed to create user record. An account with this email may already exist.',
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
            } else {
              // If no data returned, try fetching once
              const { data: fetchedUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()
              
              if (fetchedUser && !fetchError) {
                userData = fetchedUser
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
    const { userId, name, interests, onboarding_step } = body

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
    // BUT: Don't auto-create during PUT if user is mid-onboarding (preserve existing step)
    let email: string | null = null
    if (!existingUser) {
      // Get user email from Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (authError || !authUser?.user?.email) {
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
    } else {
      email = existingUser.email
      // If user exists and has onboarding_step, preserve it unless explicitly updating
      // This prevents overwriting progress during concurrent requests
    }

    // Now upsert with email, interests, and onboarding_step
    // Use upsert to handle both new users and existing users
    // onConflict: 'id' means update if user with this id exists
    
    // Build update object - only include fields that are provided
    const updateData: any = {
      id: userId,
      email: email,
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) {
      updateData.name = name
    }
    
    if (interests !== undefined) {
      updateData.interests = interests || []
    }
    
    if (onboarding_step !== undefined) {
      updateData.onboarding_step = onboarding_step
    }
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(updateData, {
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
      if (upsertError.message.includes('duplicate key') || upsertError.message.includes('unique constraint') || upsertError.message.includes('user_email_key') || upsertError.code === '23505') {
        // Email already exists - check if it's the same user or different user
        const { data: existingByEmail, error: emailCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle()
        
        if (existingByEmail) {
          if (existingByEmail.id === userId) {
            // Same user - just update without email
            const updateFields: any = {
              updated_at: new Date().toISOString()
            }
            if (name !== undefined) updateFields.name = name
            if (interests !== undefined) updateFields.interests = interests || []
            if (onboarding_step !== undefined) updateFields.onboarding_step = onboarding_step
            
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update(updateFields)
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

            const finalData = Array.isArray(updateData) ? updateData[0] : updateData
            return NextResponse.json(
              { success: true, data: finalData },
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            )
          } else {
            // Different user with same email - conflict
            console.error('[Users API PUT] ❌ Email conflict: email belongs to different user', {
              existingId: existingByEmail.id,
              requestedId: userId,
              email: email
            })
            return NextResponse.json(
              { success: false, error: 'An account with this email already exists. Please use a different email.' }, 
              { 
                status: 409, // Conflict
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            )
          }
        } else {
          // Email check failed, try updating by id as fallback
          const updateFields: any = {
            updated_at: new Date().toISOString()
          }
          if (name !== undefined) updateFields.name = name
          if (interests !== undefined) updateFields.interests = interests || []
          if (onboarding_step !== undefined) updateFields.onboarding_step = onboarding_step
          
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update(updateFields)
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

