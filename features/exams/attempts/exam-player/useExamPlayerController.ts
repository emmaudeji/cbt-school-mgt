"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import type {
  ExamPlayerData,
  ExamQuestion,
} from "../services/attempt-player"

import { saveExamAnswerAction } from "../services/save-answer-action"
import { submitExamAttemptAction } from "../services/submit-exam-action"
import { expireExamAttemptAction } from "../services/expire-exam-action"

import {
  getLiveQuestionCorrectionsAction,
  type LiveQuestionCorrection,
} from "../services/getLiveQuestionCorrectionsAction"

export type PlayerDraft = {
  selectedIds: string[]
  text: string
  revision: number
  savedFingerprint: string
  saving: boolean
  error: string | null
}

type Args = {
  code: string
  attemptId: string
  data: ExamPlayerData
}

export function answerFingerprint(
  selectedIds: string[],
  text: string
) {
  return JSON.stringify([selectedIds.slice().sort(), text])
}

function initialDrafts(
  questions: ExamQuestion[]
): Record<string, PlayerDraft> {
  return Object.fromEntries(
    questions.map((question) => {
      const selectedIds = question.answer.selected_ids ?? []
      const text = question.answer.text ?? ""

      return [
        question.id,
        {
          selectedIds,
          text,
          revision: question.answer.revision ?? 0,
          savedFingerprint: answerFingerprint(selectedIds, text),
          saving: false,
          error: null,
        },
      ]
    })
  )
}

function secondsRemaining(
  expiresAt: number,
  offset: number
) {
  return Math.max(
    0,
    Math.ceil((expiresAt - (Date.now() + offset)) / 1000)
  )
}

