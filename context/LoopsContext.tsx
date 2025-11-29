"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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

interface LoopsContextType {
  loops: Loop[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addLoop: (loop: Loop) => void
  updateLoop: (loopId: string, updates: Partial<Loop>) => void
  removeLoop: (loopId: string) => void
}

const LoopsContext = createContext<LoopsContextType | undefined>(undefined)

export function LoopsProvider({ children }: { children: ReactNode }) {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // This will be called from pages/components that have userId
    // For now, it's a placeholder
    setLoading(true)
    setError(null)
    // Implementation will be in pages that use this context
    setLoading(false)
  }, [])

  const addLoop = useCallback((loop: Loop) => {
    setLoops(prev => [...prev, loop])
  }, [])

  const updateLoop = useCallback((loopId: string, updates: Partial<Loop>) => {
    setLoops(prev => prev.map(loop => 
      loop.id === loopId ? { ...loop, ...updates } : loop
    ))
  }, [])

  const removeLoop = useCallback((loopId: string) => {
    setLoops(prev => prev.filter(loop => loop.id !== loopId))
  }, [])

  return (
    <LoopsContext.Provider
      value={{
        loops,
        loading,
        error,
        refresh,
        addLoop,
        updateLoop,
        removeLoop,
      }}
    >
      {children}
    </LoopsContext.Provider>
  )
}

export function useLoops() {
  const context = useContext(LoopsContext)
  if (context === undefined) {
    throw new Error('useLoops must be used within LoopsProvider')
  }
  return context
}

