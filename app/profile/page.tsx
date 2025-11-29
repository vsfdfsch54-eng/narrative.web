"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const router = useRouter()
  const { loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    // Redirect to V2 profile
    router.replace('/profile-v2')
  }, [authLoading, router])

  return null
}
