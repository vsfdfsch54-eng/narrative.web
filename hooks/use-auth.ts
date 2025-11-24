"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Get initial session with timeout
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (mounted) {
      setUser(session?.user ?? null)
      setLoading(false)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 5000) // 5 second max wait
    
    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
      setUser(session?.user ?? null)
      setLoading(false)
        clearTimeout(timeout)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Get the current origin for redirect URL
      // Supabase will redirect to this URL after email verification
      // The callback will check verification status and redirect appropriately
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback'

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || email.split('@')[0],
          },
        },
      })

      if (error) {
        // Handle duplicate email error with user-friendly message
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered') ||
            error.message.includes('already exists') ||
            error.code === 'signup_disabled') {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please sign in instead.' 
          }
        }
        return { success: false, error: error.message }
      }

      // Don't create user record here - let the API route handle it with service role key
      // This avoids RLS policy issues and ensures proper user creation

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to sign up" }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Check if user has a profile
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!userData || !userData.name) {
          // No profile, will redirect to onboarding
          return { success: true, data, needsOnboarding: true }
        }
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    // Legacy support
    login: signIn,
    logout: signOut,
  }
}

