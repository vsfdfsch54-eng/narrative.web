import { supabase, createServerClient } from './supabaseClient'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type Vibe = Database['public']['Tables']['vibes']['Row']
type Topic = Database['public']['Tables']['topics']['Row']
type ChatMatch = Database['public']['Tables']['chat_matches']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Feedback = Database['public']['Tables']['feedback']['Row']

/**
 * Save a vibe for a user (server-side)
 */
export async function saveVibe(userId: string, vibe: string): Promise<Vibe | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('vibes')
    .insert({
      user_id: userId,
      vibe,
    })
    .select()

  if (error) {
    console.error('Error saving vibe:', error)
    return null
  }

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

/**
 * Get the user's most recent vibe (server-side)
 */
export async function getLastVibe(userId: string): Promise<Vibe | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('vibes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error getting last vibe:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0]
}

/**
 * Get all vibes for a user (server-side)
 */
export async function getUserVibes(userId: string): Promise<Vibe[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('vibes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting user vibes:', error)
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

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

/**
 * Create a chat match between two users (server-side)
 */
export async function createMatch(
  user1Id: string,
  user2Id: string,
  topic?: string
): Promise<ChatMatch | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('chat_matches')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      topic: topic || null,
      status: 'active',
    })
    .select()

  if (error) {
    console.error('Error creating match:', error)
    return null
  }

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

/**
 * Find or create a match for a user (server-side)
 * Tries to find an available user in the queue, or adds current user to queue
 */
export async function findOrCreateMatch(userId: string): Promise<ChatMatch | null> {
  const supabaseServer = createServerClient()
  
  // First, check if user already has an active match
  const { data: existingMatches, error: existingError } = await supabaseServer
    .from('chat_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')

  if (!existingError && existingMatches && existingMatches.length > 0) {
    // Return a random match instead of always the first one
    const randomIndex = Math.floor(Math.random() * existingMatches.length)
    return existingMatches[randomIndex]
  }

  // Check for pending matches
  const { data: pendingMatches, error: pendingError } = await supabaseServer
    .from('chat_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  if (!pendingError && pendingMatches && pendingMatches.length > 0) {
    return pendingMatches[0]
  }

  // Try to find a user in the queue
  const { data: queueUsers, error: queueError } = await supabaseServer
    .from('match_queue')
    .select('user_id')
    .neq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (!queueError && queueUsers && queueUsers.length > 0) {
    // Found a user in queue, create match and remove both from queue
    const otherUserId = queueUsers[0].user_id
    
    // Remove both users from queue
    await supabaseServer.from('match_queue').delete().eq('user_id', userId)
    await supabaseServer.from('match_queue').delete().eq('user_id', otherUserId)
    
    // Create match
    const { data: newMatchData, error: matchError } = await supabaseServer
      .from('chat_matches')
      .insert({
        user1_id: userId,
        user2_id: otherUserId,
        status: 'active',
        relationship_tier: 'community',
      })
      .select()

    if (matchError) {
      console.error('Error creating match:', matchError)
      // Add user back to queue if match creation failed
      await supabaseServer.from('match_queue').upsert({ user_id: userId })
      return null
    }

    // Handle array response
    const newMatch = Array.isArray(newMatchData) ? newMatchData[0] : newMatchData
    return newMatch || null
  } else {
    // No one in queue, add current user to queue
    await supabaseServer
      .from('match_queue')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
    
    return null // User is now in queue
  }
}

/**
 * Get the next available match for a user (server-side)
 */
export async function getNextMatch(userId: string): Promise<ChatMatch | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('chat_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')

  if (error) {
    console.error('Error getting next match:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  // Return a random match instead of always the first one
  const randomIndex = Math.floor(Math.random() * data.length)
  return data[randomIndex]
}

/**
 * Send a message in a chat match (server-side)
 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  text: string
): Promise<Message | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      text,
    })
    .select()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  // Update match status to active if it was pending
  await supabaseServer
    .from('chat_matches')
    .update({ status: 'active' })
    .eq('id', matchId)
    .eq('status', 'pending')

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

/**
 * Get all messages for a chat match (server-side)
 */
export async function getMessages(matchId: string): Promise<Message[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error getting messages:', error)
    return []
  }

  return data || []
}

/**
 * Create a calendar event (server-side)
 */
export async function createCalendarEvent(
  userId: string,
  day: number,
  title: string,
  location?: string,
  timeSlot?: string,
  groupType?: 'inner' | 'close' | 'community'
): Promise<CalendarEvent | null> {
  // Use server client for API routes
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('calendar_events')
    .insert({
      user_id: userId,
      day,
      title,
      location: location || null,
      time_slot: timeSlot || null,
      group_type: groupType || null,
    })
    .select()

  if (error) {
    console.error('Error creating calendar event:', error)
    return null
  }

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

/**
 * Get calendar events for a specific month (server-side)
 */
export async function getEventsForMonth(
  userId: string,
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  // Use server client for API routes
  const supabaseServer = createServerClient()
  
  // Get the first and last day of the month
  const firstDay = new Date(year, month, 1).getDate()
  const lastDay = new Date(year, month + 1, 0).getDate()

  const { data, error } = await supabaseServer
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('day', firstDay)
    .lte('day', lastDay)
    .order('day', { ascending: true })

  if (error) {
    console.error('Error getting calendar events:', error)
    return []
  }

  return data || []
}

/**
 * Get all calendar events for a user
 */
export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true })

  if (error) {
    console.error('Error getting user events:', error)
    return []
  }

  return data || []
}

