
import Link from "next/link"
import {
  AlertCircle, AlertTriangle, ArrowUpRight, CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ReadinessIssue } from "../../services/publication-readiness"

type Props = {
  issues: ReadinessIssue[]
  serverError: string | null
}

export function PublicationReadinessChecklist({ issues, serverError }: Props) {
  const blockers = issues.filter(i => i.severity === "blocker")
  const warnings = issues.filter(i => i.severity === "warning")

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">Publication Readiness</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className={blockers.length
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}>
            {blockers.length} blockers
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
            {warnings.length} warnings
          </Badge>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-bold text-destructive">Publication failed</p>
            <p className="mt-1 break-words text-xs leading-5">{serverError}</p>
            <p className="mt-1 text-xs text-foreground/75">
              The database also checks question versions, random pools and publication rules.
            </p>
          </div>
        </div>
      )}

      {blockers.length ? (
        <div className="overflow-hidden rounded-lg border border-red-500/25">
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-2.5">
            <AlertCircle className="size-4 text-red-600" />
            <p className="text-sm font-bold">Resolve Before Publishing</p>
          </div>
          <div className="divide-y">
            {blockers.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        </div>
      ) : (
        <div className="flex gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold">Visible checks passed</p>
            <p className="mt-1 text-xs text-foreground/80">
              Final database validation still runs when you publish.
            </p>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-amber-500/25">
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle className="size-4 text-amber-600" />
            <p className="text-sm font-bold">Warnings to Review</p>
          </div>
          <div className="divide-y">
            {warnings.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        </div>
      )}
    </section>
  )
}

function IssueRow({ issue }: { issue: ReadinessIssue }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{issue.title}</p>
        <p className="mt-0.5 text-xs leading-5 text-foreground/80">
          {issue.description}
        </p>
      </div>
      {issue.action && (
        <Button asChild size="sm" variant="outline" className="h-8 shadow-none">
          <Link href={issue.action.href}>
            {issue.action.label}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}

 