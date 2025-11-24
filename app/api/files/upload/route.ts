export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseClient'

/**
 * POST /api/files/upload
 * Upload a file or image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const matchId = formData.get('matchId') as string
    const userId = formData.get('userId') as string

    if (!file || !matchId || !userId) {
      return NextResponse.json(
        { error: 'Missing file, matchId, or userId' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isFile = !isImage && file.type !== ''

    if (!isImage && !isFile) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${matchId}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[File Upload] Error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: isImage ? 'image' : 'file',
        mimeType: file.type,
      },
    })
  } catch (error: any) {
    console.error('[File Upload] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

