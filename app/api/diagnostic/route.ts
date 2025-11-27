import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Diagnostic endpoint to check API keys and database state
 * Usage: GET /api/diagnostic?userId=YOUR_USER_ID
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    supabaseClient: {
      canCreate: false,
      error: null as string | null,
    },
    database: {
      canQuery: false,
      error: null as string | null,
    },
    auth: {
      canUseAdmin: false,
      error: null as string | null,
    },
    userRecord: null as any,
  }

  // Test 1: Can we create Supabase client?
  try {
    const supabase = createServerClient()
    diagnostics.supabaseClient.canCreate = true
    
    // Test 2: Can we query database?
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        diagnostics.database.error = error.message
      } else {
        diagnostics.database.canQuery = true
      }
    } catch (dbError: any) {
      diagnostics.database.error = dbError.message
    }

    // Test 3: Can we use auth.admin API?
    if (userId) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError) {
          diagnostics.auth.error = authError.message
        } else {
          diagnostics.auth.canUseAdmin = true
          diagnostics.auth.userEmail = authData?.user?.email
        }
      } catch (authErr: any) {
        diagnostics.auth.error = authErr.message
      }

      // Test 4: Get user record from database
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        
        if (userError) {
          diagnostics.userRecord = { error: userError.message }
        } else if (userData) {
          diagnostics.userRecord = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            onboarding_step: userData.onboarding_step,
            onboarding_completed: userData.onboarding_completed,
            first_name: userData.first_name,
            last_name: userData.last_name,
            hasInterests: !!userData.interests,
            interestsCount: userData.interests?.length || 0,
            hasQuestions: !!userData.questions_answers,
          }
        } else {
          diagnostics.userRecord = { exists: false }
        }
      } catch (userErr: any) {
        diagnostics.userRecord = { error: userErr.message }
      }
    }

  } catch (clientError: any) {
    diagnostics.supabaseClient.error = clientError.message
  }

  return NextResponse.json({
    success: true,
    diagnostics,
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

