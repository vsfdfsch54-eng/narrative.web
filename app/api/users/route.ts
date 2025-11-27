export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  // Parse URL safely - mobile browsers might format URLs differently
  let searchParams: URLSearchParams
  let userId: string | null = null
  
  try {
    const url = new URL(request.url)
    searchParams = url.searchParams
    userId = searchParams.get('userId')
  } catch (urlError: any) {
    console.error('[Users API GET] ❌ URL parsing error:', urlError)
    return NextResponse.json(
      { success: false, error: 'Invalid request URL' }, 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }

  // Validate userId - must be present and valid UUID format
  if (!userId || userId.trim() === '') {
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

  // Basic UUID validation (Supabase uses UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    console.warn('[Users API GET] ⚠️ Invalid userId format:', userId)
    return NextResponse.json(
      { success: false, error: 'Invalid user ID format' }, 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }

  // Log request for debugging (especially mobile issues)
  console.log('[Users API GET] Request received:', {
    userId,
    userAgent: request.headers.get('user-agent')?.substring(0, 50) || 'unknown',
    origin: request.headers.get('origin') || 'unknown',
    timestamp: new Date().toISOString()
  })

  try {
    // Create Supabase client - wrap in try-catch in case env vars are missing
    let supabase
    try {
      supabase = createServerClient()
    } catch (clientError: any) {
      console.error('[Users API GET] ❌ Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: clientError?.message || 'Failed to initialize database connection'
        }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
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
        // Get user from auth - wrap in try-catch to handle any unexpected errors
        let authUser = null
        let authError = null
        
        try {
          const result = await supabase.auth.admin.getUserById(userId)
          authUser = result.data
          authError = result.error
        } catch (adminError: any) {
          console.error('[Users API GET] ❌ Error calling auth.admin.getUserById:', adminError)
          authError = adminError
        }
        
        if (authError || !authUser?.user?.email) {
          console.error('[Users API GET] User not found in auth:', {
            error: authError,
            hasUser: !!authUser?.user,
            hasEmail: !!authUser?.user?.email,
            userId
          })
          return NextResponse.json({ 
            success: false, 
            error: 'User not found. Please complete signup first.',
            details: authError?.message || 'Auth lookup failed'
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
        
        // Handle email check error
        if (emailCheckError && emailCheckError.code !== 'PGRST116') {
          console.error('[Users API GET] Error checking email:', emailCheckError)
          return NextResponse.json({ 
            success: false, 
            error: 'Database error while checking user.' 
          }, { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            }
          })
        }
        
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
            
            // Email exists but with different id - check if it's a real conflict
            // We already have authUser from the outer scope, so check if emails match
            if (authUser.user.email === existingUserByEmail.email) {
              // The email matches - this is likely a data inconsistency (same email, different IDs)
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
          }
        } else {
          // No user with this email exists - safe to create new user
          // Ensure name is never null (NOT NULL constraint)
          const safeUserName = userName || userEmail?.split('@')[0] || 'User'
          
          const { data: upsertResult, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: userEmail,
              name: safeUserName, // Always provide a value (NOT NULL constraint)
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
        console.error('[Users API GET] ❌ Error in user creation block:', {
          error: error?.message,
          stack: error?.stack,
          name: error?.name,
          userId
        })
        // Return more detailed error for debugging
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create or retrieve user. Please try again.',
          details: error?.message || 'Unknown error'
        }, { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }
    } else {
      userData = existingUser
    }

    // Ensure userData is set before returning
    if (!userData) {
      console.error('[Users API GET] ❌ userData is null after all checks')
      return NextResponse.json(
        { success: false, error: 'User data not found. Please try again.' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
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
    console.error('[Users API GET] ❌ Unhandled error:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      userId: request.url ? new URL(request.url).searchParams.get('userId') : 'unknown'
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, 
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
    
    // CRITICAL: name column has NOT NULL constraint - always provide a value
    // Set name from firstName and lastName, or use existing name, or fallback
    let nameValue: string
    
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName || ''
      const lastName = data.lastName || ''
      nameValue = `${firstName} ${lastName}`.trim()
    } else if (existingUser?.name) {
      // Use existing name if available
      nameValue = existingUser.name
    } else if (email) {
      // Fallback to email username if no name provided
      nameValue = email.split('@')[0] || 'User'
    } else {
      // Last resort fallback
      nameValue = 'User'
    }
    
    // Always set name (required by NOT NULL constraint)
    updateData.name = nameValue
    
    // Set first_name and last_name if provided
    if (data.firstName !== undefined) {
      updateData.first_name = data.firstName
    }
    if (data.lastName !== undefined) {
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
    
    // Only include onboarding_completed if column exists (handle schema cache issues)
    // If the column doesn't exist, we'll set it via onboarding_step = 'complete' instead
    // Handle onboarding_completed - if column doesn't exist, use onboarding_step = 'complete' instead
    if (data.onboarding_completed !== undefined) {
      // If completing onboarding, always set onboarding_step to 'complete'
      if (data.onboarding_completed === true || data.onboarding_step === 'complete') {
        updateData.onboarding_step = 'complete'
        // Try to include onboarding_completed, but it may not exist in schema cache
        updateData.onboarding_completed = data.onboarding_completed
      } else {
        updateData.onboarding_completed = data.onboarding_completed
      }
    } else if (data.onboarding_step === 'complete') {
      // If step is 'complete' but onboarding_completed not provided, set it
      updateData.onboarding_step = 'complete'
      updateData.onboarding_completed = true
    }

    // Log what we're about to save
    console.log('[saveOnboardingProgress] Saving to database:', {
      userId,
      onboarding_step: updateData.onboarding_step,
      onboarding_completed: updateData.onboarding_completed,
      hasName: !!updateData.name,
      hasFirstName: !!updateData.first_name,
      hasLastName: !!updateData.last_name,
      hasInterests: !!updateData.interests,
      hasQuestions: !!updateData.questions_answers,
    })

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
        details: upsertError.details,
        hint: upsertError.hint,
      })
      
      // If error is about missing column (schema cache issue), try without onboarding_completed
      const isColumnError = upsertError.message?.includes('onboarding_completed') || 
                            upsertError.message?.includes('schema cache') ||
                            (upsertError.message?.includes('column') && upsertError.message?.includes('users')) ||
                            upsertError.message?.includes('Could not find')
      
      if (isColumnError) {
        console.warn('[saveOnboardingProgress] ⚠️ Column error detected (schema cache issue), retrying without onboarding_completed')
        console.warn('[saveOnboardingProgress] Error details:', upsertError.message)
        
        // Remove onboarding_completed and try again
        const { onboarding_completed, ...updateDataWithoutCompleted } = updateData
        // Ensure name is still set (NOT NULL constraint)
        if (!updateDataWithoutCompleted.name) {
          updateDataWithoutCompleted.name = nameValue
        }
        // Ensure onboarding_step is set correctly - this is the fallback
        if (data.onboarding_completed === true || data.onboarding_step === 'complete') {
          updateDataWithoutCompleted.onboarding_step = 'complete'
          console.log('[saveOnboardingProgress] Using onboarding_step = "complete" as fallback')
        }
        
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .upsert(updateDataWithoutCompleted, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
        
        if (retryError) {
          console.error('[saveOnboardingProgress] ❌ Retry also failed:', retryError.message)
          return { success: false, error: retryError.message }
        }
        
        console.log('[saveOnboardingProgress] ✅ Retry succeeded without onboarding_completed column')
        return { success: true, data: Array.isArray(retryData) ? retryData[0] : retryData }
      }
      
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
  let userId: string | null = null
  
  try {
    // Parse request body safely
    let body: any
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[Users API PUT] ❌ JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' }, 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
    const { firstName, lastName, questionsAnswers, interests, onboarding_step, email: providedEmail, onboarding_completed } = body
    userId = body.userId

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

    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.warn('[Users API PUT] ⚠️ Invalid userId format:', userId)
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' }, 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Create Supabase client with error handling
    let supabase
    try {
      supabase = createServerClient()
    } catch (clientError: any) {
      console.error('[Users API PUT] ❌ Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: clientError?.message || 'Failed to initialize database connection'
        }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
    // Use centralized saveOnboardingProgress function
    console.log('[Users API PUT] Saving onboarding progress:', {
      userId,
      onboarding_step,
      onboarding_completed,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      hasQuestions: !!questionsAnswers,
      hasInterests: !!interests,
      hasEmail: !!providedEmail,
    })

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
      console.error('[Users API PUT] ❌ Save failed:', {
        userId,
        error: result.error,
        onboarding_step,
        onboarding_completed,
      })
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

    console.log('[Users API PUT] ✅ Save successful:', {
      userId,
      savedStep: result.data?.onboarding_step,
      savedCompleted: result.data?.onboarding_completed,
      savedName: result.data?.name,
    })

    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error: any) {
    console.error('[Users API PUT] ❌ Unhandled error:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      userId
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

