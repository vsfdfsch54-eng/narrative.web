export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from 'next/server'

/**
 * GET /api/test-openai
 * Test endpoint to verify OpenAI API key is loaded correctly
 */
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY is not set in environment variables',
        details: 'Make sure .env.local exists and contains OPENAI_API_KEY=sk-...',
      }, { status: 500 })
    }
    
    // Check key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY format is invalid',
        details: `Key should start with "sk-" but starts with "${apiKey.substring(0, 5)}..."`,
        keyLength: apiKey.length,
      }, { status: 500 })
    }
    
    // Test the key by making a simple API call
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key is invalid or expired',
        details: `OpenAI returned ${testResponse.status}: ${errorText}`,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 10) + '...',
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API key is valid and working!',
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error testing OpenAI API key',
      details: error.message,
    }, { status: 500 })
  }
}

