"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Home, Target, Orbit, Calendar, User } from 'lucide-react'
import { tokensV2 } from '@/lib/design-tokens-v2'

const navItems = [
  { route: '/home-v2', icon: Home, label: 'Home' },
  { route: '/match-v2', icon: Target, label: 'Match' },
  { route: '/loops', icon: Orbit, label: 'Loops' },
  { route: '/events', icon: Calendar, label: 'Events' },
  { route: '/profile-v2', icon: User, label: 'Profile' },
]

export function NavbarV2() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: tokensV2.colors.backgroundWhite,
      borderTop: `1px solid ${tokensV2.colors.borderLight}`,
      padding: `${tokensV2.spacing[8]} ${tokensV2.spacing[16]}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: tokensV2.zIndex.sticky,
      boxShadow: tokensV2.shadows.small,
    }}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isSelected = pathname === item.route || pathname?.startsWith(item.route + '/')
        
        return (
          <button
            key={item.route}
            onClick={() => router.push(item.route)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: tokensV2.spacing[4],
              padding: tokensV2.spacing[8],
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSelected ? tokensV2.colors.gradientStart : tokensV2.colors.textSecondary,
              transition: tokensV2.transitions.fast,
            }}
          >
            <Icon size={24} />
            <span style={{
              fontSize: tokensV2.typography.fontSize.xs,
              fontWeight: isSelected ? tokensV2.typography.fontWeight.semibold : tokensV2.typography.fontWeight.regular,
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

