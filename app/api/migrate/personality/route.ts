export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { generatePersonalityProfile } from '@/lib/ai/openai-service'

/**
 * POST /api/migrate/personality
 * Generates personality profiles for existing users who don't have one
 * Can be run manually or scheduled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limit = 10, dryRun = false } = body // Process 10 users at a time by default

    console.log('[Personality Migration] Starting migration...', { limit, dryRun })

    const supabase = createServerClient()

    // Find users without personality_embedding
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, interests')
      .is('personality_embedding', null)
      .limit(limit)

    if (fetchError) {
      console.error('[Personality Migration] Error fetching users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need migration',
        processed: 0,
      })
    }

    console.log(`[Personality Migration] Found ${users.length} users to migrate`)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: 'Dry run - no changes made',
        usersFound: users.length,
        userIds: users.map(u => u.id),
      })
    }

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of users) {
      try {
        console.log(`[Personality Migration] Processing user ${user.id} (${user.email})`)

        // Get user's interests (if any)
        const interests = (user.interests as string[]) || []

        // Get user's vibe history (if any)
        const { data: vibes } = await supabase
          .from('vibes')
          .select('vibe')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const lastVibe = vibes?.vibe || null

        // Create questionnaire answers from existing data
        // Since we don't have original questionnaire, infer from available data
        const questionnaireAnswers = {
          inferred_from: 'existing_profile',
          interests: interests.join(', '),
          has_mood: !!lastMood,
          last_mood: lastMood,
          profile_completeness: interests.length > 0 ? 'partial' : 'minimal',
        }

        // Generate personality profile
        const { summary, embedding, traits } = await generatePersonalityProfile(
          questionnaireAnswers,
          interests,
          lastMood,
          null // No topic available
        )

        // Update user
        // Note: Supabase JS client handles vector conversion automatically when passing array
        const { error: updateError } = await supabase
          .from('users')
          .update({
            personality_summary: summary,
            personality_embedding: embedding, // Pass array directly - Supabase converts to vector
            traits: traits,
          })
          .eq('id', user.id)

        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`)
        }

        results.succeeded++
        console.log(`[Personality Migration] ✅ Successfully migrated user ${user.id}`)

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        results.failed++
        const errorMsg = `User ${user.id}: ${error.message}`
        results.errors.push(errorMsg)
        console.error(`[Personality Migration] ❌ Error processing user ${user.id}:`, error)
      }

      results.processed++
    }

    console.log('[Personality Migration] ✅ Migration complete', results)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.processed} users: ${results.succeeded} succeeded, ${results.failed} failed`,
    })
  } catch (error: any) {
    console.error('[Personality Migration] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
