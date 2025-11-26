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
            // Email exists but with different id - this could be:
            // 1. A legitimate conflict (user trying to use email from another account)
            // 2. A race condition where user was created multiple times
            // 3. An auth user ID mismatch (shouldn't happen but can)
            
            // Check if the requested userId exists in auth - if not, it's likely a stale/invalid request
            try {
              const { data: requestedAuthUser, error: requestedAuthError } = await supabase.auth.admin.getUserById(userId)
              
              if (requestedAuthError || !requestedAuthUser?.user) {
                // Requested userId doesn't exist in auth - use the existing user record instead
                console.warn('[Users API GET] ⚠️ Requested userId not in auth, using existing user by email', {
                  existingId: existingUserByEmail.id,
                  requestedId: userId,
                  email: userEmail
                })
                userData = existingUserByEmail
              } else if (requestedAuthUser.user.email === userEmail) {
                // The requested userId's email matches - this is likely a data inconsistency
                // Use the existing user record (it has the right email)
                console.warn('[Users API GET] ⚠️ Email matches but ID differs - using existing record', {
                  existingId: existingUserByEmail.id,
                  requestedId: userId,
                  email: userEmail
                })
                userData = existingUserByEmail
              } else {
                // Different email - this is a real conflict
                console.warn('[Users API GET] ⚠️ Email conflict: email exists with different id and different email', {
                  existingId: existingUserByEmail.id,
                  requestedId: userId,
                  existingEmail: existingUserByEmail.email,
                  requestedEmail: userEmail
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
            } catch (authCheckError) {
              // If we can't verify, be lenient and use existing record
              console.warn('[Users API GET] ⚠️ Could not verify auth user, using existing record', {
                existingId: existingUserByEmail.id,
                requestedId: userId,
                email: userEmail,
                error: authCheckError
              })
              userData = existingUserByEmail
            }
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

/**
 * Centralized function to save onboarding progress
 * This is the single source of truth for all onboarding data writes
 */
async function saveOnboardingProgress(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    questionsAnswers?: Record<string, string>
    interests?: string[]
    onboarding_step?: string
    onboarding_completed?: boolean
    email?: string
        }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { success: false, error: fetchError.message }
    }

    // Get email from existing user, provided data, or auth
    let email: string | null = null
    if (existingUser) {
      email = existingUser.email
    } else if (data.email) {
      email = data.email
      } else {
      // Try to get from auth
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authError || !authUser?.user?.email) {
          // If auth lookup fails but we have email in data, use it
          if (data.email) {
            email = data.email
          } else {
            // Last resort: use a placeholder (user will update later)
            email = `user_${userId.slice(0, 8)}@temp.narrative`
      }
    } else {
          email = authUser.user.email
        }
      } catch (authErr) {
        // Auth lookup failed - use provided email or placeholder
        email = data.email || `user_${userId.slice(0, 8)}@temp.narrative`
      }
    }
    
    // Build update object - only include fields that are provided
    const updateData: any = {
      id: userId,
      email: email,
      updated_at: new Date().toISOString()
    }
    
    // Set name from firstName and lastName
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName || ''
      const lastName = data.lastName || ''
      updateData.name = `${firstName} ${lastName}`.trim() || undefined
      updateData.first_name = data.firstName
      updateData.last_name = data.lastName
    }
    
    if (data.questionsAnswers !== undefined) {
      updateData.questions_answers = data.questionsAnswers
    }

    if (data.interests !== undefined) {
      updateData.interests = data.interests
    }
    
    if (data.onboarding_step !== undefined) {
      updateData.onboarding_step = data.onboarding_step
    }
    
    if (data.onboarding_completed !== undefined) {
      updateData.onboarding_completed = data.onboarding_completed
    }

    // Use upsert to handle both new users and existing users
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(updateData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()

    if (upsertError) {
      console.error('[saveOnboardingProgress] ❌ Upsert error:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details
      })
      
      // Handle duplicate email error
      if (upsertError.code === '23505' || upsertError.message.includes('duplicate key') || upsertError.message.includes('user_email_key')) {
        // Try updating without email
            const updateFields: any = {
              updated_at: new Date().toISOString()
            }
        if (data.firstName !== undefined || data.lastName !== undefined) {
          const firstName = data.firstName || ''
          const lastName = data.lastName || ''
          updateFields.name = `${firstName} ${lastName}`.trim() || undefined
          updateFields.first_name = data.firstName
          updateFields.last_name = data.lastName
        }
        if (data.questionsAnswers !== undefined) updateFields.questions_answers = data.questionsAnswers
        if (data.interests !== undefined) updateFields.interests = data.interests
        if (data.onboarding_step !== undefined) updateFields.onboarding_step = data.onboarding_step
        if (data.onboarding_completed !== undefined) updateFields.onboarding_completed = data.onboarding_completed
            
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update(updateFields)
              .eq('id', userId)
              .select()
            
            if (updateError) {
          return { success: false, error: updateError.message }
            }

            const finalData = Array.isArray(updateData) ? updateData[0] : updateData
        return { success: true, data: finalData }
      }

      return { success: false, error: upsertError.message }
    }

    const finalData = Array.isArray(upsertData) ? upsertData[0] : upsertData
    if (!finalData) {
      return { success: false, error: 'Failed to save user data. Please try again.' }
              }

    return { success: true, data: finalData }
  } catch (error: any) {
    console.error('[saveOnboardingProgress] Exception:', error)
    return { success: false, error: error.message || 'Unknown error' }
              }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, questionsAnswers, interests, onboarding_step, email: providedEmail, onboarding_completed } = body

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
    
    // Use centralized saveOnboardingProgress function
    const result = await saveOnboardingProgress(supabase, userId, {
      firstName,
      lastName,
      questionsAnswers,
      interests,
      onboarding_step,
      onboarding_completed,
      email: providedEmail,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save progress' },
        { 
          status: result.error?.includes('not found') ? 404 : 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
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

