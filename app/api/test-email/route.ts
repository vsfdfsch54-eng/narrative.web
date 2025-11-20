export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * Test endpoint to check Supabase email configuration
 * Call this from browser console: fetch('/api/test-email').then(r => r.json()).then(console.log)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check if we can access auth settings
    // Note: This requires service role key
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    return NextResponse.json({
      success: true,
      message: "Supabase connection working",
      userCount: users?.length || 0,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      note: "Check Supabase Dashboard → Authentication → Email Templates to verify email is enabled"
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: "This endpoint requires SUPABASE_SERVICE_ROLE_KEY to be set"
    }, { status: 500 })
  }
}

