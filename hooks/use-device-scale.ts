"use client"

import { useState, useEffect } from "react"

/**
 * Hook to get responsive scale based on device screen width
 * Larger devices (iPhone 15 Pro) get bigger scale, smaller devices (iPhone 12 mini) get smaller scale
 */
export function useDeviceScale() {
  const [scale, setScale] = useState(1.06) // Default scale

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth

      // iPhone 15 Pro Max: 430px - larger scale
      if (width >= 430) {
        setScale(1.10)
      }
      // iPhone 15 Pro / 14 Pro Max: 393-429px - medium-large scale
      else if (width >= 393) {
        setScale(1.08)
      }
      // iPhone 14 / 13 Pro / 12 Pro: 390-392px - default scale
      else if (width >= 390) {
        setScale(1.06)
      }
      // iPhone 12 mini / SE / older: 375-389px - smaller scale
      else if (width >= 375) {
        setScale(1.04)
      }
      // Very small devices: < 375px - smallest scale
      else {
        setScale(1.03)
      }
    }

    // Set initial scale
    updateScale()

    // Update on resize
    window.addEventListener("resize", updateScale)
    window.addEventListener("orientationchange", updateScale)

    return () => {
      window.removeEventListener("resize", updateScale)
      window.removeEventListener("orientationchange", updateScale)
    }
  }, [])

  return scale
}

