"use client"

import { AlertTriangle, CheckCircle2, LockKeyhole, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ImportIssue, ImportRow } from "../../services/import/types"

export function ImportReviewTable({ rows, issues, codes, onChange, onDelete }: {
  rows: ImportRow[]
  issues: ImportIssue[]
  codes: Map<string, string>
  onChange: (uid: string, patch: Partial<ImportRow>) => void
  onDelete: (uid: string) => void
}) {
  return <div className="overflow-x-auto rounded-xl border border-primary/20">
    <table className="w-full min-w-[750px] text-left text-sm">
      <thead className="bg-primary/5 text-xs"><tr className="border-b"><th className="p-3">Import</th><th className="p-3">Row</th><th className="p-3">First name</th><th className="p-3">Surname</th><th className="p-3">Generated code</th><th className="p-3">Review</th><th className="p-3"></th></tr></thead>
      <tbody className="divide-y">{rows.map(row => {
        const rowIssues = issues.filter(issue => issue.rowId === row.uid)
        return <tr key={row.uid} className={!row.include ? "opacity-50" : "hover:bg-primary/[0.025]"}>
          <td className="p-3"><Checkbox checked={row.include} onCheckedChange={value => onChange(row.uid, { include: value === true })} aria-label={`Include row ${row.sourceLine}`} /></td>
          <td className="p-3 text-xs text-muted-foreground">{row.sourceLine}</td>
          <td className="p-2"><Input className="h-9 min-w-32" value={row.first_name} onChange={event => onChange(row.uid, { first_name: event.target.value })} aria-label={`First name row ${row.sourceLine}`} /></td>
          <td className="p-2"><Input className="h-9 min-w-32" value={row.last_name} onChange={event => onChange(row.uid, { last_name: event.target.value })} aria-label={`Surname row ${row.sourceLine}`} /></td>
          <td className="p-2"><div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold tabular-nums"><LockKeyhole className="size-3.5 text-primary" />{row.include ? (codes.get(row.uid) ?? "Preview pending") : "Excluded"}</div></td>
          <td className="max-w-64 p-2">{!row.include ? <span className="text-xs text-muted-foreground">Excluded</span> : rowIssues.length ? rowIssues.map((issue,i) => <p key={i} className={`flex items-start gap-1 text-xs ${issue.level === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}><AlertTriangle className="mt-0.5 size-3 shrink-0" />{issue.message}</p>) : <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-3" /> Ready</span>}</td>
          <td className="p-2"><Button variant="ghost" size="icon" title="Remove row" onClick={() => onDelete(row.uid)}><Trash2 className="size-4" /></Button></td>
        </tr>
      })}</tbody>
    </table>
  </div>
}
