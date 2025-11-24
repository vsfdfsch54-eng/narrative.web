export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { generatePersonalityProfile } from '@/lib/ai/openai-service'

/**
 * POST /api/personality/generate
 * Generates AI personality profile from questionnaire answers, interests, and optional vibe/topic
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is available
    const hasApiKey = !!process.env.OPENAI_API_KEY
    console.log('[Personality Generate] OPENAI_API_KEY available:', hasApiKey)
    if (!hasApiKey) {
      console.error('[Personality Generate] ❌ OPENAI_API_KEY is missing!')
      console.error('[Personality Generate] Check .env.local file and restart dev server')
    }
    
    const body = await request.json()
    const { userId, questionnaireAnswers, interests, vibe, topic } = body

    console.log('[Personality Generate] Received request for userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    if (!questionnaireAnswers || typeof questionnaireAnswers !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid questionnaireAnswers' },
        { status: 400 }
      )
    }

    if (!interests || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Missing or invalid interests array' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify user exists, or create if they exist in auth
    let user = null
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .maybeSingle()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('[Personality Generate] Error checking user:', userCheckError)
      return NextResponse.json(
        { error: 'Database error', details: userCheckError.message },
        { status: 500 }
      )
    }

    if (!existingUser) {
      // User doesn't exist, try to create from auth
      console.log('[Personality Generate] User not found in database, creating from auth...')
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authError || !authUser?.user?.email) {
          console.error('[Personality Generate] User not found in auth:', authError)
          return NextResponse.json(
            { error: 'User not found. Please complete onboarding first.' },
            { status: 404 }
          )
        }

        // FIRST: Check if a user with this email already exists (to prevent duplicate email errors)
        const userEmail = authUser.user.email
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        
        console.log('[Personality Generate] Checking for existing user by email...')
        const { data: existingUserByEmail, error: emailCheckError } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('email', userEmail)
          .maybeSingle()
        
        if (existingUserByEmail) {
          // User with this email already exists
          if (existingUserByEmail.id === userId) {
            // Same user, same email - use existing record
            user = existingUserByEmail
            console.log('[Personality Generate] ✅ Found existing user (id and email match):', { id: user.id, email: user.email })
          } else {
            // Email exists but with different id - use the existing user's id
            console.warn('[Personality Generate] ⚠️ Email conflict: email exists with different id, using existing user', {
              existingId: existingUserByEmail.id,
              requestedId: userId,
              email: userEmail
            })
            user = existingUserByEmail
            console.log('[Personality Generate] ✅ Using existing user by email:', { id: user.id, email: user.email })
          }
        } else {
          // No user with this email exists - safe to create new user
          console.log('[Personality Generate] No existing user with this email, creating new user...')
          
          const { data: upsertResult, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: userEmail,
              name: userName,
              interests: [],
            }, {
              onConflict: 'id', // Update if user with this id exists
              ignoreDuplicates: false
            })
            .select('id, email, name')

          if (createError) {
            console.error('[Personality Generate] ❌ Upsert error:', {
              message: createError.message,
              code: createError.code,
              details: createError.details
            })
            
            // If duplicate email error, check by email (in case email was created between our check and upsert)
            if (createError.code === '23505' || createError.message.includes('duplicate key') || createError.message.includes('user_email_key')) {
              console.log('[Personality Generate] Duplicate email error, fetching existing user by email...')
              const { data: existingByEmail, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name')
                .eq('email', userEmail)
                .maybeSingle()
              
              if (existingByEmail && !fetchError) {
                user = existingByEmail
                console.log('[Personality Generate] ✅ Found existing user by email after error:', { id: user.id, email: user.email })
              } else {
                return NextResponse.json(
                  { 
                    success: false,
                    error: 'Failed to create user record. An account with this email may already exist.',
                    details: createError.message
                  },
                  { status: 500 }
                )
              }
            } else {
              return NextResponse.json(
                { 
                  success: false,
                  error: 'Failed to create user record.',
                  details: createError.message
                },
                { status: 500 }
              )
            }
          } else {
            // Handle upsert result - it's always an array
            if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
              user = upsertResult[0]
              console.log('[Personality Generate] ✅ User created:', { id: user.id, email: user.email })
            } else {
              // If no data returned, try fetching once
              console.log('[Personality Generate] Upsert returned no data, fetching user...')
              const { data: fetchedUser, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name')
                .eq('id', userId)
                .maybeSingle()
              
              if (fetchedUser && !fetchError) {
                user = fetchedUser
                console.log('[Personality Generate] ✅ User found after fetch:', { id: user.id, email: user.email })
              } else {
                return NextResponse.json(
                  { 
                    success: false,
                    error: 'User was created but could not be retrieved. Please try again.',
                    details: fetchError?.message || 'Unknown error'
                  },
                  { status: 500 }
                )
              }
            }
          }
        }
      } catch (error: any) {
        console.error('[Personality Generate] Error creating user:', error)
        return NextResponse.json(
          { error: 'Failed to create user record', details: error.message },
          { status: 500 }
        )
      }
    } else {
      user = existingUser
    }

    console.log('[Personality Generate] Generating personality profile...')

    // Generate personality profile using OpenAI (optional - gracefully handle failures)
    let summary: string
    let embedding: number[]
    let traits: Record<string, any>
    
    try {
      const profile = await generatePersonalityProfile(
        questionnaireAnswers,
        interests,
        vibe || null,
        topic || null
      )
      summary = profile.summary
      embedding = profile.embedding
      traits = profile.traits
      console.log('[Personality Generate] ✅ Personality profile generated')
    } catch (gptError: any) {
      console.error('[Personality Generate] ⚠️ GPT generation failed (optional):', gptError.message)
      
      // Check if it's a model access error
      if (gptError.message?.includes('does not exist') || 
          gptError.message?.includes('not have access') ||
          gptError.message?.includes('model_not_found')) {
        return NextResponse.json({
          success: false,
          error: 'GPT-4 model is not available. Personality generation is optional and you can continue without it.',
          details: 'GPT access is not configured. You can complete onboarding and add personality matching later when GPT is available.'
        }, { status: 200 }) // Return 200 so frontend knows it's optional
      }
      
      // For other errors, still return gracefully
      return NextResponse.json({
        success: false,
        error: 'Failed to generate personality profile. This is optional and you can continue without it.',
        details: gptError.message || 'Unknown error'
      }, { status: 200 }) // Return 200 so frontend knows it's optional
    }

    // Update users table with personality data
    // Note: Supabase JS client handles vector conversion automatically when passing array
    const { error: updateError } = await supabase
      .from('users')
      .update({
        personality_summary: summary,
        personality_embedding: embedding, // Pass array directly - Supabase converts to vector
        traits: traits,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[Personality Generate] Error updating users table:', updateError)
      return NextResponse.json(
        { error: 'Failed to save personality profile', details: updateError.message },
        { status: 500 }
      )
    }

    // Store questionnaire responses
    const { error: responseError } = await supabase
      .from('onboarding_responses')
      .upsert({
        user_id: userId,
        responses: questionnaireAnswers,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (responseError) {
      console.error('[Personality Generate] Error saving questionnaire responses:', responseError)
      // Don't fail the request if responses can't be saved
    }

    console.log('[Personality Generate] ✅ Personality profile saved successfully')

    return NextResponse.json({
      success: true,
      personality_summary: summary,
      traits: traits,
    })
  } catch (error: any) {
    console.error('[Personality Generate] Error:', error)
    
    // Handle OpenAI API key errors
    if (error.message?.includes('OPENAI_API_KEY_INVALID') || 
        error.message?.includes('Invalid API key') ||
        error.message?.includes('invalid_api_key')) {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local and ensure it is correct. You can get a new key at https://platform.openai.com/api-keys',
          details: 'The API key may be expired, revoked, or incorrectly formatted.'
        },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('OPENAI_API_KEY') && error.message?.includes('not set')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file and restart your dev server.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate personality profile', details: error.message },
      { status: 500 }
    )
  }
}
