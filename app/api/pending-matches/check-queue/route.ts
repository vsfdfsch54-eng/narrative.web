export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * DIAGNOSTIC ENDPOINT - Check what's in the queue
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all pending matches
    const { data: allPending, error: allError } = await supabase
      .from('pending_matches')
      .select('*')
      .order('created_at', { ascending: true })

    // Get searching users
    const { data: searching, error: searchError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'searching')
      .order('created_at', { ascending: true })

    // Get matched users
    const { data: matched, error: matchedError } = await supabase
      .from('pending_matches')
      .select('*')
      .eq('status', 'matched')
      .order('created_at', { ascending: true })

    return NextResponse.json({
      success: true,
      allPending: {
        count: allPending?.length || 0,
        data: allPending || [],
        error: allError?.message
      },
      searching: {
        count: searching?.length || 0,
        data: searching || [],
        error: searchError?.message
      },
      matched: {
        count: matched?.length || 0,
        data: matched || [],
        error: matchedError?.message
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

