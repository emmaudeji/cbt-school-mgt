
"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Link2,
  Loader2,
  RefreshCw,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  assignSchoolPublicationBatchAction,
} from "../services/assignment/school-publication-actions"

import {
  reconcileSchoolCandidateAction,
} from "../services/assignment/reconcile-school-candidate"

import type {
  AssignmentAttention,
  AttentionRow,
} from "./school/SchoolAssignmentPanel"

type Props = {
  examId: string
  slug: string
  publicationId: string
  accessMode: "registered" | "access_code"
  attention: AssignmentAttention | null
  attentionError?: boolean
}

type Totals = {
  processed: number
  assigned: number
  alreadyAssigned: number
  skipped: number
}

const emptyTotals = (): Totals => ({
  processed: 0,
  assigned: 0,
  alreadyAssigned: 0,
  skipped: 0,
})

const issues: Record<
  AttentionRow["issueCode"],
  { label: string; help: string }
> = {
  account_not_linked: {
    label: "Account Required",
    help: "Create or link an active school account.",
  },
  membership_inactive: {
    label: "Account Inactive",
    help: "Activate the student's school account.",
  },
  identity_conflict: {
    label: "Identity Review",
    help: "Link the existing CBT identity to the school account.",
  },
  candidate_inactive: {
    label: "CBT Identity Inactive",
    help: "Review the student's existing CBT candidate record.",
  },
}

