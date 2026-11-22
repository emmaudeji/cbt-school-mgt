
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type {
  ImportOption,
  ImportQuestion,
} from "@/types/question-import"
import { getImportIssues } from "../services/import-validation"

export type QuestionFormValue = Pick<
  ImportQuestion,
  | "prompt"
  | "options"
  | "correctOption"
  | "sectionId"
  | "topicId"
  | "difficulty"
  | "points"
  | "explanation"
>

type Props = {
  value: QuestionFormValue
  onChange: (value: QuestionFormValue) => void
  sections: ImportOption[]
  topics: ImportOption[]
  disabled?: boolean
}

const answerKeys = ["a", "b", "c", "d"] as const

export function QuestionFormFields({
  value,
  onChange,
  sections,
  topics,
  disabled = false,
}: Props) {
  const update = <K extends keyof QuestionFormValue>(
    field: K,
    nextValue: QuestionFormValue[K]
  ) => {
    onChange({
      ...value,
      [field]: nextValue,
    })
  }

  const updateOption = (key: string, body: string) => {
    onChange({
      ...value,
      options: answerKeys.map((optionKey) => ({
        key: optionKey,
        body:
          optionKey === key
            ? body
            : value.options.find(
                (option) => option.key === optionKey
              )?.body ?? "",
      })),
    })
  }

  const issues = getImportIssues(value)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="question-prompt">Question</Label>

        <Textarea
          id="question-prompt"
          value={value.prompt}
          onChange={(event) =>
            update("prompt", event.target.value)
          }
          placeholder="Write the question..."
          rows={6}
          disabled={disabled}
          className="resize-y"
        />

        <p className="text-xs text-muted-foreground">
          You can include text formulas, tables and line breaks.
        </p>
      </div>

      <div className="space-y-4 border-t pt-5">
        <div>
          <h3 className="text-sm font-semibold">
            Answer Options
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Review each option and identify the correct answer.
          </p>
        </div>

        {value.options.length > 4 && (
          <p className="rounded-md border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-400">
            More than four options were extracted. This editor
            supports A–D. Review the extra options before applying
            changes, as editing an option will retain only A–D.
          </p>
        )}

        {answerKeys.map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`question-option-${key}`}>
              Option {key.toUpperCase()}
            </Label>

            <Textarea
              id={`question-option-${key}`}
              rows={2}
              disabled={disabled}
              value={
                value.options.find(
                  (option) => option.key === key
                )?.body ?? ""
              }
              onChange={(event) =>
                updateOption(key, event.target.value)
              }
              placeholder={`Enter option ${key.toUpperCase()}`}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="question-answer">
            Correct Answer
          </Label>

          <select
            id="question-answer"
            value={value.correctOption ?? ""}
            onChange={(event) =>
              update(
                "correctOption",
                event.target.value || null
              )
            }
            disabled={disabled}
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select correct answer</option>
            {answerKeys.map((key) => (
              <option key={key} value={key}>
                Option {key.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-points">Marks</Label>

          <Input
            id="question-points"
            type="number"
            min={0}
            step="0.5"
            value={value.points}
            disabled={disabled}
            onChange={(event) =>
              update("points", Number(event.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-section">
            Examination Section
          </Label>

          <select
            id="question-section"
            value={value.sectionId}
            disabled={disabled}
            onChange={(event) =>
              update("sectionId", event.target.value)
            }
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option
                key={section.id}
                value={section.id}
              >
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-topic">
            Topic (optional)
          </Label>

          <select
            id="question-topic"
            value={value.topicId}
            disabled={disabled}
            onChange={(event) =>
              update("topicId", event.target.value)
            }
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">No topic</option>
            {topics.map((topic) => (
              <option
                key={topic.id}
                value={topic.id}
              >
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-difficulty">
            Difficulty
          </Label>

          <select
            id="question-difficulty"
            value={value.difficulty}
            disabled={disabled}
            onChange={(event) =>
              update(
                "difficulty",
                event.target.value as ImportQuestion["difficulty"]
              )
            }
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 border-t pt-5">
        <Label htmlFor="question-explanation">
          Explanation (optional)
        </Label>

        <Textarea
          id="question-explanation"
          rows={4}
          disabled={disabled}
          value={value.explanation}
          onChange={(event) =>
            update("explanation", event.target.value)
          }
          placeholder="Explain why the answer is correct..."
        />
      </div>

      {issues.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 p-4">
          <h4 className="text-sm font-medium">
            Needs attention
          </h4>

          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

