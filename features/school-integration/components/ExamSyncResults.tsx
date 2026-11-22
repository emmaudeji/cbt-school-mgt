"use client"

import Link from "next/link"
import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck,
  Clock3, FileCheck2, Filter, GraduationCap, Info, Loader2, RefreshCw,
  School, Search, ShieldCheck, Users, XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { importExamSchoolScores, type SyncActionState } from "../services/sync-actions"
import type { SyncRow, SyncSnapshot, SyncStatus } from "../services/exam-sync-results"

const PAGE_SIZE = 25
const ALL = "all"
const initial: SyncActionState = { ok: false, message: "", imported: 0 }

const labels: Record<SyncStatus, string> = {
  ready: "Ready", synced: "Synced", existing_score: "Existing score",
  pending: "Pending grading", revision_mismatch: "Revision differs",
  no_attempt: "Not attempted", missing_membership: "Identity missing",
  invalid_result: "Invalid result",
}

const statusClass: Record<SyncStatus, string> = {
  ready: "bg-primary/10 text-primary border-primary/20",
  synced: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  existing_score: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  revision_mismatch: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  no_attempt: "bg-muted text-muted-foreground border-border",
  missing_membership: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  invalid_result: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
}

const number = (v: number | null) => v === null ? "—" : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
const keyFor = (r: SyncRow) => `${r.link_id}:${r.student_id}`
const unique = (rows: SyncRow[], column: keyof SyncRow) =>
  [...new Set(rows.map(r => String(r[column])).filter(Boolean))].sort((a,b) => a.localeCompare(b,undefined,{ numeric:true }))

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

  const classes = useMemo(() => unique(rows,"class_name"),[rows])
  const subjects = useMemo(() => unique(rows.filter(x => schoolClass === ALL || x.class_name === schoolClass),"subject_name"),[rows,schoolClass])
  const components = useMemo(() => unique(rows.filter(x => (schoolClass === ALL || x.class_name === schoolClass) && (subject === ALL || x.subject_name === subject)),"component_name"),[rows,schoolClass,subject])
  const filtered = useMemo(() => rows.filter(r =>
    (schoolClass === ALL || r.class_name === schoolClass) &&
    (subject === ALL || r.subject_name === subject) &&
    (component === ALL || r.component_name === component) &&
    (status === ALL || r.sync_status === status) &&
    (!search || [r.student_name, r.admission_number, r.class_name, r.subject_name]
      .some(x => String(x ?? "").toLowerCase().includes(search.toLowerCase().trim())))
  ),[rows,schoolClass,subject,component,status,search])

  const readyRows = filtered.filter(r => r.sync_status === "ready")
  const readyKeys = new Set(rows.filter(r => r.sync_status === "ready").map(keyFor))
  const selectedKeys = checked.filter(x => readyKeys.has(x)).slice(0,200)
  const selectedSet = new Set(selectedKeys)
  const selectedRows = rows.filter(r => selectedSet.has(keyFor(r)) && r.sync_status === "ready")
  const selectedPayload = JSON.stringify(selectedRows.map(r => ({ link_id:r.link_id, student_id:r.student_id })))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page,totalPages)
  const visible = filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE)
  const visibleReady = visible.filter(r => r.sync_status === "ready")
  const allVisibleSelected = visibleReady.length > 0 && visibleReady.every(r => selectedSet.has(keyFor(r)))
  const ready = rows.filter(r => r.sync_status === "ready").length
  const synced = rows.filter(r => r.sync_status === "synced").length
  const pendingCount = rows.filter(r => ["pending","no_attempt","revision_mismatch"].includes(r.sync_status)).length
  const flagged = rows.length - ready - synced - pendingCount

  useEffect(() => { if (state.ok) { setChecked([]); setConfirmed(false); router.refresh() } }, [state,router])

  const setFilter = (set: (v:string)=>void) => (v:string) => { set(v); setPage(1); setChecked([]); setConfirmed(false) }
  function toggle(key: string, value: boolean) {
    setChecked(prev => value ? [...new Set([...prev,key])].slice(0,200) : prev.filter(x => x!==key))
    setConfirmed(false)
  }
  function toggleVisible(value: boolean) {
    const keys = visibleReady.map(keyFor)
    setChecked(prev => value ? [...new Set([...prev,...keys])].slice(0,200) : prev.filter(k => !keys.includes(k)))
    setConfirmed(false)
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-4 px-4 py-6">
      <Link href={`/exams/${encodeURIComponent(slug)}/results`} className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" /> Back to results
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Sync School Results</h1>
            <p className="text-sm font-medium">{examTitle}</p>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Preview finalized CBT results, convert marks to each linked assessment component, and securely import eligible scores into school records.</p>
          </div>
          <Badge variant="outline" className="gap-1.5 border-primary/20 bg-background/80 text-primary">
            <ShieldCheck className="size-3.5" /> School assessment
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {label:"Ready to sync",value:ready,icon:FileCheck2,classes:"border-primary/20 bg-primary/5",fg:"text-primary bg-primary/10"},
          {label:"Already synced",value:synced,icon:CheckCircle2,classes:"border-emerald-500/20 bg-emerald-500/5",fg:"text-emerald-600 bg-emerald-500/10"},
          {label:"Awaiting results",value:pendingCount,icon:Clock3,classes:"border-amber-500/20 bg-amber-500/5",fg:"text-amber-600 bg-amber-500/10"},
          {label:"Requires review",value:flagged,icon:AlertCircle,classes:"border-rose-500/20 bg-rose-500/5",fg:"text-rose-600 bg-rose-500/10"},
        ].map(({label,value,icon:Icon,classes,fg}) => (
          <Card key={label} className={`flex flex-row items-center gap-3 p-4 shadow-none ${classes}`}>
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${fg}`}><Icon className="size-5" /></div>
            <div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-sm">{label}</p></div>
          </Card>
        ))}
      </div>

      {snapshot.active_links === 0 ? (
        <Card className="border-amber-500/25 bg-amber-500/5 shadow-none"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-start gap-3"><AlertCircle className="mt-1 size-5 text-amber-600" /><div><p className="font-semibold">No active assessment links</p><p className="text-sm">Link a published revision to a school assessment component before syncing marks.</p></div></div>
          <Button asChild className="shadow-none"><Link href={`/exams/${encodeURIComponent(slug)}/assessment-integration`}>Manage links <ArrowRight className="size-4" /></Link></Button>
        </CardContent></Card>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2"><Info className="size-4 shrink-0 text-sky-600" /><strong>{snapshot.active_links} active link(s)</strong> across school assessments. Only finalized latest attempts can be imported.</span>
          <Button asChild size="sm" variant="outline" className="shadow-none"><Link href={`/exams/${encodeURIComponent(slug)}/assessment-integration`}>Manage links</Link></Button>
        </div>
      )}

      <Card className="gap-3 border-border p-0 pb-4 shadow-none">
        <CardHeader className="border-b bg-primary/5 pt-4"><CardTitle className="flex items-center gap-2 text-base"><Filter className="size-4 text-primary" /> Student score preview <Badge variant="secondary">{filtered.length} rows</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1.5"><Label><Search className="mr-1 inline size-3.5 text-primary" />Search student</Label><Input placeholder="Name or admission no." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} className="shadow-none" /></div>
            <FilterSelect label="Class" icon={GraduationCap} value={schoolClass} onChange={setFilter(v=>{setSchoolClass(v);setSubject(ALL);setComponent(ALL)})} values={classes} />
            <FilterSelect label="Subject" icon={BookOpen} value={subject} onChange={setFilter(v=>{setSubject(v);setComponent(ALL)})} values={subjects} />
            <FilterSelect label="Component" icon={ClipboardCheck} value={component} onChange={setFilter(setComponent)} values={components} />
            <div className="space-y-1.5"><Label>Status</Label><Select value={status} onValueChange={setFilter(setStatus)}><SelectTrigger className="w-full shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{Object.entries(labels).map(([v,label])=><SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent></Select></div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs">
                <tr>
                  <th className="w-10 px-3 py-3"><Checkbox aria-label="Select ready rows on this page" checked={allVisibleSelected} disabled={visibleReady.length===0} onCheckedChange={v=>toggleVisible(v===true)} /></th>
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Class / Subject</th>
                  <th className="px-3 py-3 font-semibold">Assessment</th>
                  <th className="px-3 py-3 font-semibold">Attempt</th>
                  <th className="px-3 py-3 text-right font-semibold">CBT marks</th>
                  <th className="px-3 py-3 text-right font-semibold">School marks</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(r=>(
                  <tr key={keyFor(r)} className="hover:bg-muted/30">
                    <td className="px-3 py-3"><Checkbox aria-label={`Select ${r.student_name} ${r.component_name}`} checked={selectedSet.has(keyFor(r))} disabled={r.sync_status!=="ready"} onCheckedChange={v=>toggle(keyFor(r),v===true)} /></td>
                    <td className="px-3 py-3"><p className="font-medium">{r.student_name}</p><p className="text-xs text-muted-foreground">{r.admission_number ?? "No admission number"}</p></td>
                    <td className="px-3 py-3"><p className="font-medium">{r.class_name}</p><p className="text-xs text-muted-foreground">{r.subject_name} · {r.term_name}</p></td>
                    <td className="px-3 py-3"><p className="font-medium">{r.component_name}</p><p className="text-xs text-muted-foreground">Revision {r.revision} · Max {number(r.max_score)}</p></td>
                    <td className="px-3 py-3"><p>{r.attempt_number === null ? "—" : `#${r.attempt_number}`}</p><p className="text-xs text-muted-foreground">{r.attempted_revision===null ? "No attempt" : `Revision ${r.attempted_revision}`}</p></td>
                    <td className="px-3 py-3 text-right tabular-nums">{number(r.earned_points)} / {number(r.total_points)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">{r.sync_status==="synced" || r.sync_status==="existing_score" ? `${number(r.school_score)} / ${number(r.max_score)}` : r.converted_score===null ? "—" : `${number(r.converted_score)} / ${number(r.max_score)}`}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={`whitespace-nowrap ${statusClass[r.sync_status] ?? ""}`}>{labels[r.sync_status] ?? r.sync_status}</Badge></td>
                  </tr>
                ))}
                {visible.length===0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No students match these filters. Check the active assessment links and school enrollments.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">Showing {filtered.length===0?0:(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,filtered.length)} of {filtered.length} · {selectedRows.length} selected (max 200 per batch)</p>
            <div className="flex items-center gap-2"><Button size="sm" variant="outline" className="shadow-none" disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button><span className="text-xs">{currentPage} / {totalPages}</span><Button size="sm" variant="outline" className="shadow-none" disabled={currentPage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="gap-3 border-primary/20 p-0 pb-5 shadow-none">
          <CardHeader className="border-b bg-primary/5 pt-4"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-5 text-primary" /> Confirm score import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">You have selected <strong>{selectedRows.length}</strong> eligible student assessment score(s). This action writes the converted marks and their CBT source records in one transaction.</p>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm"><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" /> Existing school marks will never be silently overwritten. If a selected result changes before approval, the entire batch is rejected.</span></div>
            <form action={action} className="space-y-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="items" value={selectedPayload} />
              <div className="flex items-start gap-2"><Checkbox id="sync-confirm" checked={confirmed} onCheckedChange={v=>setConfirmed(v===true)} disabled={selectedRows.length===0 || pending} /><Label htmlFor="sync-confirm" className="cursor-pointer leading-5">I have reviewed the selected scores and approve importing them into school assessments.</Label></div>
              {state.message && <div role="status" className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${state.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>{state.ok?<CheckCircle2 className="size-4" />:<XCircle className="size-4" />}{state.message}</div>}
              <div className="flex flex-wrap gap-2"><Button type="submit" className="shadow-none" disabled={pending || !confirmed || selectedRows.length===0}>{pending?<Loader2 className="size-4 animate-spin" />:<RefreshCw className="size-4" />}{pending ? "Importing scores…" : `Import ${selectedRows.length} score(s)`}</Button><Button type="button" variant="outline" className="shadow-none" disabled={pending || selectedRows.length===0} onClick={()=>{setChecked([]);setConfirmed(false)}}>Clear selection</Button></div>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Card className="gap-2 border-primary/20 bg-primary/5 shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><School className="size-4 text-primary" /> School sync rules</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5"><p>• Only currently active assessment links and enrolled students are considered.</p><p>• The newest attempt across this examination's revisions supersedes older attempts.</p><p>• An unfinalized latest attempt stays pending.</p><p>• An attempt on another revision requires an updated assessment link.</p><p>• Imported scores retain an auditable reference to their source CBT result.</p></CardContent></Card>
          <Card className="gap-2 border-sky-500/20 bg-sky-500/5 shadow-none"><CardContent className="space-y-2 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><Info className="size-4 text-sky-600" /> Scope</p><p className="text-xs leading-5">This page syncs only the current exam. A future <strong>/school-integration/sync-scores</strong> page will coordinate all linked school examinations.</p></CardContent></Card>
        </div>
      </div>
    </main>
  )
}

function FilterSelect({label,icon:Icon,value,onChange,values}:{label:string;icon:typeof School;value:string;onChange:(v:string)=>void;values:string[]}) {
  return <div className="space-y-1.5"><Label><Icon className="mr-1 inline size-3.5 text-primary" />{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>{values.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
}
