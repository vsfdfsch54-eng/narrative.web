"use client"

import { usePathname } from "next/navigation"
import NavBar from "@/components/ui/navbar"
import { NavbarV2 } from "@/components/ui/navbar-v2"

export function ConditionalNavbar() {
  const pathname = usePathname()

  // V2 routes use V2 navbar
  const v2Routes = [
    '/onboarding-v2',
    '/home-v2',
    '/match-v2',
    '/messaging-only',
    '/loops',
    '/events',
    '/profile-v2',
  ]

  const isV2Route = pathname && v2Routes.some(route => pathname.startsWith(route))

  if (isV2Route) {
    return <NavbarV2 />
  }

  // All other routes use V1 navbar
  return <NavBar />
}


