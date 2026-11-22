"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileUp,
  GraduationCap,
  Link2,
  LockKeyhole,
  Users,
  UserRoundPlus,
  UserX,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CandidateManagementData } from "@/types/candidate-management"
import type { ExamCandidateStats } from "../services/exam-candidate-roster"
import { PublicExamLinkManager } from "./PublicExamLinkManager"

type Props = {
  data: CandidateManagementData
  /** Resolve this using the existing server-side organization helpers. */
  isSchool?: boolean
  /** Provide the separate candidate roster component in the next stage. */
  candidateList?: ReactNode
  /** Distinct candidates who have started an attempt; supply from attempt statistics. */
  attemptedCount?: number
  stats?: ExamCandidateStats
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not configured"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(date)
}

const accessLabels: Record<string, string> = {
  access_code: "Exam Number",
  registered: "Account Sign-in",
  open_link: "Public Exam Link",
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  icon: typeof Users
  tone: string
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground/80">{label}</p>
        <Icon className="size-4 shrink-0" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function ActionCard({
  title,
  detail,
  icon: Icon,
  href,
  onClick,
  tone,
  disabled = false,
}: {
  title: string
  detail: string
  icon: typeof Users
  href?: string
  onClick?: () => void
  tone: string
  disabled?: boolean
}) {
  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-background/80">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs leading-5 text-foreground/75">{detail}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 opacity-70" />
    </>
  )

  const classes = `flex min-h-24 w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${tone}`

  if (href && !disabled) {
    return <Link href={href} className={classes}>{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  )
}

export function ExamCandidates({
  data,
  isSchool = false,
  candidateList,
  attemptedCount,
  stats,
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false)
  const publication = data.publication
  const slug = encodeURIComponent(data.exam.slug)

  const activeAssignments = stats?.candidates ?? data.assignments.filter(item => item.status === "assigned").length
  const revokedAssignments = stats?.revoked ?? data.assignments.filter(item => item.status === "revoked").length
  const started = stats?.started ?? attemptedCount

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Examination Candidates & Access</h1>
          {/* <p className="text-sm text-foreground/75">{data.exam.title}</p> */}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {publication && <Badge variant="outline">Revision {publication.revision}</Badge>}
          <Badge variant="secondary">
            {publication ? accessLabels[data.accessMode ?? ""] ?? "Access configured" : "Not published"}
          </Badge>
        </div>
      </header>

      {!publication ? (
        <Card className="border-amber-500/30 bg-amber-500/5 py-0 shadow-none">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <LockKeyhole className="size-5 text-amber-700 dark:text-amber-300" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold">Publish the examination first</p>
              <p className="text-xs text-foreground/75">Candidate assignment requires a published examination revision.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/exams/${slug}/settings`}>Examination Settings <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="justify-self-end flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground/80">
            <span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" /> Opens: <strong className="text-foreground">{formatDate(publication.available_from)}</strong></span>
            <span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" /> Closes: <strong className="text-foreground">{formatDate(publication.available_until)}</strong></span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Choose how to add people to this examination.</h2>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {isSchool && (
                <ActionCard
                  title="Assign School Students"
                  detail="Choose one or more classes, or select students individually."
                  icon={GraduationCap}
                  href={`/exams/${slug}/candidates/assign`}
                  tone="border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                />
              )}
              <ActionCard
                title="Choose from Candidate Directory"
                detail="Find existing candidates and assign them to this exam."
                icon={Users}
                href={`/candidates?exam=${slug}`}
                tone="border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300"
              />
              <ActionCard
                title="Add or Import New Candidates"
                detail="Enter names or upload Word, Excel, CSV or text lists."
                icon={FileUp}
                href={`/candidates/import?exam=${slug}`}
                tone="border-violet-500/25 bg-violet-500/5 text-violet-700 dark:text-violet-300"
              />
              <ActionCard
                title="Public Examination Link"
                detail={data.accessMode === "open_link" ? "View or manage this examination's shared link." : "See whether a public link is available for this publication."}
                icon={Link2}
                onClick={() => setLinkOpen(true)}
                tone="border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              />
            </div>
          </div>

           <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Examination Candidate List</h2>
                <p className="text-sm text-foreground/75">See who has started, submitted, or has yet to take the exam.</p>
              </div>
              <Badge variant="outline">{activeAssignments} current candidates</Badge>
            </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Metric label="Current candidates" value={activeAssignments} icon={Users} tone="border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300" />
            <Metric label="Started an attempt" value={started ?? "—"} icon={CheckCircle2} tone="border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" />
            <Metric label="Not yet started" value={stats?.notStarted ?? (started === undefined ? "—" : Math.max(0, activeAssignments - started))} icon={ClipboardList} tone="border-violet-500/25 bg-violet-500/5 text-violet-700 dark:text-violet-300" />
            <Metric label="Revoked access" value={revokedAssignments} icon={UserX} tone="border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300" />
          </div>



          <div className="space-y-3">
           
            {candidateList ?? (
              <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
                <UserRoundPlus className="mx-auto size-6 text-primary" />
                <p className="mt-2 text-sm font-medium">Candidate roster</p>
                <p className="mt-1 text-xs text-foreground/75">The paginated candidate-list component will be plugged in here next.</p>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-primary/20 shadow-none">
          <DialogHeader>
            <DialogTitle>Public Examination Link</DialogTitle>
            <DialogDescription>
              Public link availability depends on the access policy sealed with this examination revision.
            </DialogDescription>
          </DialogHeader>
          {publication && (
            <PublicExamLinkManager
              examId={data.exam.id}
              slug={data.exam.slug}
              accessMode={data.accessMode}
              entryCode={data.publicLinkCode}
              availableFrom={publication.available_from}
              availableUntil={publication.available_until}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
