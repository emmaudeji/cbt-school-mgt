"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileCheck2, Info, Loader2, RefreshCw } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

import type { ExamSettings } from "@/types/exam-settings"
import type { ExamPublicationOverview } from "../../services/queries"
import { publishExamAction } from "../../services/action"
import { checkExamPublicationReadiness } from "../../services/publication-readiness"
import { PublicationReadinessChecklist } from "./PublicationReadinessChecklist"
import { urls } from "@/constants"
import { examAccessLabels, ExamPublicationAccessGuide } from "./ExamPublicationAccessGuide"

type ExamAccessMode =
  | "access_code"
  | "open_link"
  | "registered"

type Props = {
  exam: ExamSettings
  overview: ExamPublicationOverview
  currentAccessMode?: ExamAccessMode | null
}

 
export function ExamPublishPanel({
  exam,
  overview,
}: Props) {
  const router = useRouter()

  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [checkTime, setCheckTime] = useState(() => Date.now())

  const currentAccessMode =
    overview.latestPublication?.accessMode ?? null

  // On a new revision, retain the previous access method
  // unless the teacher deliberately changes it.
  const [accessMode, setAccessMode] =
    useState<ExamAccessMode | null>(
      currentAccessMode!
    )

  const isRevision = Boolean(overview.latestPublication)

  const nextRevision =
    (overview.latestPublication?.revision ?? 0) + 1

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
  const canPublish = ready && !!accessMode && !pending

  const accessChanged =
    isRevision &&
    currentAccessMode !== null &&
    accessMode !== currentAccessMode

  const refreshChecks = () => {
    setCheckTime(Date.now())
    setServerError(null)
    router.refresh()
  }

  const publish = () => {
    if (pending || !accessMode) return

    const currentIssues = checkExamPublicationReadiness(
      exam,
      overview,
      Date.now()
    )

    if (
      currentIssues.some(
        issue => issue.severity === "blocker"
      )
    ) {
      setConfirmOpen(false)
      setCheckTime(Date.now())
      return
    }

    setServerError(null)

    startTransition(async () => {
      try {
        const response = await publishExamAction(
          exam.id,
          exam.slug,
          accessMode
        )

        if (!response.success) {
          setServerError(
            response.error ??
              "The examination could not be published."
          )

          setConfirmOpen(false)
          toast.error("Publication failed. Review the details.")
          return
        }

        setConfirmOpen(false)
        setServerError(null)

        toast.success(
          `Revision ${response.revision} published successfully.`
        )

        router.push(urls.examCandidates(exam.slug))
      } catch (error) {
        console.error("[CBT:PUBLISH_EXAM]", error)

        setServerError(
          "Publication could not be confirmed. Refresh the page and check the latest revision before retrying."
        )

        setConfirmOpen(false)
        toast.error("Unable to confirm publication.")
      }
    })
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border border-primary/20 bg-background py-0 shadow-none">
      <CardHeader className="border-b border-primary/15 bg-primary/5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <FileCheck2 className="size-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-base font-bold">
                {isRevision
                  ? "Publish Updated Revision"
                  : "Publish Examination"}
              </CardTitle>

              <CardDescription className="mt-1 text-foreground/85">
                Review the examination and choose how
                participants will access it.
              </CardDescription>
            </div>
          </div>

          {overview.latestPublication && (
            <Badge
              variant="outline"
              className="border-primary/25 bg-primary/10 text-foreground"
            >
              Current revision{" "}
              {overview.latestPublication.revision}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="  py-5">
        {/* Publication overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Sections"
            value={overview.sections.length}
          />

          <Stat
            label="Questions"
            value={overview.questionCount}
          />

          <Stat
            label="Next Revision"
            value={nextRevision}
          />

          <Stat
            label="Readiness"
            value={
              ready
                ? "Ready"
                : `${blockers.length} to fix`
            }
            highlight
          />
        </div>

        {/* Actual selectable access method */}
        <ExamPublicationAccessGuide
          examSlug={exam.slug}
          value={accessMode}
          onChange={mode => {
            setAccessMode(mode)
            setServerError(null)
          }}
          currentAccessMode={currentAccessMode}
          published={isRevision}
          disabled={pending}
        />

        {/* Revision information */}
        {isRevision && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <div className="space-y-1 text-sm">
              <p className="font-bold text-foreground">
                Publishing a new revision
              </p>

              <p className="leading-6 text-foreground/85">
                The new revision uses your saved settings
                and question blueprint. Existing attempts
                remain attached to their original revision.
                Candidate assignments and access links are
                not automatically transferred.
              </p>
            </div>
          </div>
        )}

        {/* Existing readiness validation */}
        <PublicationReadinessChecklist
          issues={issues}
          serverError={serverError}
        />

        {/* Publish actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {!accessMode
                ? "Choose an access method"
                : !ready
                  ? "Resolve the issues above"
                  : "Ready for final validation"}
            </p>

            <p className="text-xs font-medium text-foreground/80">
              {accessMode
                ? `Access: ${examAccessLabels[accessMode]}`
                : "Select how participants will enter."}
            </p>

            {warnings.length > 0 && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {warnings.length} warning(s) to review.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={refreshChecks}
              className="shadow-none"
            >
              <RefreshCw className="size-4" />
              Refresh checks
            </Button>

            <Button
              type="button"
              disabled={!canPublish}
              onClick={() => setConfirmOpen(true)}
              className="shadow-none"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileCheck2 className="size-4" />
              )}

              {pending
                ? "Publishing..."
                : isRevision
                  ? "Publish New Revision"
                  : "Publish Examination"}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Final confirmation */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={open => {
          if (!pending) setConfirmOpen(open)
        }}
      >
        <AlertDialogContent className="border-primary/20 shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRevision
                ? `Publish revision ${nextRevision}?`
                : "Publish this examination?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-foreground/85">
              This creates a sealed examination revision
              with your selected access method.
              Check the details before confirming.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-bold text-foreground">
              {exam.title}
            </p>

            <p className="text-foreground/85">
              {overview.questionCount} questions ·{" "}
              {overview.sections.length} sections ·{" "}
              Revision {nextRevision}
            </p>

            <div className="rounded-lg border border-primary/20 bg-background p-3">
              <p className="text-xs font-semibold text-foreground/75">
                Selected access method
              </p>

              <p className="mt-1 text-base font-bold text-primary">
                {accessMode
                  ? examAccessLabels[accessMode]
                  : "Not selected"}
              </p>
            </div>

            {accessChanged && (
              <p className="font-medium leading-6 text-amber-800 dark:text-amber-300">
                This new revision will use a different
                access method. Previous candidate
                assignments and access links will
                remain with the older revision.
              </p>
            )}

            {warnings.length > 0 && (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                There are {warnings.length} non-blocking
                warning(s) to review.
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={!canPublish}
              onClick={event => {
                event.preventDefault()
                publish()
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileCheck2 className="size-4" />
              )}

              {pending
                ? "Publishing..."
                : "Confirm Publication"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number | string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-primary/20 p-3 ${
        highlight ? "bg-primary/10" : "bg-primary/5"
      }`}
    >
      <p className="text-xs font-medium text-foreground/75">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}
