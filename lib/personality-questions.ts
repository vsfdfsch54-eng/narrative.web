/**
 * Personality Questionnaire
 * 5-7 questions covering key personality dimensions for AI matching
 */

export interface PersonalityQuestion {
  id: string
  question: string
  options: {
    value: string
    label: string
    emoji?: string
  }[]
  category: 'communication' | 'social' | 'values' | 'emotional' | 'intention'
}

export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [
  {
    id: 'communication_style',
    question: 'How do you prefer to communicate?',
    options: [
      { value: 'direct', label: 'Direct and straightforward', emoji: '🎯' },
      { value: 'indirect', label: 'Subtle and nuanced', emoji: '🌊' },
      { value: 'balanced', label: 'Depends on the situation', emoji: '⚖️' },
    ],
    category: 'communication',
  },
  {
    id: 'social_energy',
    question: 'What describes your social energy level?',
    options: [
      { value: 'introvert', label: 'I recharge alone, prefer smaller groups', emoji: '🕯️' },
      { value: 'extrovert', label: 'I recharge with others, love socializing', emoji: '🔥' },
      { value: 'ambivert', label: 'A mix of both, depends on my mood', emoji: '🌓' },
    ],
    category: 'social',
  },
  {
    id: 'conversation_depth',
    question: 'What kind of conversations do you enjoy most?',
    options: [
      { value: 'deep', label: 'Deep, meaningful, philosophical', emoji: '🌌' },
      { value: 'light', label: 'Light, fun, easy-going', emoji: '☀️' },
      { value: 'balanced', label: 'A mix of both', emoji: '🌈' },
    ],
    category: 'social',
  },
  {
    id: 'values',
    question: 'What matters most to you in conversations?',
    options: [
      { value: 'authenticity', label: 'Authenticity and honesty', emoji: '💎' },
      { value: 'growth', label: 'Learning and growth', emoji: '🌱' },
      { value: 'connection', label: 'Genuine connection', emoji: '🤝' },
      { value: 'fun', label: 'Fun and entertainment', emoji: '🎉' },
    ],
    category: 'values',
  },
  {
    id: 'emotional_expression',
    question: 'How do you express emotions?',
    options: [
      { value: 'open', label: 'I share my feelings openly', emoji: '💗' },
      { value: 'reserved', label: 'I keep feelings private', emoji: '🔒' },
      { value: 'balanced', label: 'I share when comfortable', emoji: '🎭' },
    ],
    category: 'emotional',
  },
  {
    id: 'social_intention',
    question: 'What are you looking for in conversations? (Select all that apply)',
    options: [
      { value: 'venting', label: 'A space to vent and be heard', emoji: '🗣️' },
      { value: 'learning', label: 'To learn new perspectives', emoji: '📚' },
      { value: 'humor', label: 'Laughs and good moods', emoji: '😄' },
      { value: 'connection', label: 'Deep connection with others', emoji: '💫' },
    ],
    category: 'intention',
  },
  {
    id: 'conversation_structure',
    question: 'How do you prefer conversations to flow?',
    options: [
      { value: 'structured', label: 'Organized with clear topics', emoji: '📋' },
      { value: 'free_flowing', label: 'Natural, wherever it goes', emoji: '🌊' },
      { value: 'balanced', label: 'A bit of both', emoji: '🌀' },
    ],
    category: 'communication',
  },
]

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: PersonalityQuestion['category']): PersonalityQuestion[] {
  return PERSONALITY_QUESTIONS.filter(q => q.category === category)
}

/**
 * Get all question IDs
 */
export function getAllQuestionIds(): string[] {
  return PERSONALITY_QUESTIONS.map(q => q.id)
}

/**
 * Validate questionnaire answers
 */
export function validateQuestionnaireAnswers(answers: Record<string, any>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const questionIds = getAllQuestionIds()

  // Check for required questions
  for (const questionId of questionIds) {
    if (!(questionId in answers)) {
      errors.push(`Missing answer for question: ${questionId}`)
    }
  }

  // Validate social_intention is an array (multi-select)
  if (answers.social_intention && !Array.isArray(answers.social_intention)) {
    errors.push('social_intention must be an array')
  }

  // Validate other questions are strings
  for (const questionId of questionIds) {
    if (questionId === 'social_intention') continue
    
    if (questionId in answers && typeof answers[questionId] !== 'string') {
      errors.push(`${questionId} must be a string`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
