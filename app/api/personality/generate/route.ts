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
        const { data: newUser, error: createError } = await supabase
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
          .single()

        if (createError) {
          // Handle duplicate email error gracefully
          if (createError.message.includes('duplicate key') || 
              createError.message.includes('unique constraint') || 
              createError.code === '23505') {
            // User already exists, fetch it instead
            console.log('[Personality Generate] User already exists, fetching...')
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', userId)
              .single()
            
            if (fetchError || !existingUser) {
              console.error('[Personality Generate] Failed to fetch existing user:', fetchError)
              return NextResponse.json(
                { error: 'Failed to create/fetch user record', details: fetchError?.message || createError.message },
                { status: 500 }
              )
            }
            
            user = existingUser
            console.log('[Personality Generate] ✅ User already exists, using existing record')
          } else {
            console.error('[Personality Generate] Failed to create user:', createError)
            return NextResponse.json(
              { error: 'Failed to create user record', details: createError.message },
              { status: 500 }
            )
          }
        } else if (newUser) {
          user = newUser
          console.log('[Personality Generate] ✅ User auto-created from auth')
        } else {
          console.error('[Personality Generate] No user returned from upsert')
          return NextResponse.json(
            { error: 'Failed to create user record - no data returned' },
            { status: 500 }
          )
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
