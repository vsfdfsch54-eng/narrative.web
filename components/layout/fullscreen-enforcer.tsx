"use client"

import { useEffect } from "react"

export function FullscreenEnforcer() {
  useEffect(() => {
    // Force fullscreen on mobile
    if (typeof window !== "undefined" && window.innerWidth <= 640) {
      const enforceFullscreen = () => {
        const html = document.documentElement
        const body = document.body
        
        // Set styles directly on elements
        html.style.width = "100vw"
        html.style.height = "100vh"
        html.style.height = "100dvh"
        html.style.margin = "0"
        html.style.padding = "0"
        html.style.overflow = "hidden"
        html.style.position = "fixed"
        
        body.style.width = "100vw"
        body.style.height = "100vh"
        body.style.height = "100dvh"
        body.style.margin = "0"
        body.style.padding = "0"
        body.style.overflow = "hidden"
        body.style.position = "fixed"
        body.style.top = "0"
        body.style.left = "0"
        body.style.right = "0"
        body.style.bottom = "0"
        
        // Target Next.js root
        const nextRoot = document.getElementById("__next")
        if (nextRoot) {
          nextRoot.style.width = "100vw"
          nextRoot.style.height = "100vh"
          nextRoot.style.height = "100dvh"
          nextRoot.style.margin = "0"
          nextRoot.style.padding = "0"
          nextRoot.style.position = "fixed"
          nextRoot.style.top = "0"
          nextRoot.style.left = "0"
          nextRoot.style.overflow = "hidden"
        }
      }
      
      // Target the outer fixed container
      const outerContainer = document.querySelector('.fixed.inset-0')
      if (outerContainer) {
        const el = outerContainer as HTMLElement
        el.style.width = "100vw"
        el.style.height = "100vh"
        el.style.height = "100dvh"
        el.style.margin = "0"
        el.style.padding = "0"
        el.style.border = "none"
        el.style.outline = "none"
        el.style.boxShadow = "none"
        el.style.background = "transparent"
      }
      
      // Run immediately
      enforceFullscreen()
      
      // Run on resize
      window.addEventListener("resize", enforceFullscreen)
      
      // Run after a short delay to catch any late-rendering
      setTimeout(() => {
        enforceFullscreen()
        // Re-apply outer container styles
        const outerContainer = document.querySelector('.fixed.inset-0')
        if (outerContainer) {
          const el = outerContainer as HTMLElement
          el.style.width = "100vw"
          el.style.height = "100vh"
          el.style.height = "100dvh"
          el.style.margin = "0"
          el.style.padding = "0"
          el.style.border = "none"
          el.style.outline = "none"
          el.style.boxShadow = "none"
          el.style.background = "transparent"
        }
      }, 100)
      setTimeout(() => {
        enforceFullscreen()
        // Re-apply outer container styles
        const outerContainer = document.querySelector('.fixed.inset-0')
        if (outerContainer) {
          const el = outerContainer as HTMLElement
          el.style.width = "100vw"
          el.style.height = "100vh"
          el.style.height = "100dvh"
          el.style.margin = "0"
          el.style.padding = "0"
          el.style.border = "none"
          el.style.outline = "none"
          el.style.boxShadow = "none"
          el.style.background = "transparent"
        }
      }, 500)
      
      return () => {
        window.removeEventListener("resize", enforceFullscreen)
      }
    }
  }, [])
  
  return null
}

