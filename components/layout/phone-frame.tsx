"use client"

import { ReactNode } from "react"

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black overflow-hidden ${className}`}>
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

