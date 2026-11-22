
import "server-only"

export type ExtractedQuestion = {
  number: number
  prompt: string
  options: {
    key: string
    body: string
  }[]
  correctOption: string | null
  explanation: string
  warnings: string[]
}

export function parseDocumentQuestions(text: string): ExtractedQuestion[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const questions: ExtractedQuestion[] = []
  let current: ExtractedQuestion | null = null
  let lastField: "prompt" | "option" | "explanation" = "prompt"

  const finish = () => {
    if (!current) return

    const warnings: string[] = []

    if (current.options.length < 2) {
      warnings.push("Fewer than two answer options found.")
    }

    if (!current.correctOption) {
      warnings.push("Correct answer not identified.")
    } else if (
      !current.options.some(
        (option) => option.key === current!.correctOption
      )
    ) {
      warnings.push("The correct answer does not match an option.")
    }

    current.warnings = warnings
    questions.push(current)
  }

  for (const line of lines) {
    const questionMatch = line.match(
      /^(?:question\s*)?(\d{1,3})[.):]\s+(.+)$/i
    )

    if (questionMatch) {
      finish()

      current = {
        number: Number(questionMatch[1]),
        prompt: questionMatch[2],
        options: [],
        correctOption: null,
        explanation: "",
        warnings: [],
      }

      lastField = "prompt"
      continue
    }

    if (!current) continue

    const answerMatch = line.match(
      /^(?:correct\s+answer|answer|ans)\s*[:\-]\s*([a-d])\b/i
    )

    if (answerMatch) {
      current.correctOption = answerMatch[1].toLowerCase()
      continue
    }

    const explanationMatch = line.match(
      /^(?:explanation|solution)\s*[:\-]\s*(.*)$/i
    )

    if (explanationMatch) {
      current.explanation = explanationMatch[1]
      lastField = "explanation"
      continue
    }

    const optionMatch = line.match(
      /^\(?([a-d])\)?[.):\-]\s+(.+)$/i
    )

    if (optionMatch) {
      current.options.push({
        key: optionMatch[1].toLowerCase(),
        body: optionMatch[2],
      })

      lastField = "option"
      continue
    }

    // Preserve wrapped lines in question text and answers.
    if (lastField === "option" && current.options.length) {
      current.options[current.options.length - 1].body += ` ${line}`
    } else if (lastField === "explanation") {
      current.explanation += ` ${line}`
    } else {
      current.prompt += ` ${line}`
    }
  }

  finish()

  return questions
}
