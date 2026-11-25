
"use client"

import { CalendarClock, FileCheck2, Info, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  pending: boolean
  isPublished: boolean
  isSchoolExam: boolean
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
  return Number.isNaN(date.getTime()) ? "Invalid date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium", timeStyle: "short",
      }).format(date)
}

export function ExamSettingsSaveDialog({
  open, onOpenChange, onConfirm, pending, isPublished, isSchoolExam,
  durationMinutes, availableFrom, availableUntil,
  showResultAfterSubmission, allowExamReview, reviewRelease,
}: Props) {
  const noun = isSchoolExam ? "examination" : "test"

  return (
    <AlertDialog open={open} onOpenChange={v => !pending && onOpenChange(v)}>
      <AlertDialogContent className="max-w-md gap-4 shadow-none">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FileCheck2 className="size-5 text-blue-600" />
          </div>
          <AlertDialogTitle>
            {isPublished ? "Save for Next Revision?" : "Confirm Settings"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-foreground/75">
            Review the settings before saving your {noun}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold">
              <CalendarClock className="size-4 text-sky-600" /> Schedule
            </p>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="text-foreground/70">Opens</p>
                <p className="mt-1 font-semibold">{formatDate(availableFrom)}</p>
              </div>
              <div>
                <p className="text-foreground/70">Closes</p>
                <p className="mt-1 font-semibold">{formatDate(availableUntil)}</p>
              </div>
            </div>
            <p className="mt-3 border-t pt-2 text-xs font-semibold">
              Duration: {durationMinutes} minute(s)
            </p>
          </div>

          <div className="rounded-lg border p-3 text-xs leading-5">
            <p className="font-bold">Results & Corrections</p>
            <p className="mt-1">
              Marks: {showResultAfterSubmission ? "Visible after grading" : "Hidden"}
            </p>
            <p>
              Corrections: {!allowExamReview ? "Disabled" :
                reviewRelease === "after_close" ? "After closing" : "After submission"}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-5">
              {isPublished
                ? "Existing published attempts remain unchanged. Publish a new revision to apply these settings."
                : `Saving does not publish the ${noun}. Publication is a separate step.`}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="shadow-none">
            Go Back
          </AlertDialogCancel>
          <Button type="button" disabled={pending} onClick={onConfirm} className="shadow-none">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {pending ? "Saving..." : "Confirm Save"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
