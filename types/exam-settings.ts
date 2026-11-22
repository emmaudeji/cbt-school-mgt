
export type ExamSettings = {
  id: string
  slug: string
  title: string
  description: string | null
  status: "draft" | "active" | "archived"
  instructions: string | null
  duration_seconds: number | null
  available_from: string | null
  available_until: string | null
  max_attempts: number | null
  shuffle_questions: boolean | null
  shuffle_options: boolean | null
}

export type ExamSettingsInput = {
  title: string
  description: string
  instructions: string
  durationMinutes: number
  availableFrom: string | null
  availableUntil: string | null
  maxAttempts: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResultAfterSubmission: boolean
  allowExamReview: boolean
  reviewRelease: "after_close" | "after_submission"
}

export type SaveExamSettingsResult = {
  success: boolean
  error?: string
}

export type AccessMode = "registered" | "access_code" | "open_link" | null
