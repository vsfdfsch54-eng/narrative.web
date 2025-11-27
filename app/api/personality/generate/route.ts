export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { generatePersonalityProfile } from '@/lib/ai/openai-service'

/**
 * POST /api/personality/generate
 * Generates AI personality profile from questionnaire answers, interests, and optional mood/topic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, questionnaireAnswers, interests, mood, topic } = body

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
      return NextResponse.json(
        { error: 'Database error', details: userCheckError.message },
        { status: 500 }
      )
    }

    if (!existingUser) {
      // User doesn't exist, try to create from auth
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authError || !authUser?.user?.email) {
          return NextResponse.json(
            { error: 'User not found. Please complete onboarding first.' },
            { status: 404 }
          )
        }

        const userEmail = authUser.user.email
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        
        // Check if a user with this email already exists
        const { data: existingUserByEmail } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('email', userEmail)
          .maybeSingle()
        
        if (existingUserByEmail) {
            user = existingUserByEmail
        } else {
          // Create new user
          const { data: upsertResult, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: userEmail,
              name: userName,
              interests: [],
              onboarding_step: 'personality',
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select('id, email, name')

          if (createError) {
            // If duplicate email error, try fetching by email
            if (createError.code === '23505' || createError.message.includes('duplicate key') || createError.message.includes('user_email_key')) {
              const { data: existingByEmail } = await supabase
                .from('users')
                .select('id, email, name')
                .eq('email', userEmail)
                .maybeSingle()
              
              if (existingByEmail) {
                user = existingByEmail
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
            if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
              user = upsertResult[0]
            } else {
              // If no data returned, try fetching once
              const { data: fetchedUser } = await supabase
                .from('users')
                .select('id, email, name')
                .eq('id', userId)
                .maybeSingle()
              
              if (fetchedUser) {
                user = fetchedUser
              } else {
                return NextResponse.json(
                  { 
                    success: false,
                    error: 'User was created but could not be retrieved. Please try again.',
                  },
                  { status: 500 }
                )
              }
            }
          }
        }
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Failed to create user record', details: error.message },
          { status: 500 }
        )
      }
    } else {
      user = existingUser
    }

    // Generate personality profile using OpenAI (optional - gracefully handle failures)
    let summary: string
    let embedding: number[]
    let traits: Record<string, any>
    
    try {
      const profile = await generatePersonalityProfile(
        questionnaireAnswers,
        interests,
        mood || null,
        topic || null
      )
      summary = profile.summary
      embedding = profile.embedding
      traits = profile.traits
    } catch (gptError: any) {
      // Check if it's a model access error
      if (gptError.message?.includes('does not exist') || 
          gptError.message?.includes('not have access') ||
          gptError.message?.includes('model_not_found')) {
        return NextResponse.json({
          success: false,
          error: 'GPT-4 model is not available. Personality generation is optional and you can continue without it.',
          details: 'GPT access is not configured. You can complete onboarding and add personality matching later when GPT is available.'
        }, { status: 200 })
      }
      
      // For other errors, still return gracefully
      return NextResponse.json({
        success: false,
        error: 'Failed to generate personality profile. This is optional and you can continue without it.',
        details: gptError.message || 'Unknown error'
      }, { status: 200 })
    }

    // Update users table with personality data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        personality_summary: summary,
        personality_embedding: embedding,
        traits: traits,
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save personality profile', details: updateError.message },
        { status: 500 }
      )
    }

    // Store questionnaire responses (non-blocking)
    await supabase
      .from('onboarding_responses')
      .upsert({
        user_id: userId,
        responses: questionnaireAnswers,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    return NextResponse.json({
      success: true,
      personality_summary: summary,
      traits: traits,
    })
  } catch (error: any) {
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
