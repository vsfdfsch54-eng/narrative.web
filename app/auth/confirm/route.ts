export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/topic-match'

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url))
  }

  const supabase = createServerClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    type: type as any,
    token_hash,
  })

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url))
  }

  if (data.user?.email_confirmed_at) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/verify', request.url))
}

