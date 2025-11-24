/**
 * OpenAI Service
 * Handles all OpenAI API interactions for personality generation and embeddings
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file and restart your dev server.')
  }
  
  // Validate key format
  if (!apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY format is invalid. OpenAI API keys should start with "sk-".')
  }
  
  return new OpenAI({
    apiKey: apiKey,
  })
}

/**
 * Generate personality embedding from text using OpenAI
 * Uses text-embedding-3-large model (1536 dimensions)
 */
export async function generatePersonalityEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient()
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI')
    }
    
    return response.data[0].embedding
  } catch (error: any) {
    // Check for invalid API key
    if (error.status === 401 || 
        error.message?.includes('Invalid API key') || 
        error.message?.includes('Incorrect API key') ||
        error.message?.includes('invalid_api_key')) {
      throw new Error('OPENAI_API_KEY_INVALID: Your OpenAI API key is invalid. Please check your .env.local file and ensure the key is correct.')
    }
    
    // Retry logic for rate limits
    if (error.status === 429 || error.message?.includes('rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return generatePersonalityEmbedding(text)
    }
    
    throw new Error(`Failed to generate embedding: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Generate personality summary from questionnaire answers, interests, and optional vibe/topic
 * Uses GPT-4 to create a comprehensive personality description
 */
export async function generatePersonalitySummary(
  questionnaireAnswers: Record<string, any>,
  interests: string[],
  vibe?: string | null,
  topic?: string | null
): Promise<string> {
  try {
    const openai = getOpenAIClient()
    
    // Build prompt from questionnaire answers
    const questionnaireText = Object.entries(questionnaireAnswers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    
    const interestsText = interests.length > 0 
      ? `Interests: ${interests.join(', ')}`
      : ''
    
    const vibeText = vibe ? `Current vibe/mood: ${vibe}` : ''
    const topicText = topic ? `Current topic interest: ${topic}` : ''
    
    const prompt = `You are a personality psychologist analyzing a user's profile. Based on the following information, generate a comprehensive personality summary (2-3 paragraphs) that captures:

1. Communication style and preferences
2. Social energy level and interaction patterns
3. Core values and what matters to them
4. Emotional expression style
5. Social intentions and goals
6. How they approach conversations and relationships

Questionnaire Answers:
${questionnaireText}

${interestsText}
${vibeText}
${topicText}

Generate a detailed personality summary that would be useful for matching them with compatible conversation partners. Be specific and insightful, focusing on traits that affect social compatibility.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert personality psychologist who creates detailed, accurate personality profiles for social matching purposes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })
    
    const summary = response.choices[0]?.message?.content
    
    if (!summary) {
      throw new Error('No summary returned from OpenAI')
    }
    
    return summary.trim()
  } catch (error: any) {
    // Check for invalid API key
    if (error.status === 401 || 
        error.message?.includes('Invalid API key') || 
        error.message?.includes('Incorrect API key') ||
        error.message?.includes('invalid_api_key')) {
      throw new Error('OPENAI_API_KEY_INVALID: Your OpenAI API key is invalid. Please check your .env.local file and ensure the key is correct.')
    }
    
    // Retry logic for rate limits
    if (error.status === 429 || error.message?.includes('rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return generatePersonalitySummary(questionnaireAnswers, interests, vibe, topic)
    }
    
    throw new Error(`Failed to generate personality summary: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Extract structured personality traits from summary
 * Uses GPT-4 to parse personality summary into structured JSON format
 */
export async function extractPersonalityTraits(summary: string): Promise<Record<string, any>> {
  try {
    const openai = getOpenAIClient()
    
    const prompt = `Extract structured personality traits from this personality summary. Return a JSON object with the following structure:

{
  "bigFive": {
    "openness": 0.0-1.0,
    "conscientiousness": 0.0-1.0,
    "extraversion": 0.0-1.0,
    "agreeableness": 0.0-1.0,
    "neuroticism": 0.0-1.0
  },
  "communicationStyle": "direct" | "indirect" | "balanced",
  "socialEnergy": "introvert" | "extrovert" | "ambivert",
  "conversationDepth": "deep" | "light" | "balanced",
  "emotionalOpenness": "open" | "reserved" | "balanced",
  "socialIntention": ["venting", "learning", "humor", "connection"] (array of applicable)
}

Personality Summary:
${summary}

Return ONLY valid JSON, no other text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction expert. Always return valid JSON only, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })
    
    const traitsJson = response.choices[0]?.message?.content
    
    if (!traitsJson) {
      throw new Error('No traits returned from OpenAI')
    }
    
    const traits = JSON.parse(traitsJson)
    return traits
  } catch (error: any) {
    // Check for invalid API key
    if (error.status === 401 || 
        error.message?.includes('Invalid API key') || 
        error.message?.includes('Incorrect API key') ||
        error.message?.includes('invalid_api_key')) {
      throw new Error('OPENAI_API_KEY_INVALID: Your OpenAI API key is invalid. Please check your .env.local file and ensure the key is correct.')
    }
    
    // Retry logic for rate limits
    if (error.status === 429 || error.message?.includes('rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return extractPersonalityTraits(summary)
    }
    
    // Fallback to basic structure if extraction fails
    return {
      bigFive: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      communicationStyle: 'balanced',
      socialEnergy: 'ambivert',
      conversationDepth: 'balanced',
      emotionalOpenness: 'balanced',
      socialIntention: ['connection'],
    }
  }
}

/**
 * Generate complete personality profile (summary + embedding + traits)
 * This is the main function used by the personality generation API
 */
export async function generatePersonalityProfile(
  questionnaireAnswers: Record<string, any>,
  interests: string[],
  vibe?: string | null,
  topic?: string | null
): Promise<{
  summary: string
  embedding: number[]
  traits: Record<string, any>
}> {
  // Step 1: Generate personality summary
  const summary = await generatePersonalitySummary(questionnaireAnswers, interests, vibe, topic)
  
  // Step 2: Generate embedding from summary
  const embedding = await generatePersonalityEmbedding(summary)
  
  // Step 3: Extract structured traits
  const traits = await extractPersonalityTraits(summary)
  
  return {
    summary,
    embedding,
    traits,
  }
}
