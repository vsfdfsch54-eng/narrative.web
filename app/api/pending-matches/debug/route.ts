export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// Debug endpoint to check matchmaking status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all pending matches
    const { data: pendingMatches, error: pendingError } = await supabase
      .from('pending_matches')
      .select('*')
      .order('created_at', { ascending: true })
    
    // Get recent chat matches
    const { data: chatMatches, error: chatError } = await supabase
      .from('chat_matches')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Check environment variables
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return NextResponse.json({
      success: true,
      pendingMatches: {
        data: pendingMatches || [],
        error: pendingError ? pendingError.message : null,
        count: pendingMatches?.length || 0,
        searching: pendingMatches?.filter(p => p.status === 'searching').length || 0,
        matched: pendingMatches?.filter(p => p.status === 'matched').length || 0,
      },
      chatMatches: {
        data: chatMatches || [],
        error: chatError ? chatError.message : null,
        count: chatMatches?.length || 0,
      },
      environment: {
        hasServiceKey,
        hasUrl,
        hasAnonKey,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

