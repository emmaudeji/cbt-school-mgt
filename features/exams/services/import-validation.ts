
import type { ImportQuestion } from "@/types/question-import"

type ValidatableQuestion = Pick<
  ImportQuestion,
  | "prompt"
  | "options"
  | "correctOption"
  | "sectionId"
  | "difficulty"
  | "points"
> & {
  reviewed?: boolean
  warnings?: string[]
}

const keys = ["a", "b", "c", "d"]

export function getImportIssues(
  question: ValidatableQuestion
): string[] {
  const issues: string[] = []

  if (!question.prompt.trim()) {
    issues.push("Question text is required.")
  }

  if (!question.sectionId) {
    issues.push("Select an examination section.")
  }

  if (
    question.options.length !== 4 ||
    new Set(question.options.map((option) => option.key)).size !== 4 ||
    !keys.every((key) =>
      question.options.some(
        (option) =>
          option.key === key && option.body.trim()
      )
    )
  ) {
    issues.push("Provide four answer options (A–D).")
  }

  if (
    !question.correctOption ||
    !keys.includes(question.correctOption)
  ) {
    issues.push("Select a correct answer.")
  }

  if (
    !Number.isFinite(question.points) ||
    question.points < 0
  ) {
    issues.push("Enter valid marks.")
  }

  if (
    !["easy", "medium", "hard"].includes(
      question.difficulty
    )
  ) {
    issues.push("Select a valid difficulty.")
  }

  if (
    /\[image omitted\]/i.test(question.prompt) ||
    question.options.some((option) =>
      /\[image omitted\]/i.test(option.body)
    )
  ) {
    issues.push("A missing image must be resolved before saving.")
  }

  if (
    question.reviewed === false &&
    question.warnings?.length
  ) {
    issues.push(...question.warnings)
  }

  return [...new Set(issues)]
}
