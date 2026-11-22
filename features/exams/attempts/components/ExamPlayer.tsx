"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RotateCw,
  Send,
} from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import type {
  ExamPlayerData,
  ExamQuestion,
} from "../services/attempt-player"
import { saveExamAnswerAction } from "../services/save-answer-action"
import { submitExamAttemptAction } from "../services/submit-exam-action"
import { getLiveQuestionCorrectionsAction, LiveQuestionCorrection } from "../services/getLiveQuestionCorrectionsAction"
 

type Draft = {
  selectedIds: string[]
  text: string
  revision: number
  savedFingerprint: string
  saving: boolean
  error: string | null
}

type Props = {
  code: string
  attemptId: string
  candidateName: string
  data: ExamPlayerData
}

function fingerprint(selectedIds: string[], text: string) {
  return JSON.stringify([selectedIds.slice().sort(), text])
}

function minutesSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function initialDrafts(questions: ExamQuestion[]): Record<string, Draft> {
  return Object.fromEntries(questions.map((question) => {
    const selectedIds = question.answer.selected_ids ?? []
    const text = question.answer.text ?? ""

    return [question.id, {
      selectedIds,
      text,
      revision: question.answer.revision ?? 0,
      savedFingerprint: fingerprint(selectedIds, text),
      saving: false,
      error: null,
    }]
  }))
}

