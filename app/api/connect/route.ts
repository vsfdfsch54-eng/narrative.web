export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { findBestMatch } from '@/lib/ai/matching-service'

/**
 * POST /api/connect
 * Adds user to waiting pool and triggers AI matching
 * Replaces the old /api/pending-matches endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic } = body

    console.log('[Connect API] ==========================================')
    console.log('[Connect API] Received request:', { userId, vibe, topic })

    if (!userId) {
      console.error('[Connect API] ❌ Missing userId')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify user exists, or create if they exist in auth but not in users table
    let userRecord = null
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, name, personality_embedding')
      .eq('id', userId)
      .maybeSingle()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('[Connect API] Error checking user:', userCheckError)
      return NextResponse.json(
        { error: 'Database error', details: userCheckError.message },
        { status: 500 }
      )
    }

    if (!existingUser) {
      // User doesn't exist in users table, try to create from auth
      console.log('[Connect API] ⚠️  User not found in users table, creating from auth...')
      
      try {
        // Get user from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !authUser?.user?.email) {
          console.error('[Connect API] ❌ User not found in auth:', authError)
          return NextResponse.json(
            { error: 'User not found. Please complete onboarding first.' },
            { status: 404 }
          )
        }

        // FIRST: Check if a user with this email already exists (to prevent duplicate email errors)
        const userEmail = authUser.user.email
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        
        console.log('[Connect API] Checking for existing user by email...')
        const { data: existingUserByEmail, error: emailCheckError } = await supabase
          .from('users')
          .select('id, email, name, personality_embedding')
          .eq('email', userEmail)
          .maybeSingle()
        
        if (existingUserByEmail) {
          // User with this email already exists
          if (existingUserByEmail.id === userId) {
            // Same user, same email - use existing record
            userRecord = existingUserByEmail
            console.log('[Connect API] ✅ Found existing user (id and email match):', { id: userRecord.id, email: userRecord.email })
          } else {
            // Email exists but with different id - use the existing user's id
            console.warn('[Connect API] ⚠️ Email conflict: email exists with different id, using existing user', {
              existingId: existingUserByEmail.id,
              requestedId: userId,
              email: userEmail
            })
            userRecord = existingUserByEmail
            console.log('[Connect API] ✅ Using existing user by email:', { id: userRecord.id, email: userRecord.email })
          }
        } else {
          // No user with this email exists - safe to create new user
          console.log('[Connect API] No existing user with this email, creating new user...')
          
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
            .select('id, email, name, personality_embedding')

          if (createError) {
            console.error('[Connect API] ❌ Upsert error:', {
              message: createError.message,
              code: createError.code,
              details: createError.details
            })
            
            // If duplicate email error, check by email (in case email was created between our check and upsert)
            if (createError.code === '23505' || createError.message.includes('duplicate key') || createError.message.includes('user_email_key')) {
              console.log('[Connect API] Duplicate email error, fetching existing user by email...')
              const { data: existingByEmail, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name, personality_embedding')
                .eq('email', userEmail)
                .maybeSingle()
              
              if (existingByEmail && !fetchError) {
                userRecord = existingByEmail
                console.log('[Connect API] ✅ Found existing user by email after error:', { id: userRecord.id, email: userRecord.email })
              } else {
                return NextResponse.json(
                  { 
                    error: 'Failed to create user record. An account with this email may already exist.',
                    details: createError.message
                  },
                  { status: 500 }
                )
              }
            } else {
              return NextResponse.json(
                { 
                  error: 'Failed to create user record.',
                  details: createError.message
                },
                { status: 500 }
              )
            }
          } else {
            // Handle upsert result - it's always an array
            if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
              userRecord = upsertResult[0]
              console.log('[Connect API] ✅ User created:', { id: userRecord.id, email: userRecord.email })
            } else {
              // If no data returned, try fetching once
              console.log('[Connect API] Upsert returned no data, fetching user...')
              const { data: fetchedUser, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name, personality_embedding')
                .eq('id', userId)
                .maybeSingle()
              
              if (fetchedUser && !fetchError) {
                userRecord = fetchedUser
                console.log('[Connect API] ✅ User found after fetch:', { id: userRecord.id, email: userRecord.email })
              } else {
                return NextResponse.json(
                  { 
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
        console.error('[Connect API] ❌ Error creating user:', error)
        return NextResponse.json(
          { error: 'Failed to create user record', details: error.message },
          { status: 500 }
        )
      }
    } else {
      userRecord = existingUser
      console.log('[Connect API] ✅ User verified:', { id: userRecord.id, email: userRecord.email })
    }

    // Check if user has personality embedding
    if (!userRecord.personality_embedding) {
      console.log('[Connect API] ⚠️  User has no personality embedding, generating...')
      
      // Try to generate personality profile from existing data
      // This handles migration case
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('interests')
          .eq('id', userId)
          .single()

        const interests = (userData?.interests as string[]) || []

        // Get vibe history if available
        const { data: vibes } = await supabase
          .from('vibes')
          .select('vibe')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Create minimal questionnaire from existing data
        const questionnaireAnswers = {
          inferred_from: 'existing_profile',
          interests: interests.join(', '),
          has_vibe_history: !!vibes?.vibe,
          last_vibe: vibes?.vibe || null,
        }

        // Generate personality profile
        const personalityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/personality/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            questionnaireAnswers,
            interests,
            vibe: vibes?.vibe || null,
            topic: null,
          }),
        })

        const personalityData = await personalityResponse.json()

        if (!personalityData.success) {
          console.error('[Connect API] ❌ Failed to generate personality profile:', personalityData.error)
          return NextResponse.json(
            { error: 'Personality profile required. Please complete onboarding first.' },
            { status: 400 }
          )
        }

        console.log('[Connect API] ✅ Personality profile generated')
      } catch (error: any) {
        console.error('[Connect API] ❌ Error generating personality profile:', error)
        return NextResponse.json(
          { error: 'Personality profile required. Please complete onboarding first.' },
          { status: 400 }
        )
      }
    }

    // Get fresh user data with embedding
    const { data: freshUserData, error: freshUserError } = await supabase
      .from('users')
      .select('personality_embedding')
      .eq('id', userId)
      .single()

    if (freshUserError || !freshUserData?.personality_embedding) {
      console.error('[Connect API] ❌ User still has no embedding after generation attempt')
      return NextResponse.json(
        { error: 'Failed to generate personality profile' },
        { status: 500 }
      )
    }

    // Parse embedding
    const embeddingString = freshUserData.personality_embedding
    let userEmbedding: number[]
    
    if (typeof embeddingString === 'string') {
      const cleaned = embeddingString.replace(/[\[\]]/g, '')
      userEmbedding = cleaned.split(',').map(Number)
    } else if (Array.isArray(embeddingString)) {
      userEmbedding = embeddingString
    } else {
      console.error('[Connect API] ❌ Invalid embedding format')
      return NextResponse.json(
        { error: 'Invalid personality embedding format' },
        { status: 500 }
      )
    }

    // Remove any existing entry in waiting pool for this user
    await supabase.from('waiting_pool').delete().eq('user_id', userId)

    // Add user to waiting pool with embedding
    // Note: Supabase JS client handles vector conversion automatically when passing array
    const { error: insertError } = await supabase
      .from('waiting_pool')
      .insert({
        user_id: userId,
        embedding: userEmbedding, // Pass array directly - Supabase converts to vector
      })

    if (insertError) {
      console.error('[Connect API] ❌ Error adding to waiting pool:', insertError)
      return NextResponse.json(
        { error: 'Failed to join waiting pool', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[Connect API] ✅ User added to waiting pool')

    // Verify the entry was actually created (with retry)
    let verifyEntry = null
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const { data: entry, error: verifyError } = await supabase
        .from('waiting_pool')
        .select('user_id, created_at')
        .eq('user_id', userId)
        .single()
      
      if (entry && !verifyError) {
        verifyEntry = entry
        console.log('[Connect API] ✅ Verified user is in waiting pool', { 
          userId, 
          created_at: entry.created_at 
        })
        break
      }
      
      if (attempt === 2) {
        console.error('[Connect API] ❌ User not found in waiting pool after 3 attempts!', verifyError)
        return NextResponse.json(
          { error: 'Failed to join waiting pool - entry not found after verification' },
          { status: 500 }
        )
      }
    }

    // Try to find immediate match
    const matchResult = await findBestMatch(userId, userEmbedding)

    // Lower threshold: match if score >= 0.1, or if only 2 users (FIFO fallback)
    const shouldMatch = matchResult && (
      matchResult.matchScore >= 0.1 || 
      matchResult.matchScore >= 0.0 // Always match if only 2 users
    )

    if (shouldMatch) {
      // Found a good match! Create chat match
      const matchedUserId = matchResult.userId
      const matchScore = matchResult.matchScore
      const traitsUsed = matchResult.traitsUsed

      // Determine user1_id and user2_id (alphabetical order)
      const user1Id = userId < matchedUserId ? userId : matchedUserId
      const user2Id = userId < matchedUserId ? matchedUserId : userId

      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('chat_matches')
        .select('id')
        .eq('user1_id', user1Id)
        .eq('user2_id', user2Id)
        .single()

      if (!existingMatch) {
        // Create chat match
        const { data: chatMatch, error: matchError } = await supabase
          .from('chat_matches')
          .insert({
            user1_id: user1Id,
            user2_id: user2Id,
            status: 'active',
            match_score: matchScore,
            traits_used: traitsUsed,
            user1_vibe: vibe || null,
            user1_topic: topic || null,
            user2_vibe: null, // Will be set when other user connects
            user2_topic: null,
          })
          .select()
          .single()

        if (matchError) {
          console.error('[Connect API] ❌ Error creating chat match:', matchError)
        } else {
          // Remove both users from waiting pool
          await supabase.from('waiting_pool').delete().eq('user_id', userId)
          await supabase.from('waiting_pool').delete().eq('user_id', matchedUserId)

          console.log('[Connect API] ✅ Immediate match created!', {
            matchId: chatMatch.id,
            user1Id,
            user2Id,
            matchScore,
          })

          return NextResponse.json({
            success: true,
            matched: true,
            match: chatMatch,
            otherUserId: matchedUserId,
            matchScore: matchScore,
          })
        }
      }
    }

    // No immediate match found, trigger matchmaking processor after a delay
    // This ensures the waiting_pool entry is fully committed before matching
    console.log('[Connect API] ⏳ No immediate match, will trigger matchmaking processor...')
    
    // Wait a bit longer to ensure database entry is fully committed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (request.headers.get('origin') || 'http://localhost:3000')
      
      // Trigger matchmaking (don't await to avoid blocking response)
      fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(err => {
        console.error('[Connect API] Error triggering matchmaking processor:', err)
      })
      
      // Also trigger again after another delay to catch any race conditions
      setTimeout(() => {
        fetch(`${baseUrl}/api/matchmaking/process`, {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => {})
      }, 1000)
    } catch (err) {
      console.error('[Connect API] Error triggering matchmaking processor:', err)
      // Continue anyway
    }

    // Return queue status
    return NextResponse.json({
      success: true,
      matched: false,
      inQueue: true,
      message: 'Added to waiting pool. AI is finding your match...',
    })
  } catch (error: any) {
    console.error('[Connect API] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/connect
 * Removes user from waiting pool
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('waiting_pool')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('[Connect API] Error removing from waiting pool:', error)
      return NextResponse.json(
        { error: 'Failed to remove from waiting pool' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Connect API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
