import { ExtractedQuestion } from "@/features/exams/services/question-formatter"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export type ImportQuestion = ExtractedQuestion & {
  id: string
  sectionId: string
  topicId: string
  difficulty: QuestionDifficulty
  points: number
  reviewed: boolean
  saved: boolean
}

export type ImportQuestionInput = Pick<
  ImportQuestion,
  | "id"
  | "sectionId"
  | "topicId"
  | "prompt"
  | "options"
  | "correctOption"
  | "explanation"
  | "difficulty"
  | "points"
>

export type ImportOption = {
  id: string
  name: string
}