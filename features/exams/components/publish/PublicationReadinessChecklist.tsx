import Link from "next/link"
import { AlertCircle, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ReadinessIssue } from "../../services/publication-readiness"

type Props = {
  issues: ReadinessIssue[]
  serverError: string | null
}

export function PublicationReadinessChecklist({ issues, serverError }: Props) {
  const blockers = issues.filter(issue => issue.severity === "blocker")
  const warnings = issues.filter(issue => issue.severity === "warning")

  return (
    <section className="space-y-3" aria-label="Publication readiness">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Publication readiness</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={blockers.length ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>
            {blockers.length} {blockers.length === 1 ? "blocker" : "blockers"}
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400">
            {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
          </Badge>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-destructive">Database rejected the publication</p>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground/85">{serverError}</p>
              <p className="text-xs text-muted-foreground">The database performs final checks on question versions, publication rules and random question pools. Fix the issue and try again.</p>
            </div>
          </div>
        </div>
      )}

      {blockers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-destructive/25">
          <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-sm font-semibold">Fix these before publishing</p>
          </div>
          <div className="divide-y divide-border">
            {blockers.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold">Visible requirements passed</p>
            <p className="text-xs text-muted-foreground">The database will still check question versions, rules and random pools when you publish.</p>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-amber-500/30">
          <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <p className="text-sm font-semibold">Warnings to review</p>
            <Badge variant="outline" className="ml-auto border-amber-500/25">Does not block publishing</Badge>
          </div>
          <div className="divide-y divide-border">
            {warnings.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        </div>
      )}
    </section>
  )
}

function IssueRow({ issue }: { issue: ReadinessIssue }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{issue.title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{issue.description}</p>
      </div>
      {issue.action && (
        <Button asChild size="sm" variant="outline" className="h-8 shrink-0 text-xs shadow-none">
          <Link href={issue.action.href}>{issue.action.label}<ArrowUpRight className="size-3.5" /></Link>
        </Button>
      )}
    </div>
  )
}
