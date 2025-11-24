/**
 * AI Matching Service
 * Handles personality-based matching using pgvector cosine similarity
 */

import { createServerClient } from '@/lib/supabaseClient'

export interface MatchResult {
  userId: string
  matchScore: number
  traitsUsed: Record<string, any>
}

export interface WaitingUser {
  id: string
  user_id: string
  embedding: number[] | string // Can be array or string (from database)
  created_at: string
}

/**
 * Get all users in waiting pool (excluding the current user)
 */
export async function getWaitingPoolUsers(excludeUserId: string): Promise<WaitingUser[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('waiting_pool')
    .select('id, user_id, embedding, created_at')
    .neq('user_id', excludeUserId)
  
  if (error) {
    console.error('[Matching Service] Error fetching waiting pool:', error)
    throw new Error(`Failed to fetch waiting pool: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // Convert embedding from string/array format to number array
  return data.map(user => ({
    id: user.id,
    user_id: user.user_id,
    embedding: Array.isArray(user.embedding) 
      ? user.embedding 
      : typeof user.embedding === 'string' 
        ? JSON.parse(user.embedding)
        : [],
    created_at: user.created_at,
  }))
}

/**
 * Calculate compatibility score between two users
 * Combines embedding similarity with trait complementarity
 */
export function calculateCompatibilityScore(
  embedding1: number[],
  embedding2: number[],
  traits1: Record<string, any> | null,
  traits2: Record<string, any> | null
): number {
  // Base score from embedding similarity (cosine similarity)
  // pgvector uses 1 - cosine_distance, so higher = more similar
  // We'll calculate this in SQL, but for reference:
  const embeddingSimilarity = calculateCosineSimilarity(embedding1, embedding2)
  
  // Trait complementarity bonus (0.0 to 0.2)
  let traitBonus = 0.0
  
  if (traits1 && traits2) {
    // Complementary traits get bonus
    const socialEnergy1 = traits1.socialEnergy || 'ambivert'
    const socialEnergy2 = traits2.socialEnergy || 'ambivert'
    
    // Introvert + Extrovert can be complementary
    if ((socialEnergy1 === 'introvert' && socialEnergy2 === 'extrovert') ||
        (socialEnergy1 === 'extrovert' && socialEnergy2 === 'introvert')) {
      traitBonus += 0.1
    }
    
    // Similar communication styles get bonus
    const commStyle1 = traits1.communicationStyle || 'balanced'
    const commStyle2 = traits2.communicationStyle || 'balanced'
    if (commStyle1 === commStyle2) {
      traitBonus += 0.05
    }
    
    // Complementary conversation depth preferences
    const depth1 = traits1.conversationDepth || 'balanced'
    const depth2 = traits2.conversationDepth || 'balanced'
    if ((depth1 === 'deep' && depth2 === 'deep') ||
        (depth1 === 'light' && depth2 === 'light')) {
      traitBonus += 0.05
    }
  }
  
  // Final score: embedding similarity (0.0-1.0) + trait bonus (0.0-0.2)
  // Clamp to 0.0-1.0
  return Math.min(1.0, embeddingSimilarity + traitBonus)
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    console.warn('[Matching Service] Vector length mismatch')
    return 0.0
  }
  
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }
  
  norm1 = Math.sqrt(norm1)
  norm2 = Math.sqrt(norm2)
  
  if (norm1 === 0 || norm2 === 0) {
    return 0.0
  }
  
  return dotProduct / (norm1 * norm2)
}

/**
 * Find best match for a user using AI personality matching
 * Uses pgvector cosine similarity to find most compatible user
 */
export async function findBestMatch(
  userId: string,
  userEmbedding: number[]
): Promise<MatchResult | null> {
  const supabase = createServerClient()
  
  console.log('[Matching Service] Finding best match for user:', userId)
  
  // Get user's traits for complementarity calculation
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('traits')
    .eq('id', userId)
    .single()
  
  if (userError || !userData) {
    console.error('[Matching Service] Error fetching user traits:', userError)
    // Continue without traits
  }
  
  const userTraits = userData?.traits || null
  
  // Get all waiting users and calculate similarity manually
  // pgvector RPC functions require SQL functions which we'll add via migration if needed
  // For now, use manual calculation which is more reliable
  console.log('[Matching Service] Using manual similarity calculation')
  
  const waitingUsers = await getWaitingPoolUsers(userId)
  
  if (waitingUsers.length === 0) {
    console.log('[Matching Service] No users in waiting pool')
    return null
  }
  
  console.log(`[Matching Service] Found ${waitingUsers.length} candidate(s) in waiting pool`)
  
  // Calculate scores for each candidate
  const candidates = await Promise.all(
    waitingUsers.map(async (candidate) => {
      // Get candidate's traits
      const { data: candidateData } = await supabase
        .from('users')
        .select('traits')
        .eq('id', candidate.user_id)
        .single()
      
        const candidateTraits = candidateData?.traits || null
        
        // Parse candidate embedding if needed
        let candidateEmbedding: number[]
        if (typeof candidate.embedding === 'string') {
          const cleaned = candidate.embedding.replace(/[\[\]]/g, '')
          candidateEmbedding = cleaned.split(',').map(Number)
        } else if (Array.isArray(candidate.embedding)) {
          candidateEmbedding = candidate.embedding
        } else {
          console.warn('[Matching Service] Invalid embedding format for candidate:', candidate.user_id)
          candidateEmbedding = []
        }
      
      // Calculate compatibility score
      const score = calculateCompatibilityScore(
        userEmbedding,
        candidateEmbedding,
        userTraits,
        candidateTraits
      )
      
      return {
        userId: candidate.user_id,
        matchScore: score,
        traitsUsed: {
          embeddingSimilarity: calculateCosineSimilarity(userEmbedding, candidateEmbedding),
          userTraits: userTraits,
          candidateTraits: candidateTraits,
        },
      }
    })
  )
  
  // Find best match (highest score)
  const bestMatch = candidates.reduce((best, current) => 
    current.matchScore > best.matchScore ? current : best
  )
  
  // Lower threshold: 0.1 instead of 0.3, or match immediately if only 2 users total
  // waitingUsers.length === 1 means 1 other user (excluding current), so 2 total users
  const threshold = waitingUsers.length === 1 ? 0.0 : 0.1
  
  if (bestMatch.matchScore < threshold) {
    console.log(`[Matching Service] Best match score too low: ${bestMatch.matchScore} (threshold: ${threshold})`)
    // If only 2 users total (1 candidate), match them anyway (FIFO fallback)
    if (waitingUsers.length === 1) {
      console.log('[Matching Service] Only 2 users total, matching anyway (FIFO fallback)')
      return bestMatch
    }
    return null
  }
  
  console.log('[Matching Service] ✅ Found best match:', bestMatch.userId, 'Score:', bestMatch.matchScore)
  return bestMatch
}