/**
 * Submit feedback for a match (server-side)
 */
export async function submitFeedback(
  matchId: string,
  userId: string,
  emoji?: string,
  notes?: string
): Promise<Feedback | null> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('feedback')
    .insert({
      match_id: matchId,
      user_id: userId,
      emoji: emoji || null,
      notes: notes || null,
    })
    .select()

  if (error) {
    console.error('Error submitting feedback:', error)
    return null
  }

  // Handle array response
  return Array.isArray(data) ? data[0] : data
}

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
 * Update match status (server-side)
 */
export async function updateMatchStatus(
  matchId: string,
  status: 'pending' | 'active' | 'ended'
): Promise<boolean> {
  const supabaseServer = createServerClient()
  const { error } = await supabaseServer
    .from('chat_matches')
    .update({ status })
    .eq('id', matchId)

  if (error) {
    console.error('Error updating match status:', error)
    return false
  }

  return true
}

/**
 * Get all matches for a user (server-side)
 */
export async function getUserMatches(userId: string): Promise<ChatMatch[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('chat_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting user matches:', error)
    return []
  }

  return data || []
}

/**
 * Get recent chats for a user (active matches) (server-side)
 */
export async function getRecentChats(userId: string, limit: number = 10): Promise<ChatMatch[]> {
  const supabaseServer = createServerClient()
  const { data, error } = await supabaseServer
    .from('chat_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting recent chats:', error)
    return []
  }

  return data || []
}

/**
 * Automatically match a new user with all existing users (server-side)
 * Creates matches with all other users who don't already have a match with this user
 */
export async function autoMatchUser(newUserId: string): Promise<ChatMatch[]> {
  const supabaseServer = createServerClient()
  const createdMatches: ChatMatch[] = []

  try {
    // Get all existing users except the new user
    const { data: allUsers, error: usersError } = await supabaseServer
      .from('users')
      .select('id')
      .neq('id', newUserId)

    if (usersError) {
      console.error('Error fetching users for auto-matching:', usersError)
      return []
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('No other users to match with')
      return []
    }

    // Get existing matches for the new user to avoid duplicates
    // Check both directions (user1_id and user2_id)
    const { data: existingMatches, error: matchesError } = await supabaseServer
      .from('chat_matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${newUserId},user2_id.eq.${newUserId}`)

    if (matchesError) {
      console.error('Error fetching existing matches:', matchesError)
      return []
    }

    // Create a set of user IDs that are already matched
    const alreadyMatched = new Set<string>()
    if (existingMatches) {
      existingMatches.forEach(match => {
        if (match.user1_id === newUserId) {
          alreadyMatched.add(match.user2_id)
        } else if (match.user2_id === newUserId) {
          alreadyMatched.add(match.user1_id)
        }
      })
    }

    // Create matches with all users who aren't already matched
    const usersToMatch = allUsers.filter(user => !alreadyMatched.has(user.id))

    if (usersToMatch.length === 0) {
      console.log('User already matched with all existing users')
      return []
    }

    // Create matches in batches to avoid overwhelming the database
    // Use consistent ordering: always put the smaller UUID first to avoid duplicates
    const batchSize = 10
    for (let i = 0; i < usersToMatch.length; i += batchSize) {
      const batch = usersToMatch.slice(i, i + batchSize)
      const matchesToInsert = batch.map(user => {
        // Always put the smaller UUID first to ensure consistency
        const user1Id = newUserId < user.id ? newUserId : user.id
        const user2Id = newUserId < user.id ? user.id : newUserId
        return {
          user1_id: user1Id,
          user2_id: user2Id,
          status: 'active' as const,
        }
      })

      const { data: insertedMatches, error: insertError } = await supabaseServer
        .from('chat_matches')
        .insert(matchesToInsert)
        .select()

      if (insertError) {
        // If it's a duplicate key error, that's okay - match already exists
        if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
          console.log('Some matches already exist, continuing...')
        } else {
          console.error('Error creating auto-matches:', insertError)
        }
        // Continue with next batch even if this one fails
        continue
      }

      if (insertedMatches) {
        createdMatches.push(...insertedMatches)
      }
    }

    console.log(`Auto-matched user ${newUserId} with ${createdMatches.length} users`)
    return createdMatches
  } catch (error) {
    console.error('Error in autoMatchUser:', error)
    return []
  }
}

