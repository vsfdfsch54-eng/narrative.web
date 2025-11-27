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
    
    // PART 2: GUARD AT TOP - Check if user exists FIRST, return immediately if found
    // This prevents any creation logic from running if user already exists
    let existingUser = null
    let fetchError = null
    
    try {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      existingUser = result.data
      fetchError = result.error
    } catch (dbError: any) {
      console.error('[Users API GET] ❌ Database query error:', {
        message: dbError?.message,
        code: dbError?.code,
        userId
      })
      fetchError = dbError
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Users API GET] ❌ Database fetch error:', {
        message: fetchError.message,
        code: fetchError.code,
        userId
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error. Please try again.',
          details: fetchError.message
        }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // PART 2: CRITICAL GUARD - If user exists, return immediately
    // DO NOT run any creation logic - this prevents overwriting progress
    if (existingUser) {
      // PART 5: Verbose logging - log what we're returning
      console.log('[Users API GET] ✅ Existing record returned:', {
        userId,
        onboarding_step: existingUser.onboarding_step,
        onboarding_completed: existingUser.onboarding_completed,
        name: existingUser.name,
        email: existingUser.email,
      })
      
      return NextResponse.json(
        { success: true, data: existingUser },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // PART 2: User doesn't exist - only create if auth confirms user exists
    // DO NOT create based on email-only collisions
    if (!existingUser) {
      try {
        // Get user from auth - wrap in try-catch to handle any unexpected errors
        let authUser = null
        let authError = null
        
        try {
          // Add timeout to prevent hanging (5 seconds max)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth lookup timeout')), 5000)
          })
          
          const result = await Promise.race([
            supabase.auth.admin.getUserById(userId),
            timeoutPromise
          ]) as Awaited<ReturnType<typeof supabase.auth.admin.getUserById>>
          
          authUser = result.data
          authError = result.error
        } catch (adminError: any) {
          console.error('[Users API GET] ❌ Error calling auth.admin.getUserById:', {
            message: adminError?.message,
            name: adminError?.name,
            userId
          })
          // If it's a timeout or network error, return a more helpful error
          if (adminError?.message?.includes('timeout') || adminError?.name === 'AbortError') {
            return NextResponse.json({ 
              success: false, 
              error: 'Authentication service temporarily unavailable. Please try again.',
              details: 'Auth lookup timed out'
            }, { 
              status: 503,
              headers: {
                'Content-Type': 'application/json',
              }
            })
          }
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
          // No user with this email exists - BUT check if user exists by ID first
          // This prevents race conditions where user was just created or updated
          const { data: existingById, error: idCheckError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          
          if (existingById) {
            // User exists by ID - use it (might have been created/updated between our checks)
            console.log('[Users API GET] User found by ID after email check, using existing record')
            userData = existingById
          } else {
            // User truly doesn't exist - safe to create
            // Ensure name is never null (NOT NULL constraint)
            const safeUserName = userName || userEmail?.split('@')[0] || 'User'
            
            // Use INSERT instead of UPSERT to prevent overwriting existing users
            // If user exists, we'll catch the duplicate key error and fetch it
            const { data: insertResult, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: userEmail,
                name: safeUserName, // Always provide a value (NOT NULL constraint)
                interests: [],
                onboarding_step: 'email', // Start at email step, not 'start'
              })
              .select('*')
            
            // Handle duplicate key error (user was created between checks)
            if (insertError && (insertError.code === '23505' || insertError.message.includes('duplicate') || insertError.message.includes('unique'))) {
              console.log('[Users API GET] User was created between checks, fetching existing record')
              // User was created - fetch it
              const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()
              
              if (existingUser && !fetchError) {
                userData = existingUser
              } else {
                // Return error if we can't fetch
                console.error('[Users API GET] Failed to fetch user after duplicate key error:', fetchError)
                return NextResponse.json({ 
                  success: false, 
                  error: 'Failed to create user record. Please try again.' 
                }, { 
                  status: 500,
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })
              }
            } else if (insertError) {
              // Other error
              console.error('[Users API GET] ❌ Insert error:', insertError)
              return NextResponse.json({ 
                success: false, 
                error: insertError.message || 'Failed to create user record' 
              }, { 
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                }
              })
            } else if (insertResult && insertResult.length > 0) {
              userData = Array.isArray(insertResult) ? insertResult[0] : insertResult
              // PART 5: Verbose logging - newly created record
              console.log('[Users API GET] ✅ Newly created record:', {
                userId,
                onboarding_step: userData.onboarding_step,
                onboarding_completed: userData.onboarding_completed,
                name: userData.name,
                email: userData.email,
              })
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
    }

    // PART 2: Ensure userData is set before returning
    // This should only happen if user was just created
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

    // PART 5: Verbose logging - final return (for newly created users)
    console.log('[Users API GET] ✅ Returning user data:', {
      userId,
      onboarding_step: userData.onboarding_step,
      onboarding_completed: userData.onboarding_completed,
      name: userData.name,
      email: userData.email,
    })

    return NextResponse.json(
      { success: true, data: userData },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error: any) {
    const errorDetails = {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      userId: request.url ? new URL(request.url).searchParams.get('userId') : 'unknown',
      timestamp: new Date().toISOString()
    }
    
    console.error('[Users API GET] ❌ Unhandled error:', errorDetails)
    
    // Provide more helpful error message based on error type
    let userFriendlyError = 'Internal server error. Please try again.'
    if (error?.message?.includes('timeout')) {
      userFriendlyError = 'Request timed out. The server may be busy. Please try again.'
    } else if (error?.message?.includes('ENOTFOUND') || error?.message?.includes('ECONNREFUSED')) {
      userFriendlyError = 'Database connection failed. Please try again in a moment.'
    } else if (error?.message?.includes('Missing') || error?.message?.includes('environment')) {
      userFriendlyError = 'Server configuration error. Please contact support.'
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: userFriendlyError,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        errorType: error?.name || 'UnknownError'
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
    
    // PART 6: Defensive conversion - NEVER allow "start" values
    let stepToSave: string | undefined = data.onboarding_step
    if (stepToSave === 'start') {
      console.warn('[saveOnboardingProgress] ⚠️ Converting "start" to "email" (defensive patch)')
      stepToSave = 'email'
    }
    
    if (stepToSave !== undefined) {
      updateData.onboarding_step = stepToSave
    }
    
    // PART 1: HARD RULE - If onboarding_completed === true, ALWAYS set both fields
    // This must happen BEFORE any other logic to ensure it's never overwritten
    if (data.onboarding_completed === true) {
      updateData.onboarding_step = 'complete'
      updateData.onboarding_completed = true
      console.log('[saveOnboardingProgress] ✅ HARD RULE: onboarding_completed=true → forcing onboarding_step="complete"')
    } else if (data.onboarding_step === 'complete') {
      // If step is 'complete' but onboarding_completed not explicitly false, set it to true
      updateData.onboarding_step = 'complete'
      updateData.onboarding_completed = true
      console.log('[saveOnboardingProgress] ✅ Step is "complete" → setting onboarding_completed=true')
    } else if (data.onboarding_completed !== undefined) {
      // onboarding_completed is explicitly false or undefined, but not true
      updateData.onboarding_completed = data.onboarding_completed
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
        // PART 1: Ensure onboarding_step is set correctly - this is the fallback
        // If onboarding_completed was true, we MUST set step to 'complete'
        if (data.onboarding_completed === true || updateData.onboarding_step === 'complete') {
          updateDataWithoutCompleted.onboarding_step = 'complete'
          console.log('[saveOnboardingProgress] Using onboarding_step = "complete" as fallback (schema cache issue)')
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
        const savedRecord = Array.isArray(retryData) ? retryData[0] : retryData
        // Verify the saved data
        if (data.onboarding_completed === true && savedRecord?.onboarding_step !== 'complete') {
          console.warn('[saveOnboardingProgress] ⚠️ WARNING: Saved onboarding_step is not "complete" when it should be:', savedRecord?.onboarding_step)
        }
        return { success: true, data: savedRecord }
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

    // PART 1: Post-save verification - re-fetch and confirm the save worked
    // This is critical for completion saves
    if (data.onboarding_completed === true || updateData.onboarding_step === 'complete') {
      console.log('[saveOnboardingProgress] 🔍 Verifying completion save...')
      
      // Re-fetch the user to confirm the save
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('onboarding_step, onboarding_completed')
        .eq('id', userId)
        .maybeSingle()
      
      if (verifyError) {
        console.error('[saveOnboardingProgress] ❌ Verification fetch error:', verifyError.message)
        // Still return success - the upsert succeeded, verification is just a safety check
      } else if (verifyData) {
        const savedStep = verifyData.onboarding_step
        const savedCompleted = verifyData.onboarding_completed
        
        // CRITICAL: If we saved completion but DB doesn't reflect it, log error and retry once
        if (data.onboarding_completed === true && (savedStep !== 'complete' || savedCompleted !== true)) {
          console.error('[saveOnboardingProgress] ❌ CRITICAL: Completion save verification FAILED!', {
            userId,
            expectedStep: 'complete',
            actualStep: savedStep,
            expectedCompleted: true,
            actualCompleted: savedCompleted,
          })
          
          // Retry once with explicit completion
          console.log('[saveOnboardingProgress] 🔄 Retrying completion save...')
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .update({
              onboarding_step: 'complete',
              onboarding_completed: true,
            })
            .eq('id', userId)
            .select()
          
          if (retryError) {
            console.error('[saveOnboardingProgress] ❌ Retry also failed:', retryError.message)
          } else {
            console.log('[saveOnboardingProgress] ✅ Retry succeeded')
            return { success: true, data: Array.isArray(retryData) ? retryData[0] : retryData }
          }
        } else {
          console.log('[saveOnboardingProgress] ✅ Verification passed:', {
            userId,
            savedStep,
            savedCompleted,
          })
        }
      }
    }

    // PART 5: Verbose logging - log what was actually saved
    console.log('[saveOnboardingProgress] ✅ Save successful:', {
      userId,
      savedStep: finalData.onboarding_step,
      savedCompleted: finalData.onboarding_completed,
      savedName: finalData.name,
      incomingStep: data.onboarding_step,
      incomingCompleted: data.onboarding_completed,
    })

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
    
    let { firstName, lastName, questionsAnswers, interests, onboarding_step, email: providedEmail, onboarding_completed } = body
    userId = body.userId

    // PART 6: Defensive conversion - NEVER allow "start" values
    if (onboarding_step === 'start') {
      console.warn('[Users API PUT] ⚠️ Converting "start" to "email" (defensive patch)')
      onboarding_step = 'email'
    }

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
    
    // PART 5: Verbose logging - log incoming data
    console.log('[Users API PUT] 📝 Saving onboarding progress:', {
      userId,
      incomingStep: onboarding_step,
      incomingCompleted: onboarding_completed,
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

    // PART 5: Verbose logging - log what was actually saved
    console.log('[Users API PUT] ✅ Save successful:', {
      userId,
      incomingStep: onboarding_step,
      incomingCompleted: onboarding_completed,
      savedStep: result.data?.onboarding_step,
      savedCompleted: result.data?.onboarding_completed,
      savedName: result.data?.name,
      stepMatch: result.data?.onboarding_step === onboarding_step,
      completedMatch: result.data?.onboarding_completed === onboarding_completed,
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

