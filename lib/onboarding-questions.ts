/**
 * Onboarding Questions
 * 10 questions to understand the user for better matching and conversations
 */

export interface OnboardingQuestion {
  id: string
  question: string
  placeholder?: string
  maxLength?: number
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'ideal_afternoon',
    question: "What's your ideal way to spend a free afternoon?",
    placeholder: "e.g., Reading at a coffee shop, hiking with friends, working on a project...",
    maxLength: 200,
  },
  {
    id: 'energizing_topics',
    question: "What topics energize you most in conversation?",
    placeholder: "e.g., Technology, philosophy, sports, art, science...",
    maxLength: 200,
  },
  {
    id: 'connecting_preference',
    question: "How do you prefer to connect with new people?",
    placeholder: "e.g., One-on-one deep conversations, group discussions, shared activities...",
    maxLength: 200,
  },
  {
    id: 'current_curiosity',
    question: "What's something you're curious about right now?",
    placeholder: "e.g., Learning a new skill, understanding a concept, exploring a hobby...",
    maxLength: 200,
  },
  {
    id: 'communication_style',
    question: "What's your communication style?",
    placeholder: "e.g., Direct and to the point, thoughtful and reflective, expressive and animated...",
    maxLength: 200,
  },
  {
    id: 'meaningful_conversation',
    question: "What makes a conversation meaningful to you?",
    placeholder: "e.g., When I learn something new, when there's genuine connection, when ideas are challenged...",
    maxLength: 200,
  },
  {
    id: 'handling_disagreements',
    question: "How do you handle disagreements in discussions?",
    placeholder: "e.g., I enjoy debating different perspectives, I prefer finding common ground...",
    maxLength: 200,
  },
  {
    id: 'endless_topic',
    question: "What's a topic you could talk about for hours?",
    placeholder: "e.g., Music theory, space exploration, psychology, cooking...",
    maxLength: 200,
  },
  {
    id: 'learning_approach',
    question: "What's your approach to learning new things?",
    placeholder: "e.g., I dive deep into research, I learn by doing, I prefer structured courses...",
    maxLength: 200,
  },
  {
    id: 'relationship_values',
    question: "What do you value most in relationships?",
    placeholder: "e.g., Honesty, humor, intellectual stimulation, emotional support...",
    maxLength: 200,
  },
]

/**
 * Get question by ID
 */
export function getQuestionById(id: string): OnboardingQuestion | undefined {
  return ONBOARDING_QUESTIONS.find(q => q.id === id)
}

/**
 * Get all question IDs
 */
export function getAllQuestionIds(): string[] {
  return ONBOARDING_QUESTIONS.map(q => q.id)
}

/**
 * Validate that all questions are answered
 */
export function validateAllQuestionsAnswered(answers: Record<string, string>): {
  valid: boolean
  missing: string[]
} {
  const questionIds = getAllQuestionIds()
  const missing: string[] = []

  for (const questionId of questionIds) {
    if (!answers[questionId] || !answers[questionId].trim()) {
      missing.push(questionId)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