export function CompleteSchoolAssignments({
  examId,
  slug,
  publicationId,
  accessMode,
  attention,
  attentionError = false,
}: Props) {
  const router = useRouter()
  const running = useRef(false)

  const [working, setWorking] = useState(false)
  const [reconcilingId, setReconcilingId] =
    useState<string | null>(null)

  const [error, setError] = useState("")
  const [cursor, setCursor] = useState<string | null>(null)
  const [totals, setTotals] = useState<Totals>(emptyTotals)
  const [lastResult, setLastResult] =
    useState<Totals | null>(null)

  const [resolvedIds, setResolvedIds] = useState<string[]>([])

  const registered = accessMode === "registered"
  const busy = working || reconcilingId !== null

  const rows = registered
    ? attention?.rows.filter(
        student => !resolvedIds.includes(student.studentId)
      ) ?? []
    : []

  const attentionCount = registered
    ? Math.max(0, (attention?.total ?? 0) - resolvedIds.length)
    : 0

  async function runAssignment() {
    if (running.current || reconcilingId) return

    running.current = true
    setWorking(true)
    setError("")
    setLastResult(null)

    let next = cursor
    let current = { ...totals }

    try {
      for (let batch = 0; batch < 1000; batch++) {
        const result = await assignSchoolPublicationBatchAction({
          examId,
          slug,
          publicationId,
          choice: "all",
          selectedIds: [],
          cursor: next,
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        const part = result.batch
        const previous = next

        current = {
          processed:
            current.processed + part.processed,

          assigned:
            current.assigned +
            part.assigned +
            part.restored,

          alreadyAssigned:
            current.alreadyAssigned +
            part.alreadyAssigned,

          skipped:
            current.skipped +
            part.skippedNoAccount,
        }

        next = part.nextCursor

        setTotals(current)
        setCursor(next)

        if (part.completed) {
          setLastResult(current)
          setTotals(emptyTotals())
          setCursor(null)

          toast.success(
            `${current.processed} checked · ` +
            `${current.assigned} new/restored · ` +
            `${current.alreadyAssigned} already assigned`
          )

          if (current.skipped > 0) {
            toast.info(
              `${current.skipped} student(s) need ` +
              "account or identity review."
            )
          }

          router.refresh()
          return
        }

        if (!next || next === previous) {
          throw new Error(
            "Assignment cursor did not advance."
          )
        }
      }

      throw new Error(
        "Batch limit reached. Continue assignments to finish."
      )
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to complete assignments."

      setError(message)
      toast.error("Assignments could not be completed.")
      router.refresh()
    } finally {
      running.current = false
      setWorking(false)
    }
  }

  async function reconcileStudent(studentId: string) {
    if (busy || running.current) return

    setReconcilingId(studentId)
    setError("")

    try {
      const result = await reconcileSchoolCandidateAction(
        examId,
        studentId,
        slug
      )

      if (!result.success) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      setResolvedIds(previous =>
        previous.includes(studentId)
          ? previous
          : [...previous, studentId]
      )

      toast.success(
        result.alreadyLinked
          ? "CBT identity is already linked."
          : "Student CBT identity linked successfully."
      )

      // Identity reconciliation does not create the
      // examination assignment. Run Check & Assign next.
      setLastResult(null)

      router.refresh()
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to reconcile student identity."

      setError(message)
      toast.error(message)
    } finally {
      setReconcilingId(null)
    }
  }

  const summary =
    lastResult ??
    (totals.processed > 0 ? totals : null)

  return (
    <section className="overflow-hidden rounded-xl border border-blue-500/25 bg-card shadow-none">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/5 p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <UsersRound className="size-4.5" />
          </span>

          <div className="min-w-0">
            <h2 className="text-sm font-bold">
              School Student Assignment
            </h2>

            <p className="mt-0.5 text-xs text-foreground/75">
              {registered
                ? "Registered accounts"
                : "Personal Exam Numbers"}
              {" · "}
              Students from the exam's selected classes
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant={"link"}
          disabled={busy}
          onClick={() => void runAssignment()}
          className="shadow-none border border-primary"
        >
          {working ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cursor ? (
            <RefreshCw className="size-4" />
          ) : (
            <UserRoundCheck className="size-4" />
          )}

          {working
            ? "Checking..."
            : cursor
              ? "Continue Assignments"
              : "Check & Assign"}
        </Button>
      </div>

      {/* COMPACT ASSIGNMENT SUMMARY */}
      {(summary || working) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-3.5 py-2.5 text-xs">
          {lastResult && (
            <CheckCircle2 className="size-4 text-emerald-600" />
          )}

          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {summary?.processed ?? 0} checked
          </span>

          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            {summary?.assigned ?? 0} new/restored
          </span>

          <span className="font-semibold text-violet-700 dark:text-violet-300">
            {summary?.alreadyAssigned ?? 0} already assigned
          </span>

          {(summary?.skipped ?? 0) > 0 && (
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {summary?.skipped} skipped
            </span>
          )}
        </div>
      )}

      {/* STUDENTS REQUIRING ACCOUNT / IDENTITY REVIEW */}
      {registered && attentionCount > 0 && (
        <details className="group border-t border-amber-500/20">
          <summary className="flex cursor-pointer list-none items-center gap-2 bg-amber-500/5 px-3.5 py-3 marker:hidden">
            <AlertCircle className="size-4 shrink-0 text-amber-700 dark:text-amber-300" />

            <span className="min-w-0 flex-1 text-sm font-semibold">
              Students Needing Attention
            </span>

            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            >
              {attentionCount}
            </Badge>

            <ChevronDown className="size-4 text-foreground/60 transition-transform group-open:rotate-180" />
          </summary>

          <div className="divide-y border-t border-amber-500/15">
            {rows.map(student => {
              const issue = issues[student.issueCode]
              const assigned =
                student.assignmentStatus === "assigned"

              const isReconciling =
                reconcilingId === student.studentId

              const canReconcile =
                student.issueCode === "identity_conflict" &&
                !assigned

              return (
                <div
                  key={student.studentId}
                  className="flex flex-wrap items-start gap-3 px-3.5 py-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    <GraduationCap className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {student.firstName} {student.lastName}
                    </p>

                    <p className="mt-0.5 text-xs text-foreground/70">
                      {student.className}
                      {student.admissionNumber
                        ? ` · ${student.admissionNumber}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-foreground/75">
                      {issue?.help ??
                        "Review student account readiness."}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    >
                      {issue?.label ?? "Review Required"}
                    </Badge>

                    <span className="text-[11px] text-foreground/65">
                      {assigned
                        ? "Assigned · Sign-in needs review"
                        : "Not assigned"}
                    </span>

                    {/* CONTROLLED CBT IDENTITY RECONCILIATION */}
                    {canReconcile && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void reconcileStudent(student.studentId)
                        }
                        className="h-8 border-amber-500/30 bg-background text-xs text-amber-800 shadow-none hover:bg-amber-500/10 dark:text-amber-300"
                      >
                        {isReconciling ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Link2 className="size-3.5" />
                        )}

                        {isReconciling
                          ? "Linking..."
                          : "Link Existing Identity"}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {attention?.truncated && (
            <p className="border-t px-3.5 py-2 text-xs text-amber-800 dark:text-amber-300">
              Showing the first 200 students requiring review.
            </p>
          )}

          <p className="border-t bg-amber-500/5 px-3.5 py-2.5 text-xs leading-5 text-foreground/75">
            Resolve student account issues or link an existing
            CBT identity. Then use Check & Assign to complete
            examination assignments.
          </p>
        </details>
      )}

      {/* SUCCESSFUL IDENTITY RECONCILIATION */}
      {resolvedIds.length > 0 && (
        <div className="flex items-start gap-2 border-t border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />

          <p className="text-xs leading-5 text-emerald-800 dark:text-emerald-300">
            {resolvedIds.length} student identity link(s)
            confirmed. Use Check & Assign to finish
            examination assignment.
          </p>
        </div>
      )}

      {/* ATTENTION DATA ERROR */}
      {attentionError && registered && (
        <p className="border-t border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          Unable to load student account readiness.
          Refresh the page to retry.
        </p>
      )}

      {/* ACTION ERROR */}
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 border-t border-rose-500/20 bg-rose-500/5 px-3.5 py-3 text-xs text-rose-800 dark:text-rose-300"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </section>
  )
}
