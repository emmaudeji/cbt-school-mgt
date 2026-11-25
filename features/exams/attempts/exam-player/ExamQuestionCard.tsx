"use client"

import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ExamQuestion } from "../services/attempt-player"
import { PlayerDraft } from "./useExamPlayerController"

 

type Props = {
  question: ExamQuestion | null
  draft: PlayerDraft | null
  currentIndex: number
  totalQuestions: number
  isActive: boolean
  submitting: boolean
  onUpdate: (
    id: string,
    value: Partial<
      Pick<PlayerDraft, "selectedIds" | "text">
    >
  ) => void
  onToggle: (
    question: ExamQuestion,
    optionId: string
  ) => void
  onRetrySave: (id: string) => void
  onNavigate: (index: number) => void
}

function questionTypeLabel(type: ExamQuestion["type"]) {
  switch (type) {
    case "multiple_choice":
      return "Multiple choice"
    case "free_text":
      return "Written response"
    case "true_false":
      return "True / False"
    default:
      return "Single choice"
  }
}

export function ExamQuestionCard({
  question,
  draft,
  currentIndex,
  totalQuestions,
  isActive,
  submitting,
  onUpdate,
  onToggle,
  onRetrySave,
  onNavigate,
}: Props) {
  if (!question) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No questions are available for this attempt.
        </CardContent>
      </Card>
    )
  }

  const disabled = !isActive || submitting
  const selectedIds = draft?.selectedIds ?? []

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3 sm:px-6">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            Question {question.number}
          </p>

          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalQuestions}
          </p>
        </div>

        <Badge variant="secondary">
          {questionTypeLabel(question.type)}
        </Badge>
      </div>

      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="whitespace-pre-wrap text-[15px] font-medium leading-7 sm:text-base">
          {question.prompt}
        </div>

        {question.type === "free_text" ? (
          <div className="space-y-2">
            <Textarea
              value={draft?.text ?? ""}
              onChange={(event) =>
                onUpdate(question.id, {
                  text: event.target.value,
                })
              }
              disabled={disabled}
              rows={7}
              maxLength={5000}
              placeholder="Write your answer here..."
              className="min-h-36 resize-y leading-6 shadow-none"
            />

            <p className="text-right text-xs text-muted-foreground">
              {(draft?.text ?? "").length} / 5000
            </p>
          </div>
        ) : (
          <fieldset
            disabled={disabled}
            className="space-y-2.5"
          >
            <legend className="sr-only">
              Answer choices for question {question.number}
            </legend>

            {question.options.map((option) => {
              const checked = selectedIds.includes(
                option.id
              )

              const multiple =
                question.type === "multiple_choice"

              return (
                <label
                  key={option.id}
                  className={[
                    "flex min-h-12 items-start gap-3 rounded-lg border p-3 transition-colors",
                    "focus-within:ring-2 focus-within:ring-primary/30",
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30",
                    disabled
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={`question-${question.id}`}
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      onToggle(question, option.id)
                    }
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />

                  <span className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6">
                    {option.text}
                  </span>
                </label>
              )
            })}
          </fieldset>
        )}

        {draft?.error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
          >
            <p className="text-xs text-destructive">
              {draft.error}
            </p>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || draft.saving}
              onClick={() =>
                onRetrySave(question.id)
              }
            >
              <RotateCw className="size-3.5" />
              Retry save
            </Button>
          </div>
        )}

        {isActive &&
          question.type !== "free_text" &&
          selectedIds.length > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() =>
                onUpdate(question.id, {
                  selectedIds: [],
                })
              }
            >
              Clear answer
            </button>
          )}

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() =>
              onNavigate(currentIndex - 1)
            }
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              currentIndex >= totalQuestions - 1
            }
            onClick={() =>
              onNavigate(currentIndex + 1)
            }
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}