
"use client"

import {
  CalendarClock,
  FileCheck2,
  Info,
  Loader2,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  pending: boolean
  isPublished: boolean
  durationMinutes: number
  availableFrom: string
  availableUntil: string
  showResultAfterSubmission: boolean
  allowExamReview: boolean
  reviewRelease: "after_close" | "after_submission"
}

function formatDate(value: string) {
  if (!value) return "Not set"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Invalid date"

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function ExamSettingsSaveDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
  isPublished,
  durationMinutes,
  availableFrom,
  availableUntil,
  showResultAfterSubmission,
  allowExamReview,
  reviewRelease,
}: Props) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value)
      }}
    >
      <AlertDialogContent className="max-w-lg gap-4 border-primary/25 shadow-none">
        <AlertDialogHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <FileCheck2 className="size-5 text-primary" />
          </div>

          <AlertDialogTitle className="text-lg">
            {isPublished
              ? "Save changes for a new revision?"
              : "Save examination settings?"}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-sm leading-6 text-foreground/75">
            Review the important details before saving.
            {isPublished
              ? " These changes will not affect the examination candidates are currently taking."
              : " Saving your settings does not publish the examination."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <p className="text-sm font-semibold">
                Examination schedule
              </p>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-foreground/65">
                  Candidates can start
                </p>
                <p className="mt-1 font-semibold">
                  {formatDate(availableFrom)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-foreground/65">
                  Examination closes
                </p>
                <p className="mt-1 font-semibold">
                  {formatDate(availableUntil)}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-primary/15 pt-3 text-sm">
              <p>
                <span className="font-semibold">
                  Time allowed:
                </span>{" "}
                {durationMinutes} minute(s) per attempt
              </p>

              <p className="mt-1 text-xs leading-5 text-foreground/75">
                The closing time is the final deadline.
                Candidates who start late may have less than
                the full allotted duration.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-primary/15 p-3">
            <p className="text-sm font-semibold">
              Results and corrections
            </p>

            <p className="mt-1 text-xs leading-5 text-foreground/80">
              Results:{" "}
              <span className="font-medium">
                {showResultAfterSubmission
                  ? "Visible when grading is complete"
                  : "Hidden from candidates"}
              </span>
            </p>

            <p className="text-xs leading-5 text-foreground/80">
              Corrections:{" "}
              <span className="font-medium">
                {!allowExamReview
                  ? "Not available"
                  : reviewRelease === "after_close"
                    ? "Available after the examination closes"
                    : "Available after submission"}
              </span>
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {isPublished
                  ? "A new revision must be published"
                  : "Publishing is a separate step"}
              </p>

              <p className="text-xs leading-5 text-foreground/85">
                {isPublished
                  ? "Saving updates the editable examination settings only. Your current published revision, candidate links, existing attempts and results remain unchanged. Publish a new revision when you want to release these changes; candidate access to that revision must then be configured."
                  : "These settings will remain in draft until you publish the examination. Candidates cannot take the new examination simply because its settings have been saved."}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={pending}>
            Go Back
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {pending ? "Saving..." : "Confirm Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
