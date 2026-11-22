"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2, Save, Settings2, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ExamSettings, ExamSettingsInput } from "@/types/exam-settings"
import { saveExamSettingsAction } from "../services/action"
import { ExamScheduleFields } from "./ExamScheduleFields"
import { ExamResultReviewFields, type ResultReviewValues } from "./ExamSettingsResultReviewFields"
import { ExamSettingsSaveDialog } from "./ExamSettingsSaveDialog"
import { urls } from "@/constants"

type Props = {
  exam: ExamSettings
  resultSettings: {
    show_result_after_submission: boolean
    allow_exam_review: boolean
    review_release: "after_close" | "after_submission"
  }
}

function toLocalInput(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function toIsoDate(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const sectionClass = "overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035]"
const sectionHeaderClass = "flex items-center gap-2 border-b border-primary/15 bg-primary/10 px-4 py-3"

export function ExamSettingsForm({ exam, resultSettings }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const editable = exam.status === "draft" || exam.status === "active"
  const isPublished = exam.status === "active"
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const [title, setTitle] = useState(exam.title)
  const [description, setDescription] = useState(exam.description ?? "")
  const [instructions, setInstructions] = useState(exam.instructions ?? "")
  const [durationMinutes, setDurationMinutes] = useState(Math.round((exam.duration_seconds ?? 3600) / 60))
  const [availableFrom, setAvailableFrom] = useState(toLocalInput(exam.available_from))
  const [availableUntil, setAvailableUntil] = useState(toLocalInput(exam.available_until))
  const [maxAttempts, setMaxAttempts] = useState(exam.max_attempts ?? 1)
  const [shuffleQuestions, setShuffleQuestions] = useState(exam.shuffle_questions ?? true)
  const [shuffleOptions, setShuffleOptions] = useState(exam.shuffle_options ?? true)
  const [results, setResults] = useState<ResultReviewValues>({
    showResultAfterSubmission: resultSettings.show_result_after_submission,
    allowExamReview: resultSettings.allow_exam_review,
    reviewRelease: resultSettings.review_release,
  })


  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (pending || !editable) return

    const from = toIsoDate(availableFrom)
    const until = toIsoDate(availableUntil)

    if (
      (availableFrom && !from) ||
      (availableUntil && !until)
    ) {
      toast.error("Enter valid examination dates and times.")
      return
    }

    if (
      from &&
      until &&
      new Date(until) <= new Date(from)
    ) {
      toast.error(
        "The examination must close after candidates are allowed to start."
      )
      return
    }

    setSaveDialogOpen(true)
  }

  const confirmSave = () => {
    if (pending || !editable) return

    const input: ExamSettingsInput = {
      title,
      description,
      instructions,
      durationMinutes,
      availableFrom: toIsoDate(availableFrom),
      availableUntil: toIsoDate(availableUntil),
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResultAfterSubmission: results.showResultAfterSubmission,
      allowExamReview: results.allowExamReview,
      reviewRelease: results.reviewRelease,
    }

    startTransition(async () => {
      try {
        const response = await saveExamSettingsAction(
          exam.id,
          exam.slug,
          input
        )

        if (!response.success) {
          toast.error(
            response.error ?? "Unable to save examination settings."
          )
          return
        }

        setSaveDialogOpen(false)

        toast.success(
          isPublished
            ? "Settings saved for the next revision. The current examination is unchanged."
            : "Examination settings saved. Publish when you are ready."
        )

        // router.refresh()
        router.push(urls.examPublish(exam.slug))
        
      } catch (error) {
        console.error("[CBT:SAVE_SETTINGS]", error)

        toast.error("Unable to save examination settings.")
      }
    })
  }


  return (
<>
    <form onSubmit={save} className="space-y-3 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Examination Settings</h2>
          <p className="text-sm text-foreground/85">Manage the exam schedule, delivery and results.</p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-foreground capitalize shadow-none">
          {exam.status === "active" ? "Published" : exam.status}
        </Badge>
      </div>

      {isPublished && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold">Editing settings for a future revision</p>
          <p className="mt-1 text-sm leading-5 text-foreground/85">
            Your published examination is still in use. Saving changes the editable blueprint only.
            Candidates on the existing sealed revision keep its original schedule, duration and rules.
            You must publish a new revision for changes to take effect.
          </p>
        </div>
      )}

      {!editable && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          This examination is archived. Restore it before changing settings.
        </div>
      )}

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <BookOpen className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">General Information</h3>
        </div>
        <div className="grid gap-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="exam-title">Examination title</Label>
            <Input id="exam-title" required minLength={2} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} disabled={!editable || pending} className="border-primary/25 bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exam-description">Description</Label>
            <Textarea id="exam-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} disabled={!editable || pending} placeholder="What is this examination about?" className="border-primary/25 bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exam-instructions">Instructions for candidates</Label>
            <Textarea id="exam-instructions" rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={!editable || pending} placeholder="Read each question carefully before you answer." className="border-primary/25 bg-background" />
          </div>
        </div>
      </section>

      <ExamScheduleFields
        durationMinutes={durationMinutes}
        onDurationChange={setDurationMinutes}
        availableFrom={availableFrom}
        onAvailableFromChange={setAvailableFrom}
        availableUntil={availableUntil}
        onAvailableUntilChange={setAvailableUntil}
        disabled={!editable || pending}
        isPublished={isPublished}
      />

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <Settings2 className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Attempts and Question Delivery</h3>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="exam-attempts">Maximum attempts per candidate</Label>
            <Input id="exam-attempts" type="number" min={1} max={100} step={1} required value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} disabled={!editable || pending} className="max-w-44 border-primary/25 bg-background" />
          </div>
          <label htmlFor="shuffle-questions" className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/20 bg-background p-3">
            <Checkbox id="shuffle-questions" checked={shuffleQuestions} onCheckedChange={(checked) => setShuffleQuestions(checked === true)} disabled={!editable || pending} className="mt-0.5" />
            <span className="space-y-1">
              <span className="block text-sm font-semibold">Shuffle questions</span>
              <span className="block text-sm text-foreground/80">Change the question order for each candidate.</span>
            </span>
          </label>
          <label htmlFor="shuffle-options" className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/20 bg-background p-3">
            <Checkbox id="shuffle-options" checked={shuffleOptions} onCheckedChange={(checked) => setShuffleOptions(checked === true)} disabled={!editable || pending} className="mt-0.5" />
            <span className="space-y-1">
              <span className="block text-sm font-semibold">Shuffle answer options</span>
              <span className="block text-sm text-foreground/80">Change the order of selectable options for each candidate.</span>
            </span>
          </label>
        </div>
      </section>

      <ExamResultReviewFields value={results} onChange={setResults} disabled={!editable || pending} maxAttempts={maxAttempts} />

      {editable && (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-background/95 px-4 py-3 backdrop-blur-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground/85">
            <ShieldCheck className="size-4 text-primary" />
            {isPublished ? "Save changes, then publish a new revision." : "Save settings before publishing."}
          </p>
          <Button type="submit" disabled={pending} className="shadow-none">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {pending
              ? "Saving..."
              : isPublished
                ? "Save for Next Revision"
                : "Save Settings"}
          </Button>
        </div>
      )}
    </form>


    <ExamSettingsSaveDialog
      open={saveDialogOpen}
      onOpenChange={setSaveDialogOpen}
      onConfirm={confirmSave}
      pending={pending}
      isPublished={isPublished}
      durationMinutes={durationMinutes}
      availableFrom={availableFrom}
      availableUntil={availableUntil}
      showResultAfterSubmission={
        results.showResultAfterSubmission
      }
      allowExamReview={results.allowExamReview}
      reviewRelease={results.reviewRelease}
    />
 
</>
  )
}

