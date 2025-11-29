/**
 * Matchmaking Score Algorithm
 * Calculates compatibility score based on:
 * - mood proximity
 * - intention compatibility
 * - topic similarity (semantic)
 * - safety exclusion rules
 * - block/report history
 * - ghosting penalties
 */

export interface MatchScoreInput {
  user1Mood: string
  user2Mood: string
  user1Intention: string
  user2Intention: string
  user1Topic: string
  user2Topic: string
  user1Id: string
  user2Id: string
  safetyFlags?: Array<{ user_id: string; flagged_user_id: string; severity: string }>
  blockHistory?: Array<{ user_id: string; blocked_user_id: string }>
  ghostingHistory?: Array<{ user_id: string; ghosted_user_id: string }>
}

export interface MatchScore {
  totalScore: number // 0-100
  moodScore: number // 0-30
  intentionScore: number // 0-30
  topicScore: number // 0-30
  safetyPenalty: number // 0 to -100
  blockPenalty: number // 0 to -100
  ghostingPenalty: number // 0 to -50
}

const MOOD_COMPATIBILITY: Record<string, string[]> = {
  happy: ['happy', 'content', 'neutral'],
  content: ['happy', 'content', 'neutral', 'sad'],
  neutral: ['happy', 'content', 'neutral', 'sad'],
  sad: ['content', 'neutral', 'sad'],
}

const INTENTION_COMPATIBILITY: Record<string, string[]> = {
  reflect: ['reflect', 'talk'],
  talk: ['reflect', 'talk', 'connect'],
  connect: ['talk', 'connect', 'socialize'],
  socialize: ['connect', 'socialize'],
}

const TOPIC_SIMILARITY: Record<string, string[]> = {
  'deep-talk': ['deep-talk', 'relationships'],
  music: ['music', 'art'],
  art: ['music', 'art', 'deep-talk'],
  relationships: ['deep-talk', 'relationships', 'news'],
  news: ['relationships', 'news'],
}

export function calculateMatchScore(input: MatchScoreInput): MatchScore {
  // Mood proximity (0-30 points)
  const moodScore = calculateMoodScore(input.user1Mood, input.user2Mood)
  
  // Intention compatibility (0-30 points)
  const intentionScore = calculateIntentionScore(input.user1Intention, input.user2Intention)
  
  // Topic similarity (0-30 points)
  const topicScore = calculateTopicScore(input.user1Topic, input.user2Topic)
  
  // Safety penalties
  const safetyPenalty = calculateSafetyPenalty(input.user1Id, input.user2Id, input.safetyFlags || [])
  
  // Block penalty (immediate disqualification if blocked)
  const blockPenalty = calculateBlockPenalty(input.user1Id, input.user2Id, input.blockHistory || [])
  
  // Ghosting penalty (reduces score but doesn't disqualify)
  const ghostingPenalty = calculateGhostingPenalty(input.user1Id, input.user2Id, input.ghostingHistory || [])
  
  const totalScore = Math.max(0, Math.min(100, 
    moodScore + 
    intentionScore + 
    topicScore + 
    safetyPenalty + 
    blockPenalty + 
    ghostingPenalty
  ))
  
  return {
    totalScore,
    moodScore,
    intentionScore,
    topicScore,
    safetyPenalty,
    blockPenalty,
    ghostingPenalty,
  }
}

function calculateMoodScore(mood1: string, mood2: string): number {
  if (mood1 === mood2) return 30
  const compatible = MOOD_COMPATIBILITY[mood1] || []
  if (compatible.includes(mood2)) return 20
  return 10
}

function calculateIntentionScore(intention1: string, intention2: string): number {
  if (intention1 === intention2) return 30
  const compatible = INTENTION_COMPATIBILITY[intention1] || []
  if (compatible.includes(intention2)) return 20
  return 10
}

function calculateTopicScore(topic1: string, topic2: string): number {
  if (topic1 === topic2) return 30
  const similar = TOPIC_SIMILARITY[topic1] || []
  if (similar.includes(topic2)) return 20
  return 10
}

function calculateSafetyPenalty(
  user1Id: string, 
  user2Id: string, 
  safetyFlags: Array<{ user_id: string; flagged_user_id: string; severity: string }>
): number {
  const flags = safetyFlags.filter(
    f => (f.user_id === user1Id && f.flagged_user_id === user2Id) ||
         (f.user_id === user2Id && f.flagged_user_id === user1Id)
  )
  
  if (flags.length === 0) return 0
  
  // Calculate penalty based on severity and count
  let penalty = 0
  for (const flag of flags) {
    switch (flag.severity) {
      case 'critical':
        penalty -= 100 // Immediate disqualification
        break
      case 'high':
        penalty -= 50
        break
      case 'medium':
        penalty -= 25
        break
      case 'low':
        penalty -= 10
        break
    }
  }
  
  return penalty
}

function calculateBlockPenalty(
  user1Id: string,
  user2Id: string,
  blockHistory: Array<{ user_id: string; blocked_user_id: string }>
): number {
  const isBlocked = blockHistory.some(
    b => (b.user_id === user1Id && b.blocked_user_id === user2Id) ||
         (b.user_id === user2Id && b.blocked_user_id === user1Id)
  )
  
  return isBlocked ? -100 : 0 // Immediate disqualification
}

function calculateGhostingPenalty(
  user1Id: string,
  user2Id: string,
  ghostingHistory: Array<{ user_id: string; ghosted_user_id: string }>
): number {
  const ghostingCount = ghostingHistory.filter(
    g => (g.user_id === user1Id && g.ghosted_user_id === user2Id) ||
         (g.user_id === user2Id && g.ghosted_user_id === user1Id)
  ).length
  
  // Each ghosting incident reduces score by 10 points, max -50
  return Math.max(-50, -10 * ghostingCount)
}

