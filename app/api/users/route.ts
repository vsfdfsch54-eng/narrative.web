import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

// Force dynamic rendering - must be at top level
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name } = body

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'User ID and name required' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // If user doesn't exist, get email from auth
    let email: string | null = null
    if (!existingUser) {
      // Get user email from Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (authError || !authUser?.user?.email) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found in auth or email missing' 
        }, { status: 400 })
      }
      email = authUser.user.email
    } else {
      email = existingUser.email
    }

    // Now upsert with email
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

