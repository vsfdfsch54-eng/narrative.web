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

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[Personality Generate] User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
    
    // Handle OpenAI API errors
    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate personality profile', details: error.message },
      { status: 500 }
    )
  }
}