export function ExamPlayer({ code, attemptId, candidateName, data }: Props) {
  const router = useRouter()
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [liveCorrections, setLiveCorrections] = useState<Record<string, LiveQuestionCorrection>>({})
  const [correctionNotice, setCorrectionNotice] = useState(false)
  const correctionSignatureRef = useRef("[]")
  const questions = useMemo(() => {
    return (data.questions ?? []).map((question) => {
      const patch = liveCorrections[question.id]
      if (!patch) return question
      const optionText = new Map(patch.options.map((option) => [option.id, option.text]))
      return {
        ...question,
        prompt: patch.prompt,
        options: question.options.map((option) => ({
          ...option,
          text: optionText.get(option.id) ?? option.text,
        })),
      }
    })
  }, [data.questions, liveCorrections])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    () => initialDrafts(questions)
  )
  const [retryTick, setRetryTick] = useState(0)
  const savingRef = useRef(false)

  // Align the browser countdown with server time, not local wall-clock time.
  const timeOffsetRef = useRef(Date.parse(data.server_now) - Date.now())
  const expiryMs = data.expires_at ? Date.parse(data.expires_at) : 0
  const [remaining, setRemaining] = useState(() => Math.max(
    0,
    Math.ceil((expiryMs - (Date.now() + timeOffsetRef.current)) / 1000)
  ))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(
        0,
        Math.ceil((expiryMs - (Date.now() + timeOffsetRef.current)) / 1000)
      ))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [expiryMs])

  // The background expiry worker is authoritative. The browser only
  // routes away after the official deadline; it never claims to score.
  useEffect(() => {
    if (data.status === "in_progress" && remaining === 0) {
      router.replace(`/take/${code}/attempt/${attemptId}/complete`)
    }
  }, [code, attemptId, data.status, remaining, router])

  // Lightweight corrections only. Never replace the answer state, option IDs,
  // original question order, or the immutable attempt snapshot.
  useEffect(() => {
    if (data.status !== "in_progress") return

    let cancelled = false
    let inFlight = false

    const refreshCorrections = async () => {
      if (cancelled || inFlight || document.visibilityState === "hidden") return
      inFlight = true
      try {
        const result = await getLiveQuestionCorrectionsAction(code, attemptId)
        if (cancelled || !result.success) return

        const next = Object.fromEntries(
          result.corrections.map((correction) => [correction.id, correction])
        )
        const nextSignature = JSON.stringify(
          result.corrections.map((item) => [item.id, item.updated_at]).sort()
        )
        if (correctionSignatureRef.current !== nextSignature) {
          correctionSignatureRef.current = nextSignature
          setLiveCorrections(next)
          setCorrectionNotice(true)
        }
      } catch {
        // Network interruption should never block exam taking or autosaving.
      } finally {
        inFlight = false
      }
    }

    void refreshCorrections()
    const interval = window.setInterval(() => void refreshCorrections(), 12000)
    document.addEventListener("visibilitychange", refreshCorrections)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", refreshCorrections)
    }
  }, [code, attemptId, data.status])

  const isActive = data.status === "in_progress" && remaining > 0
  const current = questions[currentIndex]
  const draft = current ? drafts[current.id] : null

  const summary = useMemo(() => {
    const values = Object.values(drafts)
    return {
      answered: values.filter((value) => value.selectedIds.length > 0 || value.text.trim()).length,
      unsaved: values.filter((value) => value.saving ||
        fingerprint(value.selectedIds, value.text) !== value.savedFingerprint).length,
      errors: values.filter((value) => value.error).length,
    }
  }, [drafts])

  // Queue a single save at a time. If the candidate edits while saving,
  // only the old snapshot is acknowledged, leaving the new draft dirty.
  useEffect(() => {
    if (!isActive || savingRef.current) return

    const target = questions.find((question) => {
      const value = drafts[question.id]
      return value && !value.saving && !value.error &&
        fingerprint(value.selectedIds, value.text) !== value.savedFingerprint
    })
    if (!target) return

    const timer = window.setTimeout(async () => {
      if (savingRef.current) return

      const snapshot = drafts[target.id]
      if (!snapshot) return
      savingRef.current = true

      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [target.id]: { ...currentDrafts[target.id], saving: true },
      }))

      try {
        const result = await saveExamAnswerAction(
          code,
          attemptId,
          target.id,
          snapshot.selectedIds,
          snapshot.text,
          snapshot.revision
        )

        setDrafts((currentDrafts) => {
          const latest = currentDrafts[target.id]
          if (!latest) return currentDrafts

          return {
            ...currentDrafts,
            [target.id]: {
              ...latest,
              saving: false,
              revision: result.success && result.revision !== undefined
                ? result.revision : latest.revision,
              savedFingerprint: result.success
                ? fingerprint(snapshot.selectedIds, snapshot.text)
                : latest.savedFingerprint,
              error: result.success ? null : (result.error ?? "Save failed"),
            },
          }
        })
      } catch {
        setDrafts((currentDrafts) => ({
          ...currentDrafts,
          [target.id]: {
            ...currentDrafts[target.id],
            saving: false,
            error: "Connection interrupted. Select Retry to save this answer.",
          },
        }))
      } finally {
        savingRef.current = false
        setRetryTick((tick) => tick + 1)
      }
    }, 650)

    return () => window.clearTimeout(timer)
  }, [code, attemptId, questions, drafts, isActive, retryTick])

  useEffect(() => {
    if (summary.unsaved === 0) return

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [summary.unsaved])

  function updateDraft(id: string, value: Partial<Pick<Draft, "selectedIds" | "text">>) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        ...value,
        error: null,
      },
    }))
  }

  function toggleOption(question: ExamQuestion, optionId: string) {
    if (!isActive) return
    const existing = drafts[question.id]?.selectedIds ?? []
    const next = question.type === "multiple_choice"
      ? existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId]
      : existing.includes(optionId) ? [] : [optionId]

    updateDraft(question.id, { selectedIds: next })
  }

  async function submitExamination() {
    if (!isActive || submitting || savingRef.current || summary.unsaved > 0 || summary.errors > 0) {
      setSubmissionError("Finish saving all answers before submitting.")
      return
    }

    setSubmissionError(null)
    setSubmitting(true)
    try {
      const result = await submitExamAttemptAction(code, attemptId)
      if (!result.success) {
        setSubmissionError(result.error ?? "Unable to submit the examination")
        return
      }
      router.replace(`/take/${code}/attempt/${attemptId}/complete`)
      router.refresh()
    } catch {
      setSubmissionError("Connection interrupted. Check your submission status before retrying.")
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel = data.status === "in_progress" && remaining === 0
    ? "Time expired"
    : data.status.replaceAll("_", " ")

  return (
    <main className="min-h-screen bg-muted/20 px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 sm:px-4">
          <div className="min-w-0">
            <h1 className="font-semibold">CBT Examination</h1>
            <p className="truncate text-xs text-muted-foreground">
              {candidateName} · Attempt {data.attempt_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{statusLabel}</Badge>
            <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-lg font-semibold tabular-nums ${remaining <= 300 ? "text-destructive" : ""}`}>
              <Clock3 className="size-4" />
              {minutesSeconds(remaining)}
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
          <span>{summary.answered} of {questions.length} answered</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {summary.errors > 0 ? <AlertCircle className="size-3.5 text-destructive" /> :
              summary.unsaved > 0 ? <Loader2 className="size-3.5 animate-spin" /> :
                <CheckCircle2 className="size-3.5 text-emerald-600" />}
            {summary.errors > 0 ? "Save error" : summary.unsaved > 0 ? "Saving / unsaved changes" : "All changes saved"}
          </span>
        </div>

        {correctionNotice && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span>Your examiner has updated question wording. Your saved answers are unchanged.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => setCorrectionNotice(false)}>
              Dismiss
            </Button>
          </div>
        )}

        {!isActive && (
          <div role="status" className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            This attempt is not accepting responses. Your saved answers remain on the server.
          </div>
        )}

        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="space-y-5 p-4 sm:p-6">
              {!current ? (
                <p className="text-sm text-muted-foreground">No active questions are available for this attempt.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Question {current.number} of {questions.length}</h2>
                    <Badge variant="secondary">
                      {current.type === "multiple_choice" ? "Select all that apply" :
                        current.type === "free_text" ? "Written response" : "Select one answer"}
                    </Badge>
                  </div>

                  <p className="whitespace-pre-wrap text-base leading-7">{current.prompt}</p>

                  {current.type === "free_text" ? (
                    <div className="space-y-2">
                      <Textarea
                        value={draft?.text ?? ""}
                        onChange={(event) => updateDraft(current.id, { text: event.target.value })}
                        disabled={!isActive || submitting}
                        maxLength={5000}
                        rows={6}
                        placeholder="Type your answer here"
                      />
                      <p className="text-right text-xs text-muted-foreground">{draft?.text.length ?? 0} / 5000</p>
                    </div>
                  ) : (
                    <fieldset className="space-y-2" disabled={!isActive || submitting}>
                      <legend className="sr-only">Select your answer</legend>
                      {current.options.map((option) => {
                        const checked = draft?.selectedIds.includes(option.id) ?? false
                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"} ${!isActive ? "cursor-not-allowed opacity-70" : ""}`}
                          >
                            <input
                              type={current.type === "multiple_choice" ? "checkbox" : "radio"}
                              name={`question-${current.id}`}
                              checked={checked}
                              onChange={() => toggleOption(current, option.id)}
                              disabled={!isActive || submitting}
                              className="mt-1 size-4 accent-primary"
                            />
                            <span className="whitespace-pre-wrap text-sm leading-6">{option.text}</span>
                          </label>
                        )
                      })}
                    </fieldset>
                  )}

                  {draft?.error && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 p-3 text-xs text-destructive">
                      <span>{draft.error}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!isActive || draft.saving || submitting}
                        onClick={() => {
                          setDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [current.id]: { ...currentDrafts[current.id], error: null },
                          }))
                          setRetryTick((tick) => tick + 1)
                        }}
                      >
                        <RotateCw className="size-3.5" /> Retry
                      </Button>
                    </div>
                  )}

                  {isActive && current.type !== "free_text" && (draft?.selectedIds.length ?? 0) > 0 && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline underline-offset-4"
                      onClick={() => updateDraft(current.id, { selectedIds: [] })}
                    >
                      Clear answer
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={currentIndex >= questions.length - 1}
                      onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="space-y-3 p-3">
              <h3 className="text-sm font-semibold">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const answer = drafts[question.id]
                  const answered = (answer?.selectedIds.length ?? 0) > 0 || Boolean(answer?.text.trim())
                  const unsaved = !!answer && fingerprint(answer.selectedIds, answer.text) !== answer.savedFingerprint
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to question ${index + 1}${answered ? ", answered" : ""}`}
                      aria-current={currentIndex === index ? "step" : undefined}
                      className={`relative flex aspect-square items-center justify-center rounded-md border text-xs font-medium ${currentIndex === index ? "ring-2 ring-primary ring-offset-1" : ""} ${answered ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                    >
                      {index + 1}
                      {unsaved && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-500" />}
                    </button>
                  )
                })}
              </div>
              <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                <p>Filled = answered</p>
                <p>Orange dot = unsaved change</p>
                <p>Answers save automatically while the attempt is active.</p>
                <p className="pt-1">Finish all pending saves before submission.</p>
              </div>
              {isActive && (
                <div className="space-y-2 border-t pt-3">
                  <AlertDialog
                    open={submitDialogOpen}
                    onOpenChange={(open) => {
                      if (!submitting) {
                        setSubmitDialogOpen(open)
                      }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full"
                        disabled={
                          submitting ||
                          savingRef.current ||
                          summary.unsaved > 0 ||
                          summary.errors > 0
                        }
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
                          {questions.length - summary.answered > 0
                            ? `You have ${questions.length - summary.answered} unanswered question(s). You can still submit, but those questions will remain unanswered.`
                            : "You have answered every question."}
                          {" "}Once submitted, your answers cannot be changed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {submissionError && (
                        <p role="alert" className="text-sm text-destructive">
                          {submissionError}
                        </p>
                      )}

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>
                          Continue Examination
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={
                            submitting ||
                            savingRef.current ||
                            summary.unsaved > 0 ||
                            summary.errors > 0
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            void submitExamination()
                          }}
                        >
                          {submitting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                          {submitting ? "Submitting..." : "Confirm Submission"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {submissionError && (
                    <p role="alert" className="text-xs text-destructive">{submissionError}</p>
                  )}
                  {summary.unsaved > 0 && (
                    <p className="text-xs text-muted-foreground">Waiting for {summary.unsaved} unsaved question(s)</p>
                  )}
                </div>
              )}
              {correctionNotice && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span>Your examiner has updated question wording. Your saved answers are unchanged.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => setCorrectionNotice(false)}>
              Dismiss
            </Button>
          </div>
        )}

        {!isActive && (
                <Button variant="outline" type="button" className="w-full"
                  onClick={() => router.replace(`/take/${code}/attempt/${attemptId}/complete`)}>
                  View Examination Status
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// "use client"

// import { useEffect, useMemo, useRef, useState } from "react"
// import { useRouter } from "next/navigation"
// import {
//   AlertCircle,
//   CheckCircle2,
//   ChevronLeft,
//   ChevronRight,
//   Clock3,
//   Loader2,
//   RotateCw,
//   Send,
// } from "lucide-react"

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Textarea } from "@/components/ui/textarea"

// import type {
//   ExamPlayerData,
//   ExamQuestion,
// } from "../services/attempt-player"
// import { saveExamAnswerAction } from "../services/save-answer-action"
// import { submitExamAttemptAction } from "../services/submit-exam-action"

// type Draft = {
//   selectedIds: string[]
//   text: string
//   revision: number
//   savedFingerprint: string
//   saving: boolean
//   error: string | null
// }

// type Props = {
//   code: string
//   attemptId: string
//   candidateName: string
//   data: ExamPlayerData
// }

// function fingerprint(selectedIds: string[], text: string) {
//   return JSON.stringify([selectedIds.slice().sort(), text])
// }

// function minutesSeconds(totalSeconds: number) {
//   const minutes = Math.floor(totalSeconds / 60)
//   const seconds = totalSeconds % 60
//   return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
// }

// function initialDrafts(questions: ExamQuestion[]): Record<string, Draft> {
//   return Object.fromEntries(questions.map((question) => {
//     const selectedIds = question.answer.selected_ids ?? []
//     const text = question.answer.text ?? ""

//     return [question.id, {
//       selectedIds,
//       text,
//       revision: question.answer.revision ?? 0,
//       savedFingerprint: fingerprint(selectedIds, text),
//       saving: false,
//       error: null,
//     }]
//   }))
// }

// export function ExamPlayer({ code, attemptId, candidateName, data }: Props) {
//   const router = useRouter()
//   const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
//   const [submitting, setSubmitting] = useState(false)
//   const [submissionError, setSubmissionError] = useState<string | null>(null)
//   const questions = data.questions ?? []
//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [drafts, setDrafts] = useState<Record<string, Draft>>(
//     () => initialDrafts(questions)
//   )
//   const [retryTick, setRetryTick] = useState(0)
//   const savingRef = useRef(false)

//   // Align the browser countdown with server time, not local wall-clock time.
//   const timeOffsetRef = useRef(Date.parse(data.server_now) - Date.now())
//   const expiryMs = data.expires_at ? Date.parse(data.expires_at) : 0
//   const [remaining, setRemaining] = useState(() => Math.max(
//     0,
//     Math.ceil((expiryMs - (Date.now() + timeOffsetRef.current)) / 1000)
//   ))

//   useEffect(() => {
//     const timer = window.setInterval(() => {
//       setRemaining(Math.max(
//         0,
//         Math.ceil((expiryMs - (Date.now() + timeOffsetRef.current)) / 1000)
//       ))
//     }, 1000)

//     return () => window.clearInterval(timer)
//   }, [expiryMs])

//   // The background expiry worker is authoritative. The browser only
//   // routes away after the official deadline; it never claims to score.
//   useEffect(() => {
//     if (data.status === "in_progress" && remaining === 0) {
//       router.replace(`/take/${code}/attempt/${attemptId}/complete`)
//     }
//   }, [code, attemptId, data.status, remaining, router])

//   const isActive = data.status === "in_progress" && remaining > 0
//   const current = questions[currentIndex]
//   const draft = current ? drafts[current.id] : null

//   const summary = useMemo(() => {
//     const values = Object.values(drafts)
//     return {
//       answered: values.filter((value) => value.selectedIds.length > 0 || value.text.trim()).length,
//       unsaved: values.filter((value) => value.saving ||
//         fingerprint(value.selectedIds, value.text) !== value.savedFingerprint).length,
//       errors: values.filter((value) => value.error).length,
//     }
//   }, [drafts])

//   // Queue a single save at a time. If the candidate edits while saving,
//   // only the old snapshot is acknowledged, leaving the new draft dirty.
//   useEffect(() => {
//     if (!isActive || savingRef.current) return

//     const target = questions.find((question) => {
//       const value = drafts[question.id]
//       return value && !value.saving && !value.error &&
//         fingerprint(value.selectedIds, value.text) !== value.savedFingerprint
//     })
//     if (!target) return

//     const timer = window.setTimeout(async () => {
//       if (savingRef.current) return

//       const snapshot = drafts[target.id]
//       if (!snapshot) return
//       savingRef.current = true

//       setDrafts((currentDrafts) => ({
//         ...currentDrafts,
//         [target.id]: { ...currentDrafts[target.id], saving: true },
//       }))

//       try {
//         const result = await saveExamAnswerAction(
//           code,
//           attemptId,
//           target.id,
//           snapshot.selectedIds,
//           snapshot.text,
//           snapshot.revision
//         )

//         setDrafts((currentDrafts) => {
//           const latest = currentDrafts[target.id]
//           if (!latest) return currentDrafts

//           return {
//             ...currentDrafts,
//             [target.id]: {
//               ...latest,
//               saving: false,
//               revision: result.success && result.revision !== undefined
//                 ? result.revision : latest.revision,
//               savedFingerprint: result.success
//                 ? fingerprint(snapshot.selectedIds, snapshot.text)
//                 : latest.savedFingerprint,
//               error: result.success ? null : (result.error ?? "Save failed"),
//             },
//           }
//         })
//       } catch {
//         setDrafts((currentDrafts) => ({
//           ...currentDrafts,
//           [target.id]: {
//             ...currentDrafts[target.id],
//             saving: false,
//             error: "Connection interrupted. Select Retry to save this answer.",
//           },
//         }))
//       } finally {
//         savingRef.current = false
//         setRetryTick((tick) => tick + 1)
//       }
//     }, 650)

//     return () => window.clearTimeout(timer)
//   }, [code, attemptId, questions, drafts, isActive, retryTick])

//   useEffect(() => {
//     if (summary.unsaved === 0) return

//     const beforeUnload = (event: BeforeUnloadEvent) => {
//       event.preventDefault()
//     }
//     window.addEventListener("beforeunload", beforeUnload)
//     return () => window.removeEventListener("beforeunload", beforeUnload)
//   }, [summary.unsaved])

//   function updateDraft(id: string, value: Partial<Pick<Draft, "selectedIds" | "text">>) {
//     setDrafts((currentDrafts) => ({
//       ...currentDrafts,
//       [id]: {
//         ...currentDrafts[id],
//         ...value,
//         error: null,
//       },
//     }))
//   }

//   function toggleOption(question: ExamQuestion, optionId: string) {
//     if (!isActive) return
//     const existing = drafts[question.id]?.selectedIds ?? []
//     const next = question.type === "multiple_choice"
//       ? existing.includes(optionId)
//         ? existing.filter((id) => id !== optionId)
//         : [...existing, optionId]
//       : existing.includes(optionId) ? [] : [optionId]

//     updateDraft(question.id, { selectedIds: next })
//   }

//   async function submitExamination() {
//     if (!isActive || submitting || savingRef.current || summary.unsaved > 0 || summary.errors > 0) {
//       setSubmissionError("Finish saving all answers before submitting.")
//       return
//     }

//     setSubmissionError(null)
//     setSubmitting(true)
//     try {
//       const result = await submitExamAttemptAction(code, attemptId)
//       if (!result.success) {
//         setSubmissionError(result.error ?? "Unable to submit the examination")
//         return
//       }
//       router.replace(`/take/${code}/attempt/${attemptId}/complete`)
//       router.refresh()
//     } catch {
//       setSubmissionError("Connection interrupted. Check your submission status before retrying.")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const statusLabel = data.status === "in_progress" && remaining === 0
//     ? "Time expired"
//     : data.status.replaceAll("_", " ")

//   return (
//     <main className="min-h-screen bg-muted/20 px-3 py-4 sm:px-6">
//       <div className="mx-auto max-w-6xl space-y-3">
//         <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 sm:px-4">
//           <div className="min-w-0">
//             <h1 className="font-semibold">CBT Examination</h1>
//             <p className="truncate text-xs text-muted-foreground">
//               {candidateName} · Attempt {data.attempt_number}
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <Badge variant="outline" className="capitalize">{statusLabel}</Badge>
//             <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-lg font-semibold tabular-nums ${remaining <= 300 ? "text-destructive" : ""}`}>
//               <Clock3 className="size-4" />
//               {minutesSeconds(remaining)}
//             </div>
//           </div>
//         </header>

//         <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
//           <span>{summary.answered} of {questions.length} answered</span>
//           <span className="flex items-center gap-1.5 text-muted-foreground">
//             {summary.errors > 0 ? <AlertCircle className="size-3.5 text-destructive" /> :
//               summary.unsaved > 0 ? <Loader2 className="size-3.5 animate-spin" /> :
//                 <CheckCircle2 className="size-3.5 text-emerald-600" />}
//             {summary.errors > 0 ? "Save error" : summary.unsaved > 0 ? "Saving / unsaved changes" : "All changes saved"}
//           </span>
//         </div>

//         {!isActive && (
//           <div role="status" className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
//             This attempt is not accepting responses. Your saved answers remain on the server.
//           </div>
//         )}

//         <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
//           <Card className="gap-0 py-0 shadow-none">
//             <CardContent className="space-y-5 p-4 sm:p-6">
//               {!current ? (
//                 <p className="text-sm text-muted-foreground">No active questions are available for this attempt.</p>
//               ) : (
//                 <>
//                   <div className="flex flex-wrap items-center justify-between gap-2">
//                     <h2 className="font-semibold">Question {current.number} of {questions.length}</h2>
//                     <Badge variant="secondary">
//                       {current.type === "multiple_choice" ? "Select all that apply" :
//                         current.type === "free_text" ? "Written response" : "Select one answer"}
//                     </Badge>
//                   </div>

//                   <p className="whitespace-pre-wrap text-base leading-7">{current.prompt}</p>

//                   {current.type === "free_text" ? (
//                     <div className="space-y-2">
//                       <Textarea
//                         value={draft?.text ?? ""}
//                         onChange={(event) => updateDraft(current.id, { text: event.target.value })}
//                         disabled={!isActive || submitting}
//                         maxLength={5000}
//                         rows={6}
//                         placeholder="Type your answer here"
//                       />
//                       <p className="text-right text-xs text-muted-foreground">{draft?.text.length ?? 0} / 5000</p>
//                     </div>
//                   ) : (
//                     <fieldset className="space-y-2" disabled={!isActive || submitting}>
//                       <legend className="sr-only">Select your answer</legend>
//                       {current.options.map((option) => {
//                         const checked = draft?.selectedIds.includes(option.id) ?? false
//                         return (
//                           <label
//                             key={option.id}
//                             className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"} ${!isActive ? "cursor-not-allowed opacity-70" : ""}`}
//                           >
//                             <input
//                               type={current.type === "multiple_choice" ? "checkbox" : "radio"}
//                               name={`question-${current.id}`}
//                               checked={checked}
//                               onChange={() => toggleOption(current, option.id)}
//                               disabled={!isActive || submitting}
//                               className="mt-1 size-4 accent-primary"
//                             />
//                             <span className="whitespace-pre-wrap text-sm leading-6">{option.text}</span>
//                           </label>
//                         )
//                       })}
//                     </fieldset>
//                   )}

//                   {draft?.error && (
//                     <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 p-3 text-xs text-destructive">
//                       <span>{draft.error}</span>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         disabled={!isActive || draft.saving || submitting}
//                         onClick={() => {
//                           setDrafts((currentDrafts) => ({
//                             ...currentDrafts,
//                             [current.id]: { ...currentDrafts[current.id], error: null },
//                           }))
//                           setRetryTick((tick) => tick + 1)
//                         }}
//                       >
//                         <RotateCw className="size-3.5" /> Retry
//                       </Button>
//                     </div>
//                   )}

//                   {isActive && current.type !== "free_text" && (draft?.selectedIds.length ?? 0) > 0 && (
//                     <button
//                       type="button"
//                       className="text-xs text-muted-foreground underline underline-offset-4"
//                       onClick={() => updateDraft(current.id, { selectedIds: [] })}
//                     >
//                       Clear answer
//                     </button>
//                   )}

//                   <div className="flex items-center justify-between gap-2 border-t pt-4">
//                     <Button
//                       variant="outline"
//                       disabled={currentIndex === 0}
//                       onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
//                     >
//                       <ChevronLeft className="size-4" /> Previous
//                     </Button>
//                     <Button
//                       variant="outline"
//                       disabled={currentIndex >= questions.length - 1}
//                       onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
//                     >
//                       Next <ChevronRight className="size-4" />
//                     </Button>
//                   </div>
//                 </>
//               )}
//             </CardContent>
//           </Card>

//           <Card className="gap-0 py-0 shadow-none">
//             <CardContent className="space-y-3 p-3">
//               <h3 className="text-sm font-semibold">Question Navigator</h3>
//               <div className="grid grid-cols-5 gap-2">
//                 {questions.map((question, index) => {
//                   const answer = drafts[question.id]
//                   const answered = (answer?.selectedIds.length ?? 0) > 0 || Boolean(answer?.text.trim())
//                   const unsaved = !!answer && fingerprint(answer.selectedIds, answer.text) !== answer.savedFingerprint
//                   return (
//                     <button
//                       key={question.id}
//                       type="button"
//                       onClick={() => setCurrentIndex(index)}
//                       aria-label={`Go to question ${index + 1}${answered ? ", answered" : ""}`}
//                       aria-current={currentIndex === index ? "step" : undefined}
//                       className={`relative flex aspect-square items-center justify-center rounded-md border text-xs font-medium ${currentIndex === index ? "ring-2 ring-primary ring-offset-1" : ""} ${answered ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
//                     >
//                       {index + 1}
//                       {unsaved && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-500" />}
//                     </button>
//                   )
//                 })}
//               </div>
//               <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
//                 <p>Filled = answered</p>
//                 <p>Orange dot = unsaved change</p>
//                 <p>Answers save automatically while the attempt is active.</p>
//                 <p className="pt-1">Finish all pending saves before submission.</p>
//               </div>
//               {isActive && (
//                 <div className="space-y-2 border-t pt-3">
//                   <AlertDialog
//                     open={submitDialogOpen}
//                     onOpenChange={(open) => {
//                       if (!submitting) {
//                         setSubmitDialogOpen(open)
//                       }
//                     }}
//                   >
//                     <AlertDialogTrigger asChild>
//                       <Button
//                         type="button"
//                         className="w-full"
//                         disabled={
//                           submitting ||
//                           savingRef.current ||
//                           summary.unsaved > 0 ||
//                           summary.errors > 0
//                         }
//                       >
//                         <Send className="size-4" />
//                         Submit Examination
//                       </Button>
//                     </AlertDialogTrigger>

//                     <AlertDialogContent>
//                       <AlertDialogHeader>
//                         <AlertDialogTitle>
//                           Submit examination?
//                         </AlertDialogTitle>
//                         <AlertDialogDescription>
//                           {questions.length - summary.answered > 0
//                             ? `You have ${questions.length - summary.answered} unanswered question(s). You can still submit, but those questions will remain unanswered.`
//                             : "You have answered every question."}
//                           {" "}Once submitted, your answers cannot be changed.
//                         </AlertDialogDescription>
//                       </AlertDialogHeader>

//                       {submissionError && (
//                         <p role="alert" className="text-sm text-destructive">
//                           {submissionError}
//                         </p>
//                       )}

//                       <AlertDialogFooter>
//                         <AlertDialogCancel disabled={submitting}>
//                           Continue Examination
//                         </AlertDialogCancel>
//                         <AlertDialogAction
//                           disabled={
//                             submitting ||
//                             savingRef.current ||
//                             summary.unsaved > 0 ||
//                             summary.errors > 0
//                           }
//                           onClick={(event) => {
//                             event.preventDefault()
//                             void submitExamination()
//                           }}
//                         >
//                           {submitting ? (
//                             <Loader2 className="size-4 animate-spin" />
//                           ) : (
//                             <Send className="size-4" />
//                           )}
//                           {submitting ? "Submitting..." : "Confirm Submission"}
//                         </AlertDialogAction>
//                       </AlertDialogFooter>
//                     </AlertDialogContent>
//                   </AlertDialog>
//                   {submissionError && (
//                     <p role="alert" className="text-xs text-destructive">{submissionError}</p>
//                   )}
//                   {summary.unsaved > 0 && (
//                     <p className="text-xs text-muted-foreground">Waiting for {summary.unsaved} unsaved question(s)</p>
//                   )}
//                 </div>
//               )}
//               {!isActive && (
//                 <Button variant="outline" type="button" className="w-full"
//                   onClick={() => router.replace(`/take/${code}/attempt/${attemptId}/complete`)}>
//                   View Examination Status
//                 </Button>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </main>
//   )
// }
