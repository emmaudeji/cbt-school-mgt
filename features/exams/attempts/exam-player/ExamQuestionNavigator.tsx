"use client"

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react"

import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExamQuestion } from "../services/attempt-player"
import { answerFingerprint, PlayerDraft } from "./useExamPlayerController"

 
type Props = {
  questions: ExamQuestion[]
  drafts: Record<string, PlayerDraft>
  currentIndex: number
  isActive: boolean
  canSubmit: boolean
  submitting: boolean
  answered: number
  unsaved: number
  errors: number
  submissionError: string | null
  onNavigate: (index: number) => void
  onSubmit: () => Promise<void>
}

export function ExamQuestionNavigator({
  questions,
  drafts,
  currentIndex,
  isActive,
  canSubmit,
  submitting,
  answered,
  unsaved,
  errors,
  submissionError,
  onNavigate,
  onSubmit,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Question Navigator
          </h2>

          <span className="text-xs tabular-nums text-muted-foreground">
            {answered}/{questions.length}
          </span>
        </div>

        <div
          aria-label="Question navigation"
          className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5"
        >
          {questions.map((question, index) => {
            const draft = drafts[question.id]

            const isAnswered =
              Boolean(draft?.selectedIds.length) ||
              Boolean(draft?.text.trim())

            const isUnsaved =
              !!draft &&
              answerFingerprint(
                draft.selectedIds,
                draft.text
              ) !== draft.savedFingerprint

            const isCurrent =
              currentIndex === index

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onNavigate(index)}
                aria-label={
                  `Question ${index + 1}` +
                  (isAnswered ? ", answered" : "") +
                  (isUnsaved ? ", unsaved" : "")
                }
                aria-current={
                  isCurrent ? "step" : undefined
                }
                className={[
                  "relative flex aspect-square min-h-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isAnswered
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                  isCurrent
                    ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                    : "",
                ].join(" ")}
              >
                {index + 1}

                {isUnsaved && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 size-2.5 rounded-full border border-background bg-amber-500"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
          <p>
            Filled numbers indicate answered questions.
          </p>

          <p>
            Orange dots indicate unsaved changes.
          </p>
        </div>

        <div className="border-t pt-3">
          <div className="mb-3 flex items-center gap-2 text-xs">
            {errors > 0 ? (
              <>
                <AlertCircle className="size-4 text-destructive" />
                <span className="text-destructive">
                  {errors} answer save error(s)
                </span>
              </>
            ) : unsaved > 0 ? (
              <>
                <Loader2 className="size-4 animate-spin text-amber-600" />
                <span className="text-muted-foreground">
                  {unsaved} answer(s) waiting to save
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-muted-foreground">
                  All answers saved
                </span>
              </>
            )}
          </div>

          {isActive && (
            <AlertDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                if (!submitting) {
                  setDialogOpen(open)
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canSubmit}
                >
                  <Send className="size-4" />
                  Submit Examination
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Submit examination?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    {questions.length - answered > 0
                      ? `You have ${
                          questions.length - answered
                        } unanswered question(s).`
                      : "You have answered every question."}
                    {" "}
                    Once submitted, your answers cannot
                    be changed.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {submissionError && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {submissionError}
                  </p>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={submitting}
                  >
                    Continue Examination
                  </AlertDialogCancel>

                  <AlertDialogAction
                    disabled={!canSubmit}
                    onClick={(event) => {
                      event.preventDefault()
                      void onSubmit()
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {submitting
                      ? "Submitting..."
                      : "Confirm Submission"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {submissionError && isActive && (
            <p
              role="alert"
              className="mt-2 text-xs text-destructive"
            >
              {submissionError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}