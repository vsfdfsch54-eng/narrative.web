/**
 * Loops Helper Functions
 * Functions for managing Loops (the only relational container in V2)
 */

import { createServerClient } from '@/lib/supabaseClient'

export interface CreateLoopParams {
  title: string
  visibilityLayer: 'private' | 'close-friends' | 'inner-circle' | 'community' | 'public'
  growthEnabled?: boolean
  pastActivityEnabled?: boolean
  feedSyncEnabled?: boolean
  privateLink?: string
  createdBy: string
}

export interface Loop {
  id: string
  title: string
  visibility_layer: string
  growth_enabled: boolean
  past_activity_enabled: boolean
  feed_sync_enabled: boolean
  private_link: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a new Loop
 */
export async function createLoop(params: CreateLoopParams): Promise<Loop | null> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('loops')
      .insert({
        title: params.title,
        visibility_layer: params.visibilityLayer,
        growth_enabled: params.growthEnabled ?? true,
        past_activity_enabled: params.pastActivityEnabled ?? true,
        feed_sync_enabled: params.feedSyncEnabled ?? true,
        private_link: params.privateLink || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[createLoop] Error:', error)
      return null
    }

    // Add creator as owner
    if (data) {
      await supabase
        .from('loop_participants')
        .insert({
          loop_id: data.id,
          user_id: params.createdBy,
          role: 'owner',
        })
    }

    return data
  } catch (error) {
    console.error('[createLoop] Exception:', error)
    return null
  }
}

/**
 * Get all Loops for a user
 */
export async function getUserLoops(userId: string): Promise<Loop[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('loop_participants')
      .select(`
        loop_id,
        loops (
          id,
          title,
          visibility_layer,
          growth_enabled,
          past_activity_enabled,
          feed_sync_enabled,
          private_link,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('[getUserLoops] Error:', error)
      return []
    }

    return (data || []).map((item: any) => item.loops).filter(Boolean)
  } catch (error) {
    console.error('[getUserLoops] Exception:', error)
    return []
  }
}

/**
 * Get a single Loop by ID
 */
export async function getLoopById(loopId: string, userId: string): Promise<Loop | null> {
  try {
    const supabase = createServerClient()
    
    // Verify user is a participant
    const { data: participant } = await supabase
      .from('loop_participants')
      .select('loop_id')
      .eq('loop_id', loopId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      return null
    }

    const { data, error } = await supabase
      .from('loops')
      .select('*')
      .eq('id', loopId)
      .single()

    if (error) {
      console.error('[getLoopById] Error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[getLoopById] Exception:', error)
    return null
  }
}

/**
 * Add a participant to a Loop
 */
export async function addParticipantToLoop(
  loopId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('loop_participants')
      .insert({
        loop_id: loopId,
        user_id: userId,
        role,
      })

    if (error) {
      console.error('[addParticipantToLoop] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[addParticipantToLoop] Exception:', error)
    return false
  }
}

/**
 * Remove a participant from a Loop
 */
export async function removeParticipantFromLoop(
  loopId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('loop_participants')
      .delete()
      .eq('loop_id', loopId)
      .eq('user_id', userId)

    if (error) {
      console.error('[removeParticipantFromLoop] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[removeParticipantFromLoop] Exception:', error)
    return false
  }
}

/**
 * Send a message to a Loop
 */
export async function sendLoopMessage(
  loopId: string,
  senderId: string,
  text: string
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    // Verify sender is a participant
    const { data: participant } = await supabase
      .from('loop_participants')
      .select('loop_id')
      .eq('loop_id', loopId)
      .eq('user_id', senderId)
      .single()

    if (!participant) {
      return false
    }

    const { error } = await supabase
      .from('loop_messages')
      .insert({
        loop_id: loopId,
        sender_id: senderId,
        text,
      })

    if (error) {
      console.error('[sendLoopMessage] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[sendLoopMessage] Exception:', error)
    return false
  }
}

/**
 * Get messages for a Loop
 */
export async function getLoopMessages(loopId: string, limit: number = 50): Promise<any[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('loop_messages')
      .select(`
        *,
        sender:users!loop_messages_sender_id_fkey (
          id,
          nickname,
          profile_photo_url
        )
      `)
      .eq('loop_id', loopId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getLoopMessages] Error:', error)
      return []
    }

    return (data || []).reverse() // Reverse to show oldest first
  } catch (error) {
    console.error('[getLoopMessages] Exception:', error)
    return []
  }
}

/**
 * Get participants for a Loop
 */
export async function getLoopParticipants(loopId: string): Promise<any[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('loop_participants')
      .select(`
        *,
        user:users!loop_participants_user_id_fkey (
          id,
          nickname,
          profile_photo_url
        )
      `)
      .eq('loop_id', loopId)

    if (error) {
      console.error('[getLoopParticipants] Error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[getLoopParticipants] Exception:', error)
    return []
  }
}

