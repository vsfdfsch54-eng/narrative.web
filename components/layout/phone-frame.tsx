"use client"

import { ReactNode } from "react"

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div
      className={`
        w-full min-h-screen bg-black flex items-center justify-center px-4 py-6
        ${className}
      `}
    >
      <div className="phone-frame-container">
        <div className="phone-frame">
          <div className="phone-screen">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

