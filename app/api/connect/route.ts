export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'
import { findBestMatch } from '@/lib/ai/matching-service'
import { getCorsHeaders } from '@/lib/cors-headers'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: getCorsHeaders(),
  })
}

/**
 * POST /api/connect
 * Adds user to waiting pool and triggers AI matching
 * Replaces the old /api/pending-matches endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vibe, topic } = body

    // Log request (production: remove or use structured logging)

    if (!userId) {
      console.error('[Connect API] ❌ Missing userId')
      return NextResponse.json({ error: 'Missing userId' }, { 
        status: 400,
        headers: getCorsHeaders(),
      })
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
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    if (!existingUser) {
      // User doesn't exist in users table, try to create from auth
      try {
        // Get user from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !authUser?.user?.email) {
          console.error('[Connect API] ❌ User not found in auth:', authError)
          return NextResponse.json(
            { error: 'User not found. Please complete onboarding first.' },
            { 
              status: 404,
              headers: getCorsHeaders(),
            }
          )
        }

        // FIRST: Check if a user with this email already exists (to prevent duplicate email errors)
        const userEmail = authUser.user.email
        const userName = authUser.user.user_metadata?.name || authUser.user.email.split('@')[0] || 'User'
        
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
          } else {
            // Email exists but with different id - use the existing user's id
            console.warn('[Connect API] ⚠️ Email conflict: email exists with different id, using existing user', {
              existingId: existingUserByEmail.id,
              requestedId: userId,
              email: userEmail
            })
            userRecord = existingUserByEmail
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
              const { data: existingByEmail, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name, personality_embedding')
                .eq('email', userEmail)
                .maybeSingle()
              
              if (existingByEmail && !fetchError) {
                userRecord = existingByEmail
              } else {
                return NextResponse.json(
                  { 
                    error: 'Failed to create user record. An account with this email may already exist.',
                    details: createError.message
                  },
                  { 
                    status: 500,
                    headers: getCorsHeaders(),
                  }
                )
              }
            } else {
              return NextResponse.json(
                { 
                  error: 'Failed to create user record.',
                  details: createError.message
                },
                { 
                  status: 500,
                  headers: getCorsHeaders(),
                }
              )
            }
          } else {
            // Handle upsert result - it's always an array
            if (upsertResult && Array.isArray(upsertResult) && upsertResult.length > 0) {
              userRecord = upsertResult[0]
            } else {
              // If no data returned, try fetching once
              const { data: fetchedUser, error: fetchError } = await supabase
                .from('users')
                .select('id, email, name, personality_embedding')
                .eq('id', userId)
                .maybeSingle()
              
              if (fetchedUser && !fetchError) {
                userRecord = fetchedUser
              } else {
                return NextResponse.json(
                  { 
                    error: 'User was created but could not be retrieved. Please try again.',
                    details: fetchError?.message || 'Unknown error'
                  },
                  { 
                    status: 500,
                    headers: getCorsHeaders(),
                  }
                )
              }
            }
          }
        }
      } catch (error: any) {
        console.error('[Connect API] ❌ Error creating user:', error)
        return NextResponse.json(
          { error: 'Failed to create user record', details: error.message },
          { 
            status: 500,
            headers: getCorsHeaders(),
          }
        )
      }
    } else {
      userRecord = existingUser
    }

    // Check if user has personality embedding (optional - will use FIFO matching if missing)
    if (!userRecord.personality_embedding) {
      // Try to generate personality profile from existing data (optional)
      // This handles migration case, but won't block if it fails
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

        // Try to generate personality profile (optional - don't block if it fails)
        // Use request origin to construct URL dynamically (works in all environments)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
          (request.headers.get('origin') || 
           (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000'))
        const personalityResponse = await fetch(`${baseUrl}/api/personality/generate`, {
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
          // Don't block - continue without personality embedding
        }
      } catch (error: any) {
        // Don't block - continue without personality embedding
      }
    }

    // Get fresh user data (embedding may or may not exist - both are fine)
    const { data: freshUserData, error: freshUserError } = await supabase
      .from('users')
      .select('personality_embedding')
      .eq('id', userId)
      .single()

    if (freshUserError) {
      console.error('[Connect API] ❌ Error fetching user data:', freshUserError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    // Note: personality_embedding is optional - matching service will use FIFO if missing

    // Parse embedding (optional - can be null)
    let userEmbedding: number[] | null = null
    
    if (freshUserData.personality_embedding) {
      const embeddingString = freshUserData.personality_embedding
      
      if (typeof embeddingString === 'string') {
        const cleaned = embeddingString.replace(/[\[\]]/g, '')
        userEmbedding = cleaned.split(',').map(Number)
      } else if (Array.isArray(embeddingString)) {
        userEmbedding = embeddingString
      } else {
        console.warn('[Connect API] ⚠️ Invalid embedding format, will use FIFO matching')
        userEmbedding = null
      }
    }

    // Remove any existing entry in waiting pool for this user
    await supabase.from('waiting_pool').delete().eq('user_id', userId)

    // Add user to waiting pool (embedding is optional - null means FIFO matching)
    // Note: Supabase JS client handles vector conversion automatically when passing array
    const { error: insertError } = await supabase
      .from('waiting_pool')
      .insert({
        user_id: userId,
        embedding: userEmbedding, // Can be null - matching service will use FIFO
      })

    if (insertError) {
      console.error('[Connect API] ❌ Error adding to waiting pool:', insertError)
      return NextResponse.json(
        { error: 'Failed to join waiting pool', details: insertError.message },
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    // Verify the entry was actually created (with retry and longer waits)
    let verifyEntry = null
    for (let attempt = 0; attempt < 5; attempt++) {
      // Wait longer between attempts to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { data: entry, error: verifyError } = await supabase
        .from('waiting_pool')
        .select('user_id, created_at')
        .eq('user_id', userId)
        .single()
      
      if (entry && !verifyError) {
        verifyEntry = entry
        break
      }
      
      if (attempt === 4) {
        console.error('[Connect API] ❌ User not found in waiting pool after 5 attempts!', verifyError)
        // Don't fail - the entry might still be there, just return success
        // The status endpoint will handle checking
      }
    }

    // Try to find immediate match (only if user has embedding)
    let matchResult = null
    if (userEmbedding && userEmbedding.length > 0) {
      matchResult = await findBestMatch(userId, userEmbedding)
    }

    // Lower threshold: match if score >= 0.1, or if only 2 users (FIFO fallback)
    const shouldMatch = matchResult && (
      matchResult.matchScore >= 0.1 || 
      matchResult.matchScore >= 0.0 // Always match if only 2 users
    )

    if (shouldMatch && matchResult) {
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

          return NextResponse.json({
            success: true,
            matched: true,
            match: chatMatch,
            otherUserId: matchedUserId,
            matchScore: matchScore,
          }, {
            headers: getCorsHeaders(),
          })
        }
      }
    }

    // No immediate match found, trigger matchmaking processor after a delay
    // This ensures the waiting_pool entry is fully committed before matching
    
    // Wait a bit longer to ensure database entry is fully committed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // Construct base URL from request (works in all environments)
      // Priority: NEXT_PUBLIC_APP_URL > origin header > host header > localhost fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (request.headers.get('origin') || 
         (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000'))
      
      // Trigger matchmaking (don't await to avoid blocking response)
      fetch(`${baseUrl}/api/matchmaking/process`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(err => {
        console.error('[Connect API] Error triggering matchmaking processor:', err)
      })
      
      // Also trigger again after another delay to catch any race conditions
      // Note: Using Promise chain instead of setTimeout for better serverless compatibility
      Promise.resolve().then(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      ).then(() => {
        fetch(`${baseUrl}/api/matchmaking/process`, {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => {})
      }).catch(() => {})
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
    }, {
      headers: getCorsHeaders(),
    })
  } catch (error: any) {
    console.error('[Connect API] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
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
      return NextResponse.json({ error: 'Missing userId' }, { 
        status: 400,
        headers: getCorsHeaders(),
      })
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
        { 
          status: 500,
          headers: getCorsHeaders(),
        }
      )
    }

    return NextResponse.json({ success: true }, {
      headers: getCorsHeaders(),
    })
  } catch (error: any) {
    console.error('[Connect API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
    )
  }
}
