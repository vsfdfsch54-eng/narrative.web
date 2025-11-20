"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
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
    <div className="fixed inset-0 bg-[#0a0a0c] overflow-hidden w-full h-full m-0 p-0 sm:flex sm:items-center sm:justify-center sm:p-4 sm:p-6">
      {/* Phone Frame Container */}
      <div className="phone-frame-container">
        {/* Phone Frame - Black & White */}
        <div className="phone-frame">
          {/* Phone Screen */}
          <div className="phone-screen">
            <div className="phone-content px-5 py-6 sm:p-4 pb-20 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Edit Profile</h1>
                  <p className="text-sm text-[#f1f1f3]/60">Update your profile information</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[20px] p-4 space-y-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar
                        src={profile.avatar}
                        alt={profile.name}
                        fallback={profile.name.charAt(0).toUpperCase()}
                        size="xl"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[#f1f1f3]/60 mb-2">
                          Profile picture
                        </p>
                        <button className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition text-sm">
                          Change Photo
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Name
                        </label>
                        <Input
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Bio
                        </label>
                        <textarea
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-[#f1f1f3]/50 resize-none transition-all duration-200 min-h-[100px]"
                          placeholder="Tell us about yourself..."
                          value={profile.bio}
                          onChange={(e) =>
                            setProfile({ ...profile, bio: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white">
                            Location
                          </label>
                          <Input
                            type="text"
                            placeholder="City, Country"
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({ ...profile, location: e.target.value })
                            }
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white">
                            Website
                          </label>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            value={profile.website}
                            onChange={(e) =>
                              setProfile({ ...profile, website: e.target.value })
                            }
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Default Intimacy Tier
                        </label>
                        <select
                          className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-all duration-200"
                          value={profile.intimacyTier}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              intimacyTier: e.target.value as IntimacyTier,
                            })
                          }
                        >
                          {INTIMACY_TIERS.map((tier) => (
                            <option key={tier.id} value={tier.id} className="bg-[#0a0a0c]">
                              {tier.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-full bg-[#f1f1f3] text-[#0a0a0c] hover:bg-white/95 transition font-semibold"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

