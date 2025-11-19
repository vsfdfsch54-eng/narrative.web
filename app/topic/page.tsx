"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { TopicChip } from "@/components/ui/topic-chip"
import { PageContainer } from "@/components/layout/page-container"
import { NEWS_TOPICS, POP_CULTURE_TOPICS, GENERAL_TOPICS } from "@/lib/constants"
import { Topic } from "@/lib/types"

export default function TopicPage() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Auto-navigate to connect after selection
    if (selectedTopic) {
      localStorage.setItem("selectedTopic", selectedTopic.id)
      const timer = setTimeout(() => {
        router.push("/connect")
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [selectedTopic, router])

  const TopicRow = ({
    label,
    topics,
    delay = 0,
  }: {
    label: string
    topics: Topic[]
    delay?: number
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="space-y-4"
    >
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1, duration: 0.3 }}
      >
        <h3 className="text-xs font-light text-muted-foreground uppercase tracking-widest">
          {label}
        </h3>
        <div className="flex-1 h-px bg-border/20" />
      </motion.div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: delay + index * 0.02,
              }}
            >
              <TopicChip
                topic={topic}
                selected={selectedTopic?.id === topic.id}
                onClick={() => setSelectedTopic(topic)}
                delay={0}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <PageContainer maxWidth="2xl">
        <div className="w-full max-w-5xl mx-auto space-y-16">
          {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-center space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
              Choose a topic
              </h1>
            <p className="text-sm text-muted-foreground font-light">
                Explore conversations by theme
              </p>
          </motion.div>

          {/* Topic rows */}
          <div className="space-y-10">
            <TopicRow label="News" topics={NEWS_TOPICS} delay={0.1} />
            <TopicRow label="Pop Culture" topics={POP_CULTURE_TOPICS} delay={0.2} />
            <TopicRow label="General" topics={GENERAL_TOPICS} delay={0.3} />
          </div>

          {/* Selection feedback */}
          <AnimatePresence>
            {selectedTopic && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                  <span className="text-xs text-foreground/60 font-light">
                    {selectedTopic.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
      </PageContainer>
    </div>
  )
}