export function useExamPlayerController({
  code,
  attemptId,
  data,
}: Args) {
  const router = useRouter()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, PlayerDraft>>(
    () => initialDrafts(data.questions ?? [])
  )

  const [retryTick, setRetryTick] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [expiring, setExpiring] = useState(false)

  const [submissionError, setSubmissionError] =
    useState<string | null>(null)

  const [liveCorrections, setLiveCorrections] =
    useState<Record<string, LiveQuestionCorrection>>({})

  const [correctionNotice, setCorrectionNotice] = useState(false)

  const savingRef = useRef(false)
  const finishingRef = useRef(false)
  const expiryStartedRef = useRef(false)
  const correctionSignatureRef = useRef("[]")

  // The server time determines the initial browser offset.
  // The database still has the authoritative deadline.
  const timeOffsetRef = useRef(
    Date.parse(data.server_now) - Date.now()
  )

  const expiryMs = data.expires_at
    ? Date.parse(data.expires_at)
    : 0

  const [remaining, setRemaining] = useState(() =>
    secondsRemaining(expiryMs, timeOffsetRef.current)
  )

  const questions = useMemo(() => {
    return (data.questions ?? []).map((question) => {
      const patch = liveCorrections[question.id]

      if (!patch) return question

      const optionText = new Map(
        patch.options.map((option) => [
          option.id,
          option.text,
        ])
      )

      return {
        ...question,
        prompt: patch.prompt,
        options: question.options.map((option) => ({
          ...option,
          text:
            optionText.get(option.id) ??
            option.text,
        })),
      }
    })
  }, [data.questions, liveCorrections])

  const isActive =
    data.status === "in_progress" &&
    remaining > 0 &&
    !expiring

  const current = questions[currentIndex] ?? null

  const summary = useMemo(() => {
    const values = Object.values(drafts)

    return {
      answered: values.filter(
        (draft) =>
          draft.selectedIds.length > 0 ||
          draft.text.trim().length > 0
      ).length,

      unsaved: values.filter(
        (draft) =>
          draft.saving ||
          answerFingerprint(
            draft.selectedIds,
            draft.text
          ) !== draft.savedFingerprint
      ).length,

      errors: values.filter(
        (draft) => Boolean(draft.error)
      ).length,
    }
  }, [drafts])

  const canSubmit =
    isActive &&
    !submitting &&
    !savingRef.current &&
    summary.unsaved === 0 &&
    summary.errors === 0

  const completionUrl =
    `/take/${code}/attempt/${attemptId}/complete`

  function goToCompletion() {
    router.replace(completionUrl)
    router.refresh()
  }

  // ---------------------------------------
  // COUNTDOWN
  // ---------------------------------------
  useEffect(() => {
    if (data.status !== "in_progress") return

    const update = () => {
      setRemaining(
        secondsRemaining(
          expiryMs,
          timeOffsetRef.current
        )
      )
    }

    update()

    const timer = window.setInterval(update, 1000)

    // Correct stale countdown displays when a tab
    // returns from the background.
    document.addEventListener(
      "visibilitychange",
      update
    )

    return () => {
      window.clearInterval(timer)
      document.removeEventListener(
        "visibilitychange",
        update
      )
    }
  }, [data.status, expiryMs])

  // ---------------------------------------
  // EXPIRY FINALIZATION
  // ---------------------------------------
  async function finalizeExpiry() {
    if (finishingRef.current) return

    finishingRef.current = true
    setExpiring(true)
    setSubmissionError(null)

    try {
      const result = await expireExamAttemptAction(
        code,
        attemptId
      )

      if (!result.success) {
        setSubmissionError(result.error)
        return
      }

      // Both the attempt close and grading RPC have
      // now been processed by the trusted server.
      goToCompletion()
    } catch {
      setSubmissionError(
        "Connection interrupted. Retry finalization."
      )
    } finally {
      finishingRef.current = false
      setExpiring(false)
    }
  }

  useEffect(() => {
    if (data.status === "submitted") {
      goToCompletion()
      return
    }

    const deadlineReached =
      data.status === "expired" ||
      (
        data.status === "in_progress" &&
        remaining === 0
      )

    if (
      !deadlineReached ||
      expiryStartedRef.current ||
      finishingRef.current
    ) {
      return
    }

    // Avoid repeated requests as the countdown
    // continues rendering zero.
    expiryStartedRef.current = true

    void finalizeExpiry()
    // The expiry started ref protects effect replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.status, remaining, submitting])

  async function retryExpiry() {
    if (finishingRef.current || submitting) return

    expiryStartedRef.current = true

    await finalizeExpiry()
  }

  // ---------------------------------------
  // LIVE CORRECTIONS
  // ---------------------------------------
  useEffect(() => {
    if (data.status !== "in_progress") return

    let cancelled = false
    let inFlight = false

    async function refreshCorrections() {
      if (
        cancelled ||
        inFlight ||
        document.visibilityState === "hidden" ||
        secondsRemaining(
          expiryMs,
          timeOffsetRef.current
        ) === 0
      ) {
        return
      }

      inFlight = true

      try {
        const result =
          await getLiveQuestionCorrectionsAction(
            code,
            attemptId
          )

        if (
          cancelled ||
          !result.success
        ) {
          return
        }

        const next = Object.fromEntries(
          result.corrections.map((correction) => [
            correction.id,
            correction,
          ])
        )

        const signature = JSON.stringify(
          result.corrections
            .map((item) => [
              item.id,
              item.updated_at,
            ])
            .sort()
        )

        if (
          correctionSignatureRef.current !==
          signature
        ) {
          correctionSignatureRef.current = signature
          setLiveCorrections(next)
          setCorrectionNotice(true)
        }
      } catch {
        // Corrections must not interrupt taking
        // or autosaving the examination.
      } finally {
        inFlight = false
      }
    }

    void refreshCorrections()

    const interval = window.setInterval(
      () => void refreshCorrections(),
      12000
    )

    document.addEventListener(
      "visibilitychange",
      refreshCorrections
    )

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener(
        "visibilitychange",
        refreshCorrections
      )
    }
  }, [code, attemptId, data.status, expiryMs])

  // ---------------------------------------
  // SERIALIZED ANSWER AUTOSAVE
  // ---------------------------------------
  useEffect(() => {
    if (
      !isActive ||
      submitting ||
      savingRef.current
    ) {
      return
    }

    const target = questions.find((question) => {
      const draft = drafts[question.id]

      return (
        draft &&
        !draft.saving &&
        !draft.error &&
        answerFingerprint(
          draft.selectedIds,
          draft.text
        ) !== draft.savedFingerprint
      )
    })

    if (!target) return

    const timer = window.setTimeout(async () => {
      if (
        savingRef.current ||
        finishingRef.current
      ) {
        return
      }

      const snapshot = drafts[target.id]
      if (!snapshot) return

      savingRef.current = true

      setDrafts((previous) => ({
        ...previous,
        [target.id]: {
          ...previous[target.id],
          saving: true,
        },
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

        setDrafts((previous) => {
          const latest = previous[target.id]
          if (!latest) return previous

          return {
            ...previous,
            [target.id]: {
              ...latest,
              saving: false,
              revision:
                result.success &&
                result.revision !== undefined
                  ? result.revision
                  : latest.revision,
              savedFingerprint: result.success
                ? answerFingerprint(
                    snapshot.selectedIds,
                    snapshot.text
                  )
                : latest.savedFingerprint,
              error: result.success
                ? null
                : result.error ?? "Save failed",
            },
          }
        })
      } catch {
        setDrafts((previous) => ({
          ...previous,
          [target.id]: {
            ...previous[target.id],
            saving: false,
            error:
              "Connection interrupted. Retry saving this answer.",
          },
        }))
      } finally {
        savingRef.current = false
        setRetryTick((tick) => tick + 1)
      }
    }, 650)

    return () => window.clearTimeout(timer)
  }, [
    code,
    attemptId,
    questions,
    drafts,
    isActive,
    submitting,
    retryTick,
  ])

  useEffect(() => {
    if (!isActive || summary.unsaved === 0) return

    const beforeUnload = (
      event: BeforeUnloadEvent
    ) => {
      event.preventDefault()
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    )

    return () => {
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      )
    }
  }, [isActive, summary.unsaved])

  // ---------------------------------------
  // ANSWER EDITING
  // ---------------------------------------
  function updateDraft(
    id: string,
    value: Partial<
      Pick<PlayerDraft, "selectedIds" | "text">
    >
  ) {
    if (!isActive || submitting) return

    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...value,
        error: null,
      },
    }))
  }

  function toggleOption(
    question: ExamQuestion,
    optionId: string
  ) {
    if (!isActive || submitting) return

    const existing =
      drafts[question.id]?.selectedIds ?? []

    const next =
      question.type === "multiple_choice"
        ? existing.includes(optionId)
          ? existing.filter(
              (id) => id !== optionId
            )
          : [...existing, optionId]
        : existing.includes(optionId)
          ? []
          : [optionId]

    updateDraft(question.id, {
      selectedIds: next,
    })
  }

  function retrySave(id: string) {
    if (!isActive || submitting) return

    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        error: null,
      },
    }))

    setRetryTick((tick) => tick + 1)
  }

  // ---------------------------------------
  // MANUAL SUBMISSION
  // ---------------------------------------
  async function submitExamination() {
    if (!canSubmit || finishingRef.current) {
      setSubmissionError(
        "Finish saving all answers before submitting."
      )
      return
    }

    finishingRef.current = true

    setSubmissionError(null)
    setSubmitting(true)

    try {
      const result = await submitExamAttemptAction(
        code,
        attemptId
      )

      if (!result.success) {
        setSubmissionError(
          result.error ??
            "Unable to submit the examination."
        )

        return
      }

      // The submit action also performs automatic
      // school syncing when a finalized result exists.
      goToCompletion()
    } catch {
      setSubmissionError(
        "Connection interrupted. Check your submission status before retrying."
      )
    } finally {
      finishingRef.current = false
      setSubmitting(false)
    }
  }

  return {
    questions,
    current,
    currentIndex,
    drafts,
    remaining,
    summary,

    isActive,
    canSubmit,
    submitting,
    expiring,
    submissionError,

    correctionNotice,
    dismissCorrectionNotice: () =>
      setCorrectionNotice(false),

    setCurrentIndex,
    updateDraft,
    toggleOption,
    retrySave,
    submitExamination,
    retryExpiry,

    viewCompletion: goToCompletion,
  }
}