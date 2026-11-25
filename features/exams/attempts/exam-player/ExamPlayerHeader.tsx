"use client"

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useSchoolBranding } from "@/store/branding-store"

type Props = {
  candidateName: string
  attemptNumber: number
  status: string
  remaining: number
  answered: number
  totalQuestions: number
  unsaved: number
  saveErrors: number
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  const pad = (n: number) => String(n).padStart(2, "0")

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`
}

function SchoolIdentity() {
  const branding = useSchoolBranding()

  const schoolName = branding.name
  const subtitle = branding.motto || "Computer Based Examination"

  // logoPath must already be a browser-accessible image URL/path.
  // A Supabase Storage object key needs resolving on the server first.
  const logo =
    branding.logoPath?.startsWith("/") ||
    branding.logoPath?.startsWith("https://")
      ? branding.logoPath
      : null

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-primary/5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={`${schoolName} logo`}
            className="size-full object-contain p-1"
            referrerPolicy="no-referrer"
          />
        ) : (
          <GraduationCap className="size-5 text-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
          {schoolName}
        </h1>
        <p className="truncate text-[11px] text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function SaveStatus({
  unsaved,
  errors,
}: {
  unsaved: number
  errors: number
}) {
  if (errors > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="size-3.5" />
        Save error
      </span>
    )
  }

  if (unsaved > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600">
        <Loader2 className="size-3.5 animate-spin" />
        Saving...
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <CheckCircle2 className="size-3.5 text-emerald-600" />
      Saved
    </span>
  )
}

export function ExamPlayerHeader({
  candidateName,
  attemptNumber,
  status,
  remaining,
  answered,
  totalQuestions,
  unsaved,
  saveErrors,
}: Props) {
  const total = Math.max(0, totalQuestions)
  const completed = Math.min(total, Math.max(0, answered))
  const percentage = total > 0
    ? Math.round((completed / total) * 100)
    : 0

  const isFinished = ["submitted", "expired", "cancelled"].includes(status)
  const isExpired = remaining <= 0 || status === "expired"
  const isUrgent = !isExpired && remaining <= 60
  const isWarning = !isExpired && remaining <= 300

  const timerStyle =
    isExpired || isUrgent
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : isWarning
        ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
        : "border-primary/15 bg-primary/5"

  const statusLabel =
    status === "in_progress" && remaining <= 0
      ? "Time expired"
      : status.replaceAll("_", " ")

  return (
    <header className="overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <SchoolIdentity />

        <Badge
          variant="outline"
          className="hidden shrink-0 capitalize lg:inline-flex"
        >
          {statusLabel}
        </Badge>

        <div
          role="timer"
          aria-label="Examination time remaining"
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 ${timerStyle}`}
        >
          <Clock3 className="hidden size-4 sm:block" />

          <div className="text-right">
            <p className="text-[9px] font-medium uppercase tracking-wider opacity-70">
              {isFinished ? "Time ended" : "Time left"}
            </p>
            <p className="font-mono text-base font-bold leading-5 tabular-nums sm:text-lg">
              {formatTime(remaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2 text-xs sm:px-4">
        <p className="min-w-0 truncate">
          <span className="font-medium">{candidateName}</span>
          <span className="text-muted-foreground">
            {" "}· Attempt {attemptNumber}
          </span>
        </p>

        <SaveStatus unsaved={unsaved} errors={saveErrors} />
      </div>

      <div className="px-3 py-2 sm:px-4">
        <div className="mb-1.5 flex justify-between gap-2 text-xs">
          <span>
            <strong>{completed}</strong>
            <span className="text-muted-foreground">
              {" "}of {total} answered
            </span>
          </span>

          <span className="tabular-nums text-muted-foreground">
            {percentage}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Questions answered"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </header>
  )
}