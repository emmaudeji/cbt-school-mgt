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
  onChange: (next: ResultReviewValues) => void
  disabled: boolean
  maxAttempts: number
}

export function ExamResultReviewFields({ value, onChange, disabled, maxAttempts }: Props) {
  const update = (patch: Partial<ResultReviewValues>) => onChange({ ...value, ...patch })

  return (
    <section className="overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035]">
      <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/10 px-4 py-3">
        <BookOpenCheck className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Results & Review</h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-background p-3">
          <div className="space-y-1">
            <Label htmlFor="cbt-show-result" className="flex cursor-pointer items-center gap-2 font-semibold">
              <Trophy className="size-4 text-primary" />
              Show result after submission
            </Label>
            <p className="text-sm leading-5 text-foreground/80">
              Let candidates see their final marks after grading is complete.
            </p>
          </div>
          <Checkbox id="cbt-show-result" checked={value.showResultAfterSubmission} onCheckedChange={(checked) => update({ showResultAfterSubmission: checked === true })} disabled={disabled} className="mt-0.5" />
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-background p-3">
          <div className="space-y-1">
            <Label htmlFor="cbt-allow-review" className="flex cursor-pointer items-center gap-2 font-semibold">
              <Eye className="size-4 text-primary" />
              Allow examination review
            </Label>
            <p className="text-sm leading-5 text-foreground/80">
              Show submitted answers, corrections and explanations after the permitted release time.
            </p>
          </div>
          <Checkbox id="cbt-allow-review" checked={value.allowExamReview} onCheckedChange={(checked) => update({ allowExamReview: checked === true })} disabled={disabled} className="mt-0.5" />
        </div>
        {value.allowExamReview && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-background p-3 sm:col-span-2">
            <p className="text-sm font-semibold">When should candidates see corrections?</p>
            <RadioGroup value={value.reviewRelease} onValueChange={(next) => update({ reviewRelease: next as ResultReviewValues["reviewRelease"] })} disabled={disabled} className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <RadioGroupItem value="after_close" id="review-after-close" className="mt-0.5" />
                <Label htmlFor="review-after-close" className="cursor-pointer space-y-1">
                  <span className="block font-semibold">After the examination closes</span>
                  <span className="block text-sm font-normal text-foreground/80">Recommended for scored examinations</span>
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <RadioGroupItem value="after_submission" id="review-after-submit" className="mt-0.5" />
                <Label htmlFor="review-after-submit" className="cursor-pointer space-y-1">
                  <span className="block font-semibold">Immediately after submission</span>
                  <span className="block text-sm font-normal text-foreground/80">Helpful for practice and revision</span>
                </Label>
              </div>
            </RadioGroup>
            {value.reviewRelease === "after_submission" && maxAttempts > 1 && (
              <p className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm leading-5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                Early corrections may give candidates an advantage on later attempts.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
