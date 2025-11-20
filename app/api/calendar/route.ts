import { NextRequest, NextResponse } from 'next/server'
import { createCalendarEvent, getEventsForMonth } from '@/lib/supabase-helpers'

// Force dynamic rendering - must be at top level
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, day, title, location, timeSlot, groupType } = body

    if (!userId || !day || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, day, or title' },
        { status: 400 }
      )
    }

    const result = await createCalendarEvent(
      userId,
      day,
      title,
      location,
      timeSlot,
      groupType
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in POST /api/calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Access searchParams outside try/catch to ensure Next.js recognizes dynamic usage
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!userId || !year || !month) {
    return NextResponse.json(
      { error: 'Missing userId, year, or month query parameters' },
      { status: 400 }
    )
  }

  try {

    const result = await getEventsForMonth(
      userId,
      parseInt(year),
      parseInt(month)
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in GET /api/calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

