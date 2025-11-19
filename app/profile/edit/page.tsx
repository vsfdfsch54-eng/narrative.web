"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"
import { useAuth } from "@/hooks/use-auth"
import { IntimacyTier } from "@/lib/types"
import type { User as UserType } from "@/lib/types"
import { INTIMACY_TIERS } from "@/lib/constants"

export default function ProfileEditPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserType>({
    id: user?.id || "1",
    name: (user?.user_metadata?.name as string) || "Your Name",
    email: user?.email || "you@example.com",
    bio: "",
    location: "",
    website: "",
    intimacyTier: "community",
    stats: {
      connections: 0,
      topics: 0,
      vibes: 0,
    },
  })

  useEffect(() => {
    const stored = localStorage.getItem("narrative_profile")
    if (stored) {
      try {
        setProfile(JSON.parse(stored))
      } catch {
        // Use default
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("narrative_profile", JSON.stringify(profile))
    router.push("/profile")
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <PageContainer maxWidth="2xl">
        <div className="space-y-8">
          <SectionHeader
            title="Edit Profile"
            description="Update your profile information"
          />

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar
                  src={profile.avatar}
                  alt={profile.name}
                  fallback={profile.name.charAt(0).toUpperCase()}
                  size="xl"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Profile picture
                  </p>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-card/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200 min-h-[100px]"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Location
                    </label>
                    <Input
                      type="text"
                      placeholder="City, Country"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Website
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile({ ...profile, website: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Default Intimacy Tier
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
                    value={profile.intimacyTier}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        intimacyTier: e.target.value as IntimacyTier,
                      })
                    }
                  >
                    {INTIMACY_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  )
}

