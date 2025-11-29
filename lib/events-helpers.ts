/**
 * Events Helper Functions
 * Functions for managing Events in V2
 */

import { createServerClient } from '@/lib/supabaseClient'

export interface CreateEventParams {
  title: string
  dateTime: string
  location?: string
  visibilityLayer: 'private' | 'close-friends' | 'inner-circle' | 'community' | 'public'
  growthEnabled?: boolean
  participantListVisible?: boolean
  pastActivityEnabled?: boolean
  syncToFeed?: boolean
  privateLink?: string
  guestModeEnabled?: boolean
  loopId?: string
  createdBy: string
}

export interface Event {
  id: string
  loop_id: string | null
  title: string
  date_time: string
  location: string | null
  visibility_layer: string
  growth_enabled: boolean
  participant_list_visible: boolean
  past_activity_enabled: boolean
  sync_to_feed: boolean
  private_link: string | null
  guest_mode_enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Create a new Event
 */
export async function createEvent(params: CreateEventParams): Promise<Event | null> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        loop_id: params.loopId || null,
        title: params.title,
        date_time: params.dateTime,
        location: params.location || null,
        visibility_layer: params.visibilityLayer,
        growth_enabled: params.growthEnabled ?? true,
        participant_list_visible: params.participantListVisible ?? true,
        past_activity_enabled: params.pastActivityEnabled ?? true,
        sync_to_feed: params.syncToFeed ?? true,
        private_link: params.privateLink || null,
        guest_mode_enabled: params.guestModeEnabled ?? false,
        created_by: params.createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[createEvent] Error:', error)
      return null
    }

    // Add creator as accepted participant
    if (data) {
      await supabase
        .from('event_participants')
        .insert({
          event_id: data.id,
          user_id: params.createdBy,
          status: 'accepted',
          joined_at: new Date().toISOString(),
        })
    }

    return data
  } catch (error) {
    console.error('[createEvent] Exception:', error)
    return null
  }
}

/**
 * Get all Events for a user
 */
export async function getUserEvents(userId: string): Promise<Event[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        event_id,
        events (
          id,
          loop_id,
          title,
          date_time,
          location,
          visibility_layer,
          growth_enabled,
          participant_list_visible,
          past_activity_enabled,
          sync_to_feed,
          private_link,
          guest_mode_enabled,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('[getUserEvents] Error:', error)
      return []
    }

    return (data || []).map((item: any) => item.events).filter(Boolean)
  } catch (error) {
    console.error('[getUserEvents] Exception:', error)
    return []
  }
}

/**
 * Get a single Event by ID
 */
export async function getEventById(eventId: string, userId: string): Promise<Event | null> {
  try {
    const supabase = createServerClient()
    
    // Verify user is a participant or creator
    const { data: participant } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      // Check if user is creator
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('created_by', userId)
        .single()

      if (!event) {
        return null
      }
      return event
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('[getEventById] Error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[getEventById] Exception:', error)
    return null
  }
}

/**
 * Invite a user to an Event
 */
export async function inviteToEvent(
  eventId: string,
  userId: string,
  status: 'invited' | 'accepted' | 'declined' | 'maybe' = 'invited'
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: userId,
        status,
        joined_at: status === 'accepted' ? new Date().toISOString() : null,
      })

    if (error) {
      console.error('[inviteToEvent] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[inviteToEvent] Exception:', error)
    return false
  }
}

/**
 * Update event participant status
 */
export async function updateEventStatus(
  eventId: string,
  userId: string,
  status: 'invited' | 'accepted' | 'declined' | 'maybe'
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const updateData: any = {
      status,
    }

    if (status === 'accepted') {
      updateData.joined_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('event_participants')
      .update(updateData)
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      console.error('[updateEventStatus] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[updateEventStatus] Exception:', error)
    return false
  }
}

/**
 * Get participants for an Event
 */
export async function getEventParticipants(eventId: string): Promise<any[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        user:users!event_participants_user_id_fkey (
          id,
          nickname,
          profile_photo_url
        )
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('[getEventParticipants] Error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[getEventParticipants] Exception:', error)
    return []
  }
}

