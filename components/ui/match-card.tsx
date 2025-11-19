"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "./card"
import { Avatar } from "./avatar"
import { Badge } from "./badge"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Match } from "@/lib/types"

interface MatchCardProps {
  match: Match
  onStartChat?: () => void
  delay?: number
}

export function MatchCard({
  match,
  onStartChat,
  delay = 0,
}: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card variant="default" className="h-full">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              src={match.user.avatar}
              alt={match.user.name}
              fallback={match.user.name.charAt(0).toUpperCase()}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-foreground truncate">
                  {match.user.name}
                </h3>
                <Badge variant={match.intimacyTier}>
                  {match.intimacyTier === "inner-circle"
                    ? "Inner Circle"
                    : match.intimacyTier === "close-friends"
                    ? "Close Friends"
                    : "Community"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {match.compatibility}% match
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{match.vibe}</span>
                <span>•</span>
                <span>{match.topic}</span>
              </div>
            </div>
          </div>
          {onStartChat && (
            <Button
              variant="primary"
              className="w-full"
              size="sm"
              onClick={onStartChat}
            >
              Start Chat
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

