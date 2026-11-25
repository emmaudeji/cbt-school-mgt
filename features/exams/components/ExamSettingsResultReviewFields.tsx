
"use client"

import { BookOpenCheck, Eye, ShieldAlert, Trophy } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type ResultReviewValues = {
  showResultAfterSubmission: boolean
  allowExamReview: boolean
  reviewRelease: "after_close" | "after_submission"
}

type Props = {
  value: ResultReviewValues
  onChange: (value: ResultReviewValues) => void
  disabled: boolean
  maxAttempts: number
  isSchoolExam: boolean
}

export function ExamResultReviewFields({
  value, onChange, disabled, maxAttempts, isSchoolExam,
}: Props) {
  const update = (patch: Partial<ResultReviewValues>) =>
    onChange({ ...value, ...patch })

  const person = isSchoolExam ? "students" : "candidates"

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-emerald-500/10 px-4 py-3">
        <BookOpenCheck className="size-4 text-emerald-600" />
        <h3 className="text-sm font-bold">Results & Answer Review</h3>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border bg-emerald-500/5 p-3">
          <span className="space-y-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="size-4 text-emerald-600" />
              Show Marks After Submission
            </span>
            <span className="block text-xs leading-5 text-foreground/80">
              Let {person} see their marks after grading.
            </span>
          </span>
          <Checkbox checked={value.showResultAfterSubmission}
            onCheckedChange={v => update({ showResultAfterSubmission: v === true })}
            disabled={disabled} className="mt-0.5" />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border bg-emerald-500/5 p-3">
          <span className="space-y-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="size-4 text-emerald-600" />
              Allow Answer Review
            </span>
            <span className="block text-xs leading-5 text-foreground/80">
              Show submitted answers, corrections and explanations.
            </span>
          </span>
          <Checkbox checked={value.allowExamReview}
            onCheckedChange={v => update({ allowExamReview: v === true })}
            disabled={disabled} className="mt-0.5" />
        </label>

        {value.allowExamReview && (
          <div className="space-y-3 rounded-lg border p-3 sm:col-span-2">
            <p className="text-sm font-semibold">When should corrections be available?</p>
            <RadioGroup value={value.reviewRelease}
              onValueChange={v => update({
                reviewRelease: v as ResultReviewValues["reviewRelease"],
              })}
              disabled={disabled} className="grid gap-2 sm:grid-cols-2">

              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                value.reviewRelease === "after_close"
                  ? "border-emerald-500 bg-emerald-500/10" : "bg-background"
              }`}>
                <RadioGroupItem value="after_close" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold">After Closing</span>
                  <span className="block text-xs text-foreground/80">
                    {isSchoolExam ? "Recommended for school examinations" : "Useful for scored tests"}
                  </span>
                </span>
              </label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                value.reviewRelease === "after_submission"
                  ? "border-amber-500 bg-amber-500/10" : "bg-background"
              }`}>
                <RadioGroupItem value="after_submission" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold">After Submission</span>
                  <span className="block text-xs text-foreground/80">
                    Useful for practice and revision
                  </span>
                </span>
              </label>
            </RadioGroup>

            {value.reviewRelease === "after_submission" && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                {maxAttempts > 1
                  ? "Immediate corrections can reveal answers before later attempts."
                  : isSchoolExam
                    ? "Students may share corrections while others are still taking the examination."
                    : "Answers may become available before the test closes."}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
