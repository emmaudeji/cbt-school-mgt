
"use client"

import Link from "next/link"
import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, Filter, GraduationCap,
  Info, Loader2, RefreshCw, School, Search, ShieldCheck, XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { importExamSchoolScores, type SyncActionState } from "../services/sync-actions"
import type { SyncRow, SyncSnapshot, SyncStatus } from "../services/exam-sync-results"
import { ExamResultRowActions } from "./ExamResultRowActions"

const PAGE_SIZE = 25, ALL = "all"
const initial: SyncActionState = { ok: false, message: "", imported: 0 }

const statuses: Record<SyncStatus, { label: string; color: string }> = {
  ready: { label: "Ready to sync", color: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  synced: { label: "Synced", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  pending: { label: "Pending grading", color: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  existing_score: { label: "Existing score", color: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  revision_mismatch: { label: "Revision differs", color: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  no_attempt: { label: "Not attempted", color: "border-border bg-muted text-muted-foreground" },
  missing_membership: { label: "Identity missing", color: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  invalid_result: { label: "Invalid result", color: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400" },
}

const format = (value: number | null) =>
  value == null ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })

const rowKey = (row: SyncRow) => `${row.link_id}:${row.student_id}`

const unique = (rows: SyncRow[], field: keyof SyncRow) =>
  [...new Set(rows.map(r => String(r[field] ?? "")).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

function FilterSelect({ label, value, values, onChange, icon: Icon }: {
  label: string; value: string; values: string[]
  onChange: (value: string) => void; icon: typeof School
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-background shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
          {values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ExamSyncResults({ slug, examTitle, snapshot }: {
  slug: string; examTitle: string; snapshot: SyncSnapshot
}) {
  const router = useRouter()
  const rows = snapshot.rows

  const [search, setSearch] = useState("")
  const [schoolClass, setSchoolClass] = useState(ALL)
  const [subject, setSubject] = useState(ALL)
  const [component, setComponent] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [state, action, pending] = useActionState(importExamSchoolScores, initial)

  const classes = useMemo(() => unique(rows, "class_name"), [rows])
  const subjects = useMemo(() => unique(
    rows.filter(r => schoolClass === ALL || r.class_name === schoolClass), "subject_name"
  ), [rows, schoolClass])
  const components = useMemo(() => unique(
    rows.filter(r => (schoolClass === ALL || r.class_name === schoolClass) &&
      (subject === ALL || r.subject_name === subject)), "component_name"
  ), [rows, schoolClass, subject])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter(r =>
      (schoolClass === ALL || r.class_name === schoolClass) &&
      (subject === ALL || r.subject_name === subject) &&
      (component === ALL || r.component_name === component) &&
      (status === ALL || r.sync_status === status) &&
      (!query || [r.student_name, r.admission_number, r.class_name, r.subject_name]
        .some(v => String(v ?? "").toLowerCase().includes(query)))
    )
  }, [rows, search, schoolClass, subject, component, status])

  const selectedRows = useMemo(() => {
    const keys = new Set(checked)
    return rows.filter(r => r.sync_status === "ready" && keys.has(rowKey(r))).slice(0, 200)
  }, [rows, checked])

  const selectedSet = useMemo(() => new Set(selectedRows.map(rowKey)), [selectedRows])
  const payload = JSON.stringify(selectedRows.map(r => ({
    link_id: r.link_id, student_id: r.student_id,
  })))

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const visibleReady = visible.filter(r => r.sync_status === "ready")
  const allVisibleSelected = visibleReady.length > 0 && visibleReady.every(r => selectedSet.has(rowKey(r)))

  const counts = useMemo(() => ({
    ready: rows.filter(r => r.sync_status === "ready").length,
    synced: rows.filter(r => r.sync_status === "synced").length,
    pending: rows.filter(r => ["pending", "no_attempt", "revision_mismatch"].includes(r.sync_status)).length,
    review: rows.filter(r => ["existing_score", "missing_membership", "invalid_result"].includes(r.sync_status)).length,
  }), [rows])

  const stats = [
    { label: "Ready to sync", value: counts.ready, icon: FileCheck2, card: "border-blue-500/20 bg-blue-500/5", iconColor: "bg-blue-500/10 text-blue-600" },
    { label: "Already synced", value: counts.synced, icon: CheckCircle2, card: "border-emerald-500/20 bg-emerald-500/5", iconColor: "bg-emerald-500/10 text-emerald-600" },
    { label: "Awaiting results", value: counts.pending, icon: Clock3, card: "border-amber-500/20 bg-amber-500/5", iconColor: "bg-amber-500/10 text-amber-600" },
    { label: "Needs attention", value: counts.review, icon: AlertCircle, card: "border-rose-500/20 bg-rose-500/5", iconColor: "bg-rose-500/10 text-rose-600" },
  ]

  useEffect(() => {
    if (state.ok) {
      setChecked([])
      setConfirmed(false)
      router.refresh()
    }
  }, [state, router])

  function resetSelection() { setChecked([]); setConfirmed(false) }
  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value); setPage(1); resetSelection()
  }
  function toggle(key: string, add: boolean) {
    setChecked(prev => add
      ? [...new Set([...prev, key])].slice(0, 200)
      : prev.filter(k => k !== key))
    setConfirmed(false)
  }
  function toggleVisible(add: boolean) {
    const keys = visibleReady.map(rowKey)
    setChecked(prev => add
      ? [...new Set([...prev, ...keys])].slice(0, 200)
      : prev.filter(k => !keys.includes(k)))
    setConfirmed(false)
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-4 px-3 py-4 sm:px-6 sm:py-6">
      <Link href={`/exams/${encodeURIComponent(slug)}/results`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <ArrowLeft className="size-3.5" /> Back to results
      </Link>

      {/* Page header */}
      <section className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">CBT Results & School Sync</h1>
            <p className="text-sm font-semibold text-primary">{examTitle}</p>
            <p className="max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
              Inspect grading, recover interrupted attempts and reconcile CBT scores with school assessments.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 border-primary/20 bg-background text-primary">
            <ShieldCheck className="size-3.5" /> Secure reconciliation
          </Badge>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, card, iconColor }) => (
          <Card key={label} className={`flex flex-row items-center gap-3 rounded-xl p-3 shadow-none sm:p-4 ${card}`}>
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{label}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* Assessment links */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-xs sm:text-sm ${
        snapshot.active_links > 0
          ? "border-sky-500/20 bg-sky-500/5"
          : "border-amber-500/25 bg-amber-500/5"
      }`}>
        <div className="flex items-center gap-2">
          {snapshot.active_links > 0
            ? <Info className="size-4 shrink-0 text-sky-600" />
            : <AlertCircle className="size-4 shrink-0 text-amber-600" />}
          <span>
            <strong>{snapshot.active_links} active assessment link(s).</strong>{" "}
            {snapshot.active_links > 0
              ? "Only eligible finalized results can be imported."
              : "Create an assessment link before importing scores."}
          </span>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 bg-background shadow-none">
          <Link href={`/exams/${encodeURIComponent(slug)}/assessment-integration`}>
            Manage links <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Student results */}
      <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4 text-primary" /> Student Results
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="h-8 bg-background"
            onClick={() => router.refresh()}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 p-3 sm:p-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground"><Search className="size-3.5 text-primary" /> Student</Label>
              <Input value={search} placeholder="Name or admission no."
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="bg-background shadow-none" />
            </div>
            <FilterSelect label="Class" icon={GraduationCap} value={schoolClass} values={classes}
              onChange={v => { updateFilter(setSchoolClass, v); setSubject(ALL); setComponent(ALL) }} />
            <FilterSelect label="Subject" icon={BookOpen} value={subject} values={subjects}
              onChange={v => { updateFilter(setSubject, v); setComponent(ALL) }} />
            <FilterSelect label="Component" icon={ClipboardCheck} value={component} values={components}
              onChange={v => updateFilter(setComponent, v)} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={v => updateFilter(setStatus, v)}>
                <SelectTrigger className="w-full bg-background shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {Object.entries(statuses).map(([key, item]) =>
                    <SelectItem key={key} value={key}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Use <strong>Actions</strong> to inspect grading, recover an eligible attempt or review performance.
            Select ready rows to import marks manually. Existing school marks are preserved.
          </p>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <tr className="border-b">
                  <th className="w-10 px-3 py-3">
                    <Checkbox aria-label="Select ready rows on this page" checked={allVisibleSelected}
                      disabled={!visibleReady.length} onCheckedChange={v => toggleVisible(v === true)} />
                  </th>
                  {["Student", "Class / Subject", "Assessment", "Attempt"].map(h =>
                    <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}
                  <th className="px-3 py-3 text-right font-semibold">CBT marks</th>
                  <th className="px-3 py-3 text-right font-semibold">School marks</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {visible.map(r => (
                  <tr key={rowKey(r)} className="transition-colors hover:bg-primary/[0.03]">
                    <td className="px-3 py-3">
                      <Checkbox aria-label={`Select ${r.student_name} ${r.component_name}`}
                        checked={selectedSet.has(rowKey(r))} disabled={r.sync_status !== "ready"}
                        onCheckedChange={v => toggle(rowKey(r), v === true)} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground">{r.admission_number ?? "No admission number"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{r.class_name}</p>
                      <p className="text-xs text-muted-foreground">{r.subject_name} · {r.term_name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{r.component_name}</p>
                      <p className="text-xs text-muted-foreground">Revision {r.revision} · Max {format(r.max_score)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{r.attempt_number == null ? "—" : `#${r.attempt_number}`}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {r.attempt_status?.replaceAll("_", " ") ?? "No attempt"} · Rev {r.attempted_revision ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {format(r.earned_points)} / {format(r.total_points)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-primary">
                      {r.sync_status === "synced" || r.sync_status === "existing_score"
                        ? `${format(r.school_score)} / ${format(r.max_score)}`
                        : r.converted_score == null ? "—" : `${format(r.converted_score)} / ${format(r.max_score)}`}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={`whitespace-nowrap text-[11px] ${statuses[r.sync_status].color}`}>
                        {statuses[r.sync_status].label}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ExamResultRowActions slug={slug} row={r} />
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No students match your filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-muted-foreground">
              Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              {" · "}{selectedRows.length} selected
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={currentPage === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <span className="tabular-nums">{currentPage} / {pages}</span>
              <Button size="sm" variant="outline" disabled={currentPage === pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual import and sync rules */}
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <Card className="gap-0 overflow-hidden border-blue-500/20 py-0 shadow-none">
          <CardHeader className="border-b bg-blue-500/5 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-blue-600" /> Manual Score Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">{selectedRows.length}</strong> eligible score(s) selected.
              Imports are validated against current results and never overwrite existing marks.
            </p>
            <form action={action} className="space-y-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="items" value={payload} />

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <Checkbox id="sync-confirm" checked={confirmed} disabled={!selectedRows.length || pending}
                  onCheckedChange={v => setConfirmed(v === true)} />
                <Label htmlFor="sync-confirm" className="cursor-pointer text-xs leading-5">
                  I have reviewed these results and approve importing their converted school scores.
                </Label>
              </div>

              {state.message && (
                <div role="status" className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
                  state.ok ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/20 bg-destructive/5 text-destructive"
                }`}>
                  {state.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
                  {state.message}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={pending || !confirmed || !selectedRows.length}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {pending ? "Importing..." : `Import ${selectedRows.length} score(s)`}
                </Button>
                <Button type="button" size="sm" variant="outline"
                  disabled={pending || !selectedRows.length} onClick={resetSelection}>
                  Clear selection
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-2 border-violet-500/20 bg-violet-500/5 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <School className="size-4 text-violet-600" /> Reconciliation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-5 text-muted-foreground">
            <p>• Only active assessment links and enrolled students qualify.</p>
            <p>• The newest attempt across revisions takes precedence.</p>
            <p>• Incomplete grading cannot be imported.</p>
            <p>• Revision mismatches need examination.</p>
            <p>• Existing school scores are never overwritten.</p>
            <p>• Every imported mark retains CBT provenance.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
