"use client"

import { usePathname } from "next/navigation"
import { NavbarV2 } from "@/components/ui/navbar-v2"

export function ConditionalNavbar() {
  const pathname = usePathname()

  // All routes now use V2 navbar
  // V2 routes that should show navbar
  const v2Routes = [
    '/onboarding-v2',
    '/home-v2',
    '/match-v2',
    '/messaging-only',
    '/loops',
    '/events',
    '/profile-v2',
    '/notifications',
    '/invite',
  ]

  const shouldShowNavbar = pathname && (
    v2Routes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/loops/') ||
    pathname.startsWith('/events/')
  )

  if (shouldShowNavbar) {
    return <NavbarV2 />
  }

  // No navbar for auth pages, login, etc.
  return null
}
