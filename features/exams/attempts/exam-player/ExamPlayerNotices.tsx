"use client"

import {
  AlertCircle,
  Clock3,
  Info,
  Loader2,
  RotateCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = {
  isActive: boolean
  status: string
  remaining: number
  expiring: boolean
  submitting: boolean
  submissionError: string | null
  correctionNotice: boolean
  onDismissCorrection: () => void
  onRetryExpiry: () => Promise<void>
  onViewCompletion: () => void
}

export function ExamPlayerNotices({
  isActive,
  status,
  remaining,
  expiring,
  submitting,
  submissionError,
  correctionNotice,
  onDismissCorrection,
  onRetryExpiry,
  onViewCompletion,
}: Props) {
  const deadlineReached =
    status === "expired" ||
    (status === "in_progress" && remaining === 0)

  return (
    <div className="space-y-3">
      {correctionNotice && isActive && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <p className="text-sm">
              Your examiner updated some question
              wording. Your saved answers are unchanged.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDismissCorrection}
          >
            Dismiss
          </Button>
        </div>
      )}

      {deadlineReached && (
        <div
          role="status"
          className="space-y-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-2.5">
            {expiring || submitting ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-amber-600" />
            ) : (
              <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" />
            )}

            <div>
              <p className="text-sm font-semibold">
                {expiring
                  ? "Finalizing your examination"
                  : submitting
                    ? "Processing submission"
                    : "Examination time has ended"}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your examination is no longer accepting
                answers. The server will grade answers
                saved before the deadline.
              </p>
            </div>
          </div>

          {submissionError && (
            <p
              role="alert"
              className="flex items-start gap-2 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              {submissionError}
            </p>
          )}

          {!expiring && !submitting && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onRetryExpiry()}
            >
              <RotateCw className="size-4" />
              Retry finalization
            </Button>
          )}
        </div>
      )}

      {!deadlineReached &&
        !isActive &&
        status !== "in_progress" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">
              This attempt is no longer accepting answers.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewCompletion}
            >
              View examination status
            </Button>
          </div>
        )}
    </div>
  )
}