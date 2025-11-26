/**
 * Onboarding Questions
 * 10 questions to understand the user for better matching and conversations
 */

export interface OnboardingQuestion {
  id: string
  question: string
  options: {
    value: string
    label: string
    emoji?: string
  }[]
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'ideal_afternoon',
    question: "What's your ideal way to spend a free afternoon?",
    options: [
      { value: 'reading', label: 'Reading or learning something new', emoji: '📚' },
      { value: 'social', label: 'Hanging out with friends', emoji: '👥' },
      { value: 'active', label: 'Being active or outdoors', emoji: '🏃' },
      { value: 'creative', label: 'Working on a creative project', emoji: '🎨' },
      { value: 'relax', label: 'Relaxing and unwinding', emoji: '😌' },
    ],
  },
  {
    id: 'energizing_topics',
    question: "What topics energize you most in conversation?",
    options: [
      { value: 'tech', label: 'Technology and innovation', emoji: '💻' },
      { value: 'philosophy', label: 'Philosophy and deep thinking', emoji: '🤔' },
      { value: 'sports', label: 'Sports and competition', emoji: '⚽' },
      { value: 'arts', label: 'Arts and culture', emoji: '🎭' },
      { value: 'science', label: 'Science and discovery', emoji: '🔬' },
      { value: 'business', label: 'Business and entrepreneurship', emoji: '💼' },
    ],
  },
  {
    id: 'connecting_preference',
    question: "How do you prefer to connect with new people?",
    options: [
      { value: 'one-on-one', label: 'One-on-one deep conversations', emoji: '💬' },
      { value: 'group', label: 'Group discussions', emoji: '👥' },
      { value: 'activities', label: 'Shared activities or experiences', emoji: '🎯' },
      { value: 'casual', label: 'Casual and light-hearted chats', emoji: '😊' },
    ],
  },
  {
    id: 'current_curiosity',
    question: "What's something you're curious about right now?",
    options: [
      { value: 'skills', label: 'Learning a new skill', emoji: '🎓' },
      { value: 'concepts', label: 'Understanding complex concepts', emoji: '🧠' },
      { value: 'hobbies', label: 'Exploring new hobbies', emoji: '🎨' },
      { value: 'people', label: 'Understanding people and relationships', emoji: '👤' },
      { value: 'world', label: 'Current events and world issues', emoji: '🌍' },
    ],
  },
  {
    id: 'communication_style',
    question: "What's your communication style?",
    options: [
      { value: 'direct', label: 'Direct and to the point', emoji: '🎯' },
      { value: 'thoughtful', label: 'Thoughtful and reflective', emoji: '🤔' },
      { value: 'expressive', label: 'Expressive and animated', emoji: '💫' },
      { value: 'listener', label: 'I prefer listening and asking questions', emoji: '👂' },
    ],
  },
  {
    id: 'meaningful_conversation',
    question: "What makes a conversation meaningful to you?",
    options: [
      { value: 'learning', label: 'When I learn something new', emoji: '💡' },
      { value: 'connection', label: 'When there\'s genuine connection', emoji: '💝' },
      { value: 'challenge', label: 'When ideas are challenged', emoji: '⚔️' },
      { value: 'support', label: 'When I feel heard and supported', emoji: '🤗' },
    ],
  },
  {
    id: 'handling_disagreements',
    question: "How do you handle disagreements in discussions?",
    options: [
      { value: 'debate', label: 'I enjoy debating different perspectives', emoji: '🗣️' },
      { value: 'common-ground', label: 'I prefer finding common ground', emoji: '🤝' },
      { value: 'listen', label: 'I listen and try to understand', emoji: '👂' },
      { value: 'avoid', label: 'I try to avoid conflict', emoji: '🕊️' },
    ],
  },
  {
    id: 'endless_topic',
    question: "What's a topic you could talk about for hours?",
    options: [
      { value: 'music', label: 'Music and sound', emoji: '🎵' },
      { value: 'space', label: 'Space and the universe', emoji: '🚀' },
      { value: 'psychology', label: 'Psychology and human behavior', emoji: '🧠' },
      { value: 'cooking', label: 'Food and cooking', emoji: '🍳' },
      { value: 'history', label: 'History and stories', emoji: '📜' },
      { value: 'future', label: 'The future and possibilities', emoji: '🔮' },
    ],
  },
  {
    id: 'learning_approach',
    question: "What's your approach to learning new things?",
    options: [
      { value: 'deep-research', label: 'I dive deep into research', emoji: '🔍' },
      { value: 'hands-on', label: 'I learn by doing', emoji: '✋' },
      { value: 'structured', label: 'I prefer structured courses', emoji: '📋' },
      { value: 'conversation', label: 'I learn through conversation', emoji: '💬' },
    ],
  },
  {
    id: 'relationship_values',
    question: "What do you value most in relationships?",
    options: [
      { value: 'honesty', label: 'Honesty and transparency', emoji: '💎' },
      { value: 'humor', label: 'Humor and fun', emoji: '😄' },
      { value: 'intellectual', label: 'Intellectual stimulation', emoji: '🧠' },
      { value: 'emotional', label: 'Emotional support', emoji: '💗' },
      { value: 'growth', label: 'Mutual growth', emoji: '🌱' },
    ],
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
    if (!answers[questionId]) {
      missing.push(questionId)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

