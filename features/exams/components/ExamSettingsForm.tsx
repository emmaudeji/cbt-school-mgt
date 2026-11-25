
"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2, Save, Settings2, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"

import { urls } from "@/constants"
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

type Props = {
  exam: ExamSettings
  isSchoolExam: boolean
  resultSettings: {
    show_result_after_submission: boolean
    allow_exam_review: boolean
    review_release: "after_close" | "after_submission"
  }
}

function toLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16)
}

function toIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const box = "overflow-hidden rounded-xl border bg-card"
const field = "h-10 bg-background shadow-none"

export function ExamSettingsForm({ exam, resultSettings, isSchoolExam }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const editable = exam.status === "draft" || exam.status === "active"
  const published = exam.status === "active"
  const noun = isSchoolExam ? "examination" : "test"
  const person = isSchoolExam ? "student" : "candidate"

  const [title, setTitle] = useState(exam.title)
  const [description, setDescription] = useState(exam.description ?? "")
  const [instructions, setInstructions] = useState(exam.instructions ?? "")
  const [duration, setDuration] = useState(Math.round((exam.duration_seconds ?? 3600) / 60))
  const [from, setFrom] = useState(toLocal(exam.available_from))
  const [until, setUntil] = useState(toLocal(exam.available_until))
  const [attempts, setAttempts] = useState(exam.max_attempts ?? 1)
  const [shuffleQuestions, setShuffleQuestions] = useState(exam.shuffle_questions ?? true)
  const [shuffleOptions, setShuffleOptions] = useState(exam.shuffle_options ?? true)
  const [results, setResults] = useState<ResultReviewValues>({
    showResultAfterSubmission: resultSettings.show_result_after_submission,
    allowExamReview: resultSettings.allow_exam_review,
    reviewRelease: resultSettings.review_release,
  })

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !editable) return

    if (title.trim().length < 2 || title.trim().length > 200) {
      toast.error("Enter a title between 2 and 200 characters.")
      return
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      toast.error("Duration must be between 1 and 1,440 minutes.")
      return
    }
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 100) {
      toast.error("Maximum attempts must be between 1 and 100.")
      return
    }
    if ((from && !toIso(from)) || (until && !toIso(until))) {
      toast.error("Enter valid dates and times.")
      return
    }
    if (from && until && new Date(until) <= new Date(from)) {
      toast.error("Closing time must be later than the opening time.")
      return
    }

    setConfirmOpen(true)
  }

  function confirmSave() {
    if (pending || !editable) return

    const input: ExamSettingsInput = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      durationMinutes: duration,
      availableFrom: toIso(from),
      availableUntil: toIso(until),
      maxAttempts: attempts,
      shuffleQuestions,
      shuffleOptions,
      showResultAfterSubmission: results.showResultAfterSubmission,
      allowExamReview: results.allowExamReview,
      reviewRelease: results.reviewRelease,
    }

    startTransition(async () => {
      try {
        const response = await saveExamSettingsAction(exam.id, exam.slug, input)
        if (!response.success) {
          toast.error(response.error ?? "Unable to save settings.")
          return
        }
        setConfirmOpen(false)
        toast.success(published
          ? "Settings saved for the next revision."
          : `${isSchoolExam ? "Examination" : "Test"} settings saved.`)
        router.push(urls.examPublish(exam.slug))
        router.refresh()
      } catch (error) {
        console.error("[CBT:SAVE_SETTINGS]", error)
        toast.error("Unable to save settings.")
      }
    })
  }

  return (
    <>
      <form onSubmit={save} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold">Configure {isSchoolExam ? "Examination" : "Test"}</h2>
          <Badge variant="outline" className={published
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}>
            {published ? "Published" : exam.status}
          </Badge>
        </div>

        {published && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs leading-5">
            <strong>Editing the next revision.</strong> Current published attempts retain their sealed settings.
            Publish a new revision to release your changes.
          </div>
        )}
        {!editable && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            This {noun} cannot currently be edited.
          </p>
        )}

        <section className={box}>
          <div className="flex items-center gap-2 border-b bg-blue-500/10 px-4 py-3">
            <BookOpen className="size-4 text-blue-600" />
            <h3 className="text-sm font-bold">General Information</h3>
          </div>
          <div className="grid gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="exam-title" className="font-semibold">{isSchoolExam ? "Examination" : "Test"} Title</Label>
              <Input id="exam-title" required minLength={2} maxLength={200}
                value={title} onChange={e => setTitle(e.target.value)}
                disabled={!editable || pending} className={field} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-description" className="font-semibold">Description (optional)</Label>
              <Textarea id="exam-description" rows={2} maxLength={1000}
                value={description} onChange={e => setDescription(e.target.value)}
                disabled={!editable || pending} className="min-h-16 shadow-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-instructions" className="font-semibold">
                Instructions for {isSchoolExam ? "Students" : "Candidates"}
              </Label>
              <Textarea id="exam-instructions" rows={2}
                value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder={`Read each question carefully. Submit before the ${noun} closes.`}
                disabled={!editable || pending} className="min-h-20 shadow-none" />
            </div>
          </div>
        </section>

        <ExamScheduleFields
          durationMinutes={duration} onDurationChange={setDuration}
          availableFrom={from} onAvailableFromChange={setFrom}
          availableUntil={until} onAvailableUntilChange={setUntil}
          disabled={!editable || pending} isPublished={published}
          isSchoolExam={isSchoolExam}
        />

        <section className={box}>
          <div className="flex items-center gap-2 border-b bg-violet-500/10 px-4 py-3">
            <Settings2 className="size-4 text-violet-600" />
            <h3 className="text-sm font-bold">Attempts & Question Delivery</h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exam-attempts" className="font-semibold">
                Maximum Attempts per {isSchoolExam ? "Student" : "Candidate"}
              </Label>
              <Input id="exam-attempts" type="number" min={1} max={100} step={1}
                required value={attempts} onChange={e => setAttempts(Number(e.target.value))}
                disabled={!editable || pending} className={`${field} max-w-40`} />
              {isSchoolExam && attempts > 1 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Formal school examinations usually allow one attempt.
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-violet-500/5 p-3">
              <Checkbox checked={shuffleQuestions} onCheckedChange={v => setShuffleQuestions(v === true)}
                disabled={!editable || pending} className="mt-0.5" />
              <span>
                <span className="block text-sm font-semibold">Shuffle Questions</span>
                <span className="text-xs text-foreground/80">Randomize question order for each {person}.</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-violet-500/5 p-3">
              <Checkbox checked={shuffleOptions} onCheckedChange={v => setShuffleOptions(v === true)}
                disabled={!editable || pending} className="mt-0.5" />
              <span>
                <span className="block text-sm font-semibold">Shuffle Answer Options</span>
                <span className="text-xs text-foreground/80">Randomize the display order of A–D choices.</span>
              </span>
            </label>
          </div>
        </section>

        <ExamResultReviewFields value={results} onChange={setResults}
          disabled={!editable || pending} maxAttempts={attempts}
          isSchoolExam={isSchoolExam} />

        {editable && (
          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-xs font-medium text-foreground/80">
              <ShieldCheck className="size-4 text-emerald-600" />
              {published ? "Changes require a new publication." : "Save settings before publishing."}
            </p>
            <Button type="submit" disabled={pending} className="shadow-none">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {pending ? "Saving..." : published ? "Save Next Revision" : "Save Settings"}
            </Button>
          </div>
        )}
      </form>

      <ExamSettingsSaveDialog
        open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={confirmSave}
        pending={pending} isPublished={published} isSchoolExam={isSchoolExam}
        durationMinutes={duration} availableFrom={from} availableUntil={until}
        showResultAfterSubmission={results.showResultAfterSubmission}
        allowExamReview={results.allowExamReview}
        reviewRelease={results.reviewRelease}
      />
    </>
  )
}
