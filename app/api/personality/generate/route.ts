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

        // Create user record using upsert to handle duplicate email/id
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
          .select('id, email, name')

        // Log upsert error details for debugging
        if (createError) {
          console.error('[Personality Generate] Upsert error details:', {
            message: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint
          })
        }

        // First, try to use the upsert result if available
        if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
          user = upsertResult[0]
          console.log('[Personality Generate] ✅ User from upsert result:', { id: user.id, email: user.email })
        } else {
          // If upsert didn't return data, try fetching with retry logic
          console.log('[Personality Generate] Upsert returned no data, fetching user with retry...')
          let fetchedUser = null
          
          // Retry up to 5 times with increasing delays
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))) // 100ms, 200ms, 300ms, 400ms, 500ms
            
            const { data: userData, error: fetchError } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', userId)
              .maybeSingle()

            if (fetchError) {
              console.error(`[Personality Generate] Fetch attempt ${attempt + 1} error:`, {
                message: fetchError.message,
                code: fetchError.code,
                details: fetchError.details
              })
              // Continue to next attempt
              continue
            }

            if (userData) {
              fetchedUser = userData
              console.log(`[Personality Generate] ✅ User found on attempt ${attempt + 1}`)
              break
            }
          }

          if (!fetchedUser) {
            console.error('[Personality Generate] User not found after upsert and all fetch attempts')
            console.error('[Personality Generate] Upsert result:', upsertResult)
            console.error('[Personality Generate] Upsert error:', createError)
            return NextResponse.json(
              { 
                error: 'Failed to create user record', 
                details: 'User was not created and could not be found after multiple attempts. Please try again.'
              },
              { status: 500 }
            )
          }

          user = fetchedUser
          console.log('[Personality Generate] ✅ User verified after retry:', { id: user.id, email: user.email })
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

    // Generate personality profile using OpenAI
    const { summary, embedding, traits } = await generatePersonalityProfile(
      questionnaireAnswers,
      interests,
      vibe || null,
      topic || null
    )

    console.log('[Personality Generate] ✅ Personality profile generated')

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
