import { supabase, createServerClient } from './supabaseClient'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type Topic = Database['public']['Tables']['topics']['Row']

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return data
}

/**
 * Get all topics (server-side)
 */
export async function getAllTopics(): Promise<Topic[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('topics')
    .select('*')
    .order('label', { ascending: true })

  if (error) {
    console.error('Error getting topics:', error)
    return []
  }

  return data || []
}

/**
 * Get topics by category (server-side)
 */
export async function getTopicsByCategory(category: string): Promise<Topic[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('topics')
    .select('*')
    .eq('category', category)
    .order('label', { ascending: true })

  if (error) {
    console.error('Error getting topics by category:', error)
    return []
  }

  return data || []
}

/**
 * Save a topic (static reference data)
 */
export async function saveTopic(
  label: string,
  emoji?: string,
  blurb?: string,
  category?: string
): Promise<Topic | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('topics')
    .insert({
      label,
      emoji,
      blurb,
      category,
    })
    .select()

  if (error) {
    console.error('Error saving topic:', error)
    return null
  }

  return Array.isArray(data) ? data[0] : data
}

/**
 * ============================================================
 * V1 FUNCTIONS REMOVED - Use V2 APIs instead:
 * ============================================================
 * 
 * - createMatch() → Use /api/matchmaking-v2/find
 * - getNextMatch() → Use /api/matchmaking-v2/session/[sessionId]
 * - updateMatchStatus() → Use /api/matchmaking-v2/session/[sessionId]
 * - sendMessage() → Use /api/loops/[id]/messages
 * - getMessages() → Use /api/loops/[id]/messages
 * - createCalendarEvent() → Use /api/events
 * - getEventsForMonth() → Use /api/events
 * - getUserEvents() → Use /api/events
 * - autoMatchUser() → Use /api/matchmaking-v2/find
 * - submitFeedback() → Use /api/feedback (updated to V2 structure)
 */
