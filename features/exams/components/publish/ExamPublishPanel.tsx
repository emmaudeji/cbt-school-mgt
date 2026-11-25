
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Info,
  Layers3,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
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

import { urls } from "@/constants"
import type { ExamSettings } from "@/types/exam-settings"
import type {
  ExamAccessMode,
  ExamPublicationOverview,
  SchoolExamSummary,
} from "../../services/queries"

import { publishExamAction } from "../../services/action"
import { checkExamPublicationReadiness } from "../../services/publication-readiness"

import { PublicationReadinessChecklist } from "./PublicationReadinessChecklist"
import {
  ExamPublicationAccessGuide,
  examAccessLabels,
} from "./ExamPublicationAccessGuide"
import { SchoolPublicationChoice } from "./SchoolPublicationChoice"
import { useSchoolPublicationWorkflow } from "./useSchoolPublicationWorkflow"

import type {
  AssignmentChoice,
} from "../../services/assignment/school-publication-actions"

type Props = {
  exam: ExamSettings
  overview: ExamPublicationOverview
  schoolSummary?: SchoolExamSummary | null
}

const assignmentLabels: Record<AssignmentChoice, string> = {
  all: "Automatically assign students in the selected classes",
  specific: "Assign selected students",
  later: "Assign students later",
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: "blue" | "violet" | "emerald" | "amber"
}) {
  const colors = {
    blue: "border-blue-500/20 bg-blue-500/5",
    violet: "border-violet-500/20 bg-violet-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
  }

  return (
    <div className={`rounded-lg border p-3 ${colors[tone]}`}>
      <p className="text-[11px] font-semibold text-foreground/75">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function ExamPublishPanel({
  exam,
  overview,
  schoolSummary = null,
}: Props) {
  const router = useRouter()

  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [checkTime, setCheckTime] = useState(() => Date.now())

  const isSchoolExam = schoolSummary !== null
  const noun = isSchoolExam ? "Examination" : "Test"

  const latestPublication = overview.latestPublication
  const currentMode = latestPublication?.accessMode ?? null
  const isRevision = Boolean(latestPublication)
  const nextRevision = (latestPublication?.revision ?? 0) + 1

  // Preserve the current access method when republishing.
  // New school exams default to registered student accounts.
  const [accessMode, setAccessMode] =
    useState<ExamAccessMode | null>(
      currentMode ?? (isSchoolExam ? "registered" : null)
    )

  // School examinations default to automatic class assignment.
  const [assignmentChoice, setAssignmentChoice] =
    useState<AssignmentChoice>("all")

  const [selectedStudentIds, setSelectedStudentIds] =
    useState<string[]>([])

  const schoolWorkflow = useSchoolPublicationWorkflow()

  // Public-link mode currently uses the existing public
  // registration workflow, not private school preassignment.
  const effectiveChoice: AssignmentChoice =
    accessMode === "open_link" ? "later" : assignmentChoice

  const issues = checkExamPublicationReadiness(
    exam,
    overview,
    checkTime
  )

  const blockers = issues.filter(
    issue => issue.severity === "blocker"
  )

  const warnings = issues.filter(
    issue => issue.severity === "warning"
  )

  const ready = blockers.length === 0

  const requiresSelection =
    isSchoolExam &&
    effectiveChoice === "specific"

  const selectionReady =
    !requiresSelection || selectedStudentIds.length > 0

  const recovering = Boolean(schoolWorkflow.recovery)

  const busy = pending || schoolWorkflow.working

  const canPublish =
    ready &&
    Boolean(accessMode) &&
    selectionReady &&
    !busy &&
    !recovering

  const changed =
    isRevision &&
    Boolean(currentMode) &&
    accessMode !== currentMode

  function refreshChecks() {
    if (busy || recovering) return

    setCheckTime(Date.now())
    setServerError(null)
    router.refresh()
  }

  function handleAccessChange(mode: ExamAccessMode) {
    if (busy || recovering) return

    setAccessMode(mode)
    setServerError(null)

    // Specific-student selections made for one access method
    // should be reviewed before changing to another.
    if (mode !== accessMode) {
      setSelectedStudentIds([])
    }

    if (mode === "open_link") {
      setAssignmentChoice("later")
    }
  }

  function handleAssignmentChoice(choice: AssignmentChoice) {
    if (busy || recovering) return

    setAssignmentChoice(choice)
    setServerError(null)

    if (choice !== "specific") {
      setSelectedStudentIds([])
    }
  }

  function publish() {
    if (!canPublish || !accessMode) return

    const latestIssues = checkExamPublicationReadiness(
      exam,
      overview,
      Date.now()
    )

    if (latestIssues.some(issue => issue.severity === "blocker")) {
      setConfirmOpen(false)
      setCheckTime(Date.now())
      return
    }

    setServerError(null)

    startTransition(async () => {
      try {
        // SCHOOL EXAMINATION:
        // Publish, then assign initial students to
        // the newly created publication revision.
        if (isSchoolExam) {
          const result = await schoolWorkflow.publish({
            examId: exam.id,
            slug: exam.slug,
            mode: accessMode,
            choice: effectiveChoice,
            selectedIds:
              effectiveChoice === "specific"
                ? selectedStudentIds
                : [],
          })

          setConfirmOpen(false)

          if (!result.success) {
            const message = result.published
                    ? (
                        "The examination has been published, but its " +
                        "assessment integration or initial student " +
                        "assignments are incomplete. " +
                        result.error +
                        " Use Continue Publication Setup below. " +
                        "Do not publish another revision."
                      )
                    : result.error

            setServerError(message)

           toast.error(
                result.published
                  ? "Published, but setup needs attention."
                  : "Publication failed. Review the details."
              )

            return
          }

          toast.success(
            effectiveChoice === "later"
              ? `Revision ${result.revision} published successfully.`
              : (
                `Revision ${result.revision} published. ` +
                `${result.assigned} students assigned or restored.`
              )
          )

          if (result.skippedNoAccount > 0) {
            toast.info(
              `${result.skippedNoAccount} students need ` +
              "registered accounts before they can be assigned."
            )
          }

          router.push(urls.examCandidates(exam.slug))
          router.refresh()
          return
        }

        // INDEPENDENT CBT:
        // Preserve the original publishing workflow.
        const result = await publishExamAction(
          exam.id,
          exam.slug,
          accessMode
        )

        if (!result.success) {
          setServerError(
            result.error ?? "Unable to publish the test."
          )
          setConfirmOpen(false)
          toast.error("Publication failed. Review the details.")
          return
        }

        setConfirmOpen(false)

        toast.success(
          `Revision ${result.revision} published successfully.`
        )

        router.push(urls.examCandidates(exam.slug))
        router.refresh()
      } catch (error) {
        console.error("[CBT:PUBLISH_EXAM]", error)

        setServerError(
          "Publication could not be confirmed. " +
          "Refresh and verify the latest revision before retrying."
        )

        setConfirmOpen(false)
        toast.error("Unable to confirm publication.")
      }
    })
  }

  async function resumeAssignments() {
    if (!recovering || busy) return

    setServerError(null)

    try {
      const result = await schoolWorkflow.retry()

      if (!result.success) {
        setServerError(
          "The examination is already published, " +
          "but some assignments remain incomplete. " +
          result.error
        )

        toast.error("Unable to complete student assignments.")
        return
      }

      toast.success(
        `Student assignments completed for revision ${result.revision}.`
      )

      if (result.skippedNoAccount > 0) {
        toast.info(
          `${result.skippedNoAccount} students need ` +
          "registered accounts."
        )
      }

      router.push(urls.examCandidates(exam.slug))
      router.refresh()
    } catch (error) {
      console.error("[CBT:RESUME_ASSIGNMENTS]", error)

      setServerError(
        "Assignment completion could not be confirmed. " +
        "Review the candidate roster before trying again."
      )

      toast.error("Unable to confirm student assignments.")
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-none">
      {/* HEADER */}
      <header className="border-b bg-primary/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-white ${
                isSchoolExam
                  ? "bg-blue-600"
                  : "bg-violet-600"
              }`}
            >
              <FileCheck2 className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                {isRevision
                  ? `Publish Updated ${noun}`
                  : `Publish ${noun}`}
              </h2>

              <p className="mt-1 text-sm font-semibold text-foreground/85">
                {exam.title}
              </p>

              <p className="mt-1 text-xs text-foreground/75">
                Review examination content, access,
                candidate assignment and readiness.
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-primary/25 bg-background"
          >
            {isRevision
              ? `Current revision ${nextRevision - 1}`
              : "First Publication"}
          </Badge>
        </div>
      </header>

      <div className="space-y-5 p-4">
        {/* SCHOOL ACADEMIC CONTEXT */}
        {schoolSummary && (
          <section className="space-y-3 rounded-lg border border-blue-500/25 bg-blue-500/5 p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-blue-600" />

              <h3 className="text-sm font-bold">
                School Examination Coverage
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                schoolSummary.sessionName,
                schoolSummary.termName,
                schoolSummary.levelName,
                schoolSummary.subjectName,
              ]
                .filter(Boolean)
                .map(item => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="border-blue-500/20 bg-background"
                  >
                    {item}
                  </Badge>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Users className="size-3.5 text-blue-600" />

              {schoolSummary.classNames.map(name => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>

            <p className="text-xs leading-5 text-foreground/80">
              These classes define the examination's academic
              coverage and default initial assignment group.
              Students from other classes can still be assigned
              later, including for retakes or special examinations.
            </p>
          </section>
        )}

        {/* STATISTICS */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Sections"
            value={overview.sections.length}
            tone="blue"
          />

          <Stat
            label="Questions"
            value={overview.questionCount}
            tone="violet"
          />

          <Stat
            label="Next Revision"
            value={nextRevision}
            tone="emerald"
          />

          <Stat
            label="Readiness"
            value={
              ready
                ? "Ready"
                : `${blockers.length} to fix`
            }
            tone={ready ? "emerald" : "amber"}
          />
        </div>

        {/* QUESTION SECTIONS */}
        {overview.sections.length > 0 && (
          <details className="rounded-lg border">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-semibold">
              <Layers3 className="size-4 text-violet-600" />

              Review Question Sections

              <span className="ml-auto text-xs text-foreground/70">
                {overview.sections.length} sections
              </span>
            </summary>

            <div className="divide-y border-t">
              {overview.sections.map(section => (
                <div
                  key={section.id}
                  className="flex justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {section.title}
                  </span>

                  <span className="shrink-0 font-bold tabular-nums">
                    {section.questionCount} questions
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* EXAM ACCESS METHOD */}
        <ExamPublicationAccessGuide
          examSlug={exam.slug}
          value={accessMode}
          onChange={handleAccessChange}
          currentAccessMode={currentMode}
          published={isRevision}
          disabled={busy || recovering}
          isSchoolExam={isSchoolExam}
        />

        {/* SCHOOL INITIAL ASSIGNMENT */}
        {isSchoolExam && (
          <SchoolPublicationChoice
            examId={exam.id}
            slug={exam.slug}
            accessMode={accessMode}
            choice={effectiveChoice}
            onChoice={handleAssignmentChoice}
            selectedIds={selectedStudentIds}
            onSelectedIds={ids => {
              setSelectedStudentIds(ids)
              setServerError(null)
            }}
            disabled={busy || recovering}
          />
        )}

        {/* REVISION GUIDANCE */}
        {isRevision && (
          <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />

            <p className="text-xs leading-5">
              Publishing a new revision seals the current
              examination blueprint and settings.

              Existing attempts remain associated with their
              original revisions.

              {isSchoolExam
                ? (
                  " The student assignment choice above controls " +
                  "the initial assignments for this new revision. " +
                  "Previously issued Exam Numbers are not " +
                  "automatically transferred."
                )
                : (
                  " Candidate assignments and access details " +
                  "do not automatically transfer."
                )}
            </p>
          </div>
        )}

        {/* ASSIGNMENT RECOVERY */}
        {isSchoolExam && recovering && (
          <section
            role="status"
            className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />

              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-bold">
                  Examination published, setup incomplete
                </h3>

                <p className="text-xs leading-5 text-foreground/80">
                    Revision {schoolWorkflow.recovery?.revision} has
                    already been published.

                    Assessment integration or initial student assignments
                    still need attention. Complete the existing revision
                    rather than publishing another one.
                  </p>
                {schoolWorkflow.working
                  ? "Completing Setup..."
                  : "Continue Publication Setup"}

                {schoolWorkflow.error && (
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {schoolWorkflow.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void resumeAssignments()}
                className="shadow-none"
              >
                {schoolWorkflow.working
                  ? <Loader2 className="size-4 animate-spin" />
                  : <RefreshCw className="size-4" />}

                {schoolWorkflow.working
                  ? "Completing Assignments..."
                  : "Continue Assignments"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  router.push(urls.examCandidates(exam.slug))
                }
                className="shadow-none"
              >
                View Candidates
              </Button>
            </div>
          </section>
        )}

        {/* PUBLICATION READINESS */}
        <PublicationReadinessChecklist
          issues={issues}
          serverError={serverError}
        />

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-sm font-bold">
              {recovering
                ? "Complete the existing publication"
                : !accessMode
                  ? "Select an access method"
                  : !ready
                    ? "Resolve publication blockers"
                    : !selectionReady
                      ? "Select students before publishing"
                      : "Ready for final validation"}
            </p>

            <p className="mt-1 text-xs leading-5 text-foreground/75">
              {accessMode
                ? `Access: ${examAccessLabels[accessMode]}`
                : "Choose how participants will enter."}

              {isSchoolExam && accessMode && (
                <>
                  {" · "}
                  {assignmentLabels[effectiveChoice]}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || recovering}
              onClick={refreshChecks}
              className="shadow-none"
            >
              <RefreshCw className="size-4" />
              Refresh Checks
            </Button>

            <Button
              type="button"
              disabled={!canPublish}
              onClick={() => setConfirmOpen(true)}
              className="shadow-none"
            >
              {busy
                ? <Loader2 className="size-4 animate-spin" />
                : <FileCheck2 className="size-4" />}

              {busy
                ? "Publishing..."
                : isRevision
                  ? "Publish New Revision"
                  : `Publish ${noun}`}
            </Button>
          </div>
        </div>
      </div>

      {/* CONFIRM PUBLICATION */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={open => {
          if (!busy && !recovering) {
            setConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent className="max-w-md shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRevision
                ? `Publish Revision ${nextRevision}?`
                : `Publish ${noun}?`}
            </AlertDialogTitle>

            <AlertDialogDescription>
              Confirm the examination, access method and
              initial candidate assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border bg-primary/5 p-3">
              <p className="text-sm font-bold">
                {exam.title}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" />
                  {overview.questionCount} questions
                </span>

                <span>
                  · {overview.sections.length} sections
                </span>

                <span>
                  · Revision {nextRevision}
                </span>
              </div>

              <p className="mt-3 text-sm font-semibold text-primary">
                {accessMode
                  ? examAccessLabels[accessMode]
                  : "No access selected"}
              </p>

              {schoolSummary && (
                <p className="mt-1 text-xs text-foreground/80">
                  {schoolSummary.levelName}
                  {" · "}
                  {schoolSummary.subjectName}
                  {" · "}
                  {schoolSummary.classNames.length} class arm(s)
                </p>
              )}
            </div>

            {/* CONFIRM INITIAL STUDENT ASSIGNMENT */}
            {isSchoolExam && (
              <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-blue-600" />

                  <p className="text-sm font-semibold">
                    Initial Student Assignment
                  </p>
                </div>

                <p className="mt-2 text-xs leading-5">
                  {assignmentLabels[effectiveChoice]}
                </p>

                {effectiveChoice === "all" && (
                  <p className="mt-1 text-xs text-foreground/75">
                    All eligible students currently enrolled in the
                    selected examination classes will be processed
                    after publication.
                  </p>
                )}

                {effectiveChoice === "specific" && (
                  <p className="mt-1 text-xs font-semibold">
                    {selectedStudentIds.length} student(s) selected
                  </p>
                )}

                {effectiveChoice === "later" && (
                  <p className="mt-1 text-xs text-foreground/75">
                    No automatic assignments will be created.
                    Students can be added from any school class later.
                  </p>
                )}

                {effectiveChoice !== "later" &&
                  accessMode === "registered" && (
                    <p className="mt-2 text-xs text-foreground/75">
                      Students without ready registered accounts
                      will be reported for follow-up.
                    </p>
                  )}

                {effectiveChoice !== "later" &&
                  accessMode === "access_code" && (
                    <p className="mt-2 text-xs text-foreground/75">
                      Students will receive individual Exam Numbers
                      through the existing credential system.
                    </p>
                  )}
              </div>
            )}

            {/* CHANGING ACCESS BETWEEN REVISIONS */}
            {changed && (
              <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />

                <p className="text-xs leading-5">
                  The access method for this new revision differs
                  from the current publication.

                  Existing candidates and attempts remain on their
                  previous revisions unless separately assigned
                  to the new publication.
                </p>
              </div>
            )}

            {warnings.length > 0 && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {warnings.length} non-blocking warning(s) remain.
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={busy}
              className="shadow-none"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={!canPublish}
              onClick={event => {
                event.preventDefault()
                publish()
              }}
              className="shadow-none"
            >
              {busy
                ? <Loader2 className="size-4 animate-spin" />
                : <CheckCircle2 className="size-4" />}

              {busy
                ? "Publishing..."
                : "Confirm Publication"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
