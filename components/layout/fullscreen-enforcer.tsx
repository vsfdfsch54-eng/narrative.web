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
        el.style.display = "block"
        el.style.alignItems = "unset"
        el.style.justifyContent = "unset"
      }
      
      // Target phone-frame-container
      const phoneFrameContainer = document.querySelector('.phone-frame-container')
      if (phoneFrameContainer) {
        const el = phoneFrameContainer as HTMLElement
        el.style.width = "100vw"
        el.style.maxWidth = "none"
        el.style.margin = "0"
        el.style.padding = "0"
        el.style.border = "none"
        el.style.outline = "none"
        el.style.boxShadow = "none"
        el.style.background = "transparent"
      }
      
      // Target phone-frame
      const phoneFrame = document.querySelector('.phone-frame')
      if (phoneFrame) {
        const el = phoneFrame as HTMLElement
        el.style.width = "100vw"
        el.style.height = "100vh"
        el.style.height = "100dvh"
        el.style.margin = "0"
        el.style.padding = "0"
        el.style.border = "none"
        el.style.borderRadius = "0"
        el.style.outline = "none"
        el.style.boxShadow = "none"
        el.style.background = "transparent"
      }
      
      // Target phone-screen
      const phoneScreen = document.querySelector('.phone-screen')
      if (phoneScreen) {
        const el = phoneScreen as HTMLElement
        el.style.width = "100vw"
        el.style.height = "100vh"
        el.style.height = "100dvh"
        el.style.margin = "0"
        el.style.padding = "0"
        el.style.border = "none"
        el.style.borderRadius = "0"
        el.style.outline = "none"
        el.style.boxShadow = "none"
        el.style.background = "transparent"
      }
      
      // Target phone-content
      const phoneContent = document.querySelector('.phone-content')
      if (phoneContent) {
        const el = phoneContent as HTMLElement
        el.style.width = "100vw"
        el.style.height = "100vh"
        el.style.height = "100dvh"
        el.style.maxWidth = "none"
        el.style.minWidth = "100vw"
        el.style.position = "fixed"
        el.style.top = "0"
        el.style.left = "0"
        el.style.right = "0"
        el.style.bottom = "0"
        el.style.margin = "0"
        el.style.border = "none"
        el.style.outline = "none"
        el.style.boxShadow = "none"
        el.style.background = "#000000"
        el.style.zIndex = "1"
      }
      
      // Run immediately
      enforceFullscreen()
      
      // Run on resize
      window.addEventListener("resize", enforceFullscreen)
      
      // Re-apply all styles after delays
      const reapplyStyles = () => {
        enforceFullscreen()
        // Re-apply all container styles
        const containers = [
          '.fixed.inset-0',
          '.phone-frame-container',
          '.phone-frame',
          '.phone-screen',
          '.phone-content'
        ]
        containers.forEach(selector => {
          const el = document.querySelector(selector) as HTMLElement
          if (el) {
            if (selector === '.phone-content') {
              el.style.width = "100vw"
              el.style.height = "100vh"
              el.style.height = "100dvh"
              el.style.maxWidth = "none"
              el.style.minWidth = "100vw"
              el.style.position = "fixed"
              el.style.top = "0"
              el.style.left = "0"
              el.style.right = "0"
              el.style.bottom = "0"
              el.style.margin = "0"
              el.style.border = "none"
              el.style.outline = "none"
              el.style.boxShadow = "none"
              el.style.background = "#000000"
              el.style.zIndex = "1"
            } else {
              el.style.width = "100vw"
              el.style.maxWidth = "none"
              el.style.margin = "0"
              el.style.padding = "0"
              el.style.border = "none"
              el.style.borderRadius = "0"
              el.style.outline = "none"
              el.style.boxShadow = "none"
              el.style.background = "transparent"
            }
          }
        })
      }
      
      setTimeout(reapplyStyles, 100)
      setTimeout(reapplyStyles, 500)
      setTimeout(reapplyStyles, 1000)
      
      return () => {
        window.removeEventListener("resize", enforceFullscreen)
      }
    }
  }, [])
  
  return null
}

