"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { urls } from "@/constants"

import {
  inspectExamStudentAttempt,
  type AttemptDiagnosis,
} from "../services/inspect-exam-attempt-action"

import {
  recoverExamStudentResult,
} from "../services/recover-exam-result-action"

import type { SyncRow } from "../services/exam-sync-results"

type Props = {
  slug: string
  row: SyncRow
}

const issueLabels: Record<string, string> = {
  expired_not_finalized: "Expired but not finalized",
  attempt_active: "Examination still active",
  not_started: "Not started",
  attempt_closed_other: "Attempt closed",
  result_finalized: "CBT result finalized",
  question_grades_missing: "Question grades missing",
  grading_summary_missing: "Grading summary missing",
  manual_grading_required: "Manual marking required",
  objective_result_missing: "Objective result not finalized",
  written_questions_need_review: "Written responses need review",
  grading_incomplete: "Grading incomplete",
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return "—"

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="text-sm font-medium">
        {value}
      </dd>
    </div>
  )
}

function DiagnosisContent({
  data,
}: {
  data: AttemptDiagnosis
}) {
  const canRecover =
    data.suggested_action === "recover"

  const finalized = data.result_finalized

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={
            finalized
              ? "border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "border-amber-500/20 text-amber-700 dark:text-amber-400"
          }
        >
          {finalized
            ? "Finalized result"
            : "Result not finalized"}
        </Badge>

        <span className="text-xs text-muted-foreground">
          Attempt #{data.attempt_number}
        </span>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          {finalized ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {issueLabels[data.issue] ?? data.issue}
            </p>

            <p className="text-xs leading-5 text-muted-foreground">
              {canRecover
                ? "This attempt is eligible for a grading recovery check."
                : finalized
                  ? "The CBT result exists. School synchronization can be checked separately."
                  : "This attempt needs inspection or manual grading before a final result can be produced."}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-3">
        <Detail
          label="Attempt status"
          value={data.attempt_status.replaceAll("_", " ")}
        />

        <Detail
          label="Questions"
          value={data.question_count}
        />

        <Detail
          label="Saved answers"
          value={data.answered_count}
        />

        <Detail
          label="Question grades"
          value={`${data.question_grade_count}/${data.question_count}`}
        />

        <Detail
          label="Written questions"
          value={data.written_question_count}
        />

        <Detail
          label="Manual grades pending"
          value={data.pending_manual_count ?? "—"}
        />

        <Detail
          label="Grading status"
          value={data.grading_status ?? "Not created"}
        />

        <Detail
          label="Grading run"
          value={data.grading_run_status ?? "Not created"}
        />

        <Detail
          label="Scored points"
          value={
            data.grading_earned === null
              ? "—"
              : `${data.grading_earned} / ${data.grading_total ?? "—"}`
          }
        />
      </dl>

      <dl className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
        <Detail
          label="Started"
          value={formatDate(data.started_at)}
        />

        <Detail
          label="Official deadline"
          value={formatDate(data.expires_at)}
        />

        <Detail
          label="Submitted"
          value={formatDate(data.submitted_at)}
        />

        <Detail
          label="Closed/Time Expired"
          value={formatDate(data.closed_at)}
        />
      </dl>

      <p className="text-xs leading-5 text-muted-foreground">
        Diagnosis is based on saved database records.  
      </p>
    </div>
  )
}

export function ExamResultRowActions({
  slug,
  row,
}: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [diagnosis, setDiagnosis] =
    useState<AttemptDiagnosis | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)

  const attemptId = row.attempt_id

  const isPotentiallyRecoverable =
    row.sync_status === "pending" ||
    row.sync_status === "ready"


function loadDiagnosis(destination: "inspect" | "review" = "inspect") {
  if (!attemptId || pending) return

  setMessage("")
  setError(false)

  startTransition(async () => {
    const result = await inspectExamStudentAttempt(
      slug,
      row.link_id,
      row.student_id,
      attemptId
    )

    if (!result.ok) {
      setError(true)
      setMessage(result.message)
      setOpen(true)
      return
    }

    if (destination === "review") {
      router.push(
        urls.examCandidateResultDetails(
          slug,
          result.diagnosis.candidate_id,
          attemptId
        )
      )
      return
    }

    setDiagnosis(result.diagnosis)
    setOpen(true)
  })
}

  function handleRecovery() {
    if (!attemptId || pending) return

    setMessage("")
    setError(false)

    startTransition(async () => {
      // Diagnose again immediately before recovery.
      const inspection = await inspectExamStudentAttempt(
        slug,
        row.link_id,
        row.student_id,
        attemptId
      )

      if (!inspection.ok) {
        setError(true)
        setMessage(inspection.message)
        return
      }

      setDiagnosis(inspection.diagnosis)

      const supported =
        inspection.diagnosis.suggested_action === "recover" ||
        inspection.diagnosis.suggested_action === "sync"

      if (!supported) {
        setError(true)
        setMessage(
          "Automatic recovery is not appropriate for this attempt. Review the diagnosis."
        )
        return
      }

      const result = await recoverExamStudentResult(
        slug,
        row.link_id,
        row.student_id,
        attemptId
      )

      setError(!result.ok)
      setMessage(result.message)

      if (result.ok) {
        router.refresh()
      }
    })
  }

  if (!attemptId) {
    return (
      <span className="text-xs text-muted-foreground">
        No attempt
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            className="h-8 gap-1.5 shadow-none"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ClipboardList className="size-3.5" />
            )}

            Actions
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() => loadDiagnosis()}
          >
            <ClipboardList className="size-4" />
            Inspect attempt
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => loadDiagnosis("review")}
          >
            <ExternalLink className="size-4" />
            Review performance
          </DropdownMenuItem>

          {isPotentiallyRecoverable && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  setOpen(true)
                  setDiagnosis(null)
                  loadDiagnosis()
                }}
              >
                <Wrench className="size-4" />
                Recover / Sync
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) {
            setOpen(value)

            if (!value) {
              setMessage("")
              setError(false)
            }
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Examination attempt
            </DialogTitle>

            <DialogDescription>
              {row.student_name} · {row.class_name} ·{" "}
              {row.subject_name} · {row.component_name}
            </DialogDescription>
          </DialogHeader>

          {pending && !diagnosis && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading examination records...
            </div>
          )}

          {diagnosis && (
            <DiagnosisContent data={diagnosis} />
          )}

          {message && (
            <div
              role={error ? "alert" : "status"}
              className={[
                "rounded-lg border p-3 text-sm",
                error
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
              ].join(" ")}
            >
              {message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Close
            </Button>

            {isPotentiallyRecoverable &&
              diagnosis &&
              (
                diagnosis.suggested_action === "recover" ||
                diagnosis.suggested_action === "sync"
              ) && (
                <Button
                  type="button"
                  disabled={pending}
                  onClick={handleRecovery}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-4" />
                  )}

                  {pending
                    ? "Processing..."
                    : diagnosis.suggested_action === "sync"
                      ? "Sync school score"
                      : "Recover and sync"}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}