"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Download, GraduationCap, KeyRound, Loader2, RefreshCw, ShieldAlert } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CandidateManagementData } from "@/types/candidate-management"
import { AssignmentPickerData, AssignmentSource } from "../services/assignment/types"
import { assignPrivateCodeCandidatesAction, IssuedPrivateCredential, loadPrivateAssignmentPickerAction } from "../services/assignment/private-code-actions"
import { AssignmentSourceSelector } from "../components/assignment/AssignmentSourceSelector"
import { SchoolClassSelector } from "../components/assignment/SchoolClassSelector"
import { CandidatePickerList } from "../components/assignment/CandidatePickerList"
 
 

type PrivatePicker = AssignmentPickerData & { entryCode: string }
type Props = { data: CandidateManagementData }

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

function downloadCredentials(rows: IssuedPrivateCredential[], entryCode: string) {
  const header = ["First Name", "Surname", "Candidate Code", "Exam Entry Code", "Personal Access Code"]
  const csv = [header, ...rows.map(row => [row.firstName, row.lastName, row.candidateCode, entryCode, row.accessCode])]
    .map(row => row.map(value => csvCell(value)).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = "exam-private-credentials.csv"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function PrivateCodeAssignmentManager({ data }: Props) {
  const router = useRouter()
  const publicationId = data.publication?.id ?? ""
  const [source, setSource] = useState<AssignmentSource>("school")
  const [picker, setPicker] = useState<PrivatePicker | null>(null)
  const [search, setSearch] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [levelId, setLevelId] = useState("")
  const [classId, setClassId] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [issued, setIssued] = useState<IssuedPrivateCredential[]>([])
  const [issuedEntryCode, setIssuedEntryCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [reload, setReload] = useState(0)
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (!publicationId) return
    let alive = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const response = await loadPrivateAssignmentPickerAction(publicationId, {
        source,
        search,
        sessionId: sessionId || null,
        levelId: source === "school" ? levelId || null : null,
        classId: source === "school" ? classId || null : null,
      }).catch(() => ({ success: false as const, error: "Unable to load candidates." }))
      if (!alive) return
      if (response.success) {
        setPicker(response.data)
        setLoadError("")
        if (source === "school" && !sessionId && response.data.currentSessionId) {
          setSessionId(response.data.currentSessionId)
        }
      } else setLoadError(response.error)
      setLoading(false)
    }, search ? 250 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [publicationId, source, search, sessionId, levelId, classId, reload])

  const rows = picker?.rows ?? []
  const availableIds = useMemo(() => new Set(rows.filter(row => !row.assigned).map(row => row.id)), [rows])
  const chosen = selected.filter(id => availableIds.has(id))

  function chooseSource(next: AssignmentSource) {
    setSource(next)
    setSelected([])
    setSearch("")
  }

  function submit() {
    if (saving || !chosen.length || issued.length) return
    const sourceIds = [...chosen]
    const code = picker?.entryCode ?? ""
    startSaving(async () => {
      const response = await assignPrivateCodeCandidatesAction(publicationId, data.exam.slug, source, sourceIds)
        .catch(() => ({ success: false as const, error: "Unable to issue examination credentials." }))
      if (!response.success) {
        toast.error(response.error)
        return
      }
      const result = response.data
      setIssued(result.issued)
      setIssuedEntryCode(code)
      setSelected([])
      setReload(value => value + 1)
      router.refresh()
      toast.success(`${result.assigned} assigned, ${result.restored} restored, ${result.alreadyAssigned} already assigned.`)
      if (result.issued.length === 0) toast.info("All selected candidates already had assignments. No credentials were changed.")
    })
  }

  return (
    <section id="candidate-private-codes" className="scroll-mt-6 space-y-4 rounded-xl border border-primary/20 bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <KeyRound className="size-5" />
            <h2 className="text-base font-semibold">Assign students without login accounts</h2>
          </div>
          <p className="text-sm text-muted-foreground">Select a class or directory candidates. Each newly assigned student receives a private examination code.</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5">Private Codes</Badge>
      </div>

      {issued.length > 0 && (
        <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-5" /> {issued.length} private credentials issued
          </div>
          <p className="text-xs text-muted-foreground">Download or securely print these codes now. Personal access codes cannot be viewed again. Do not share the entire list with candidates.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => downloadCredentials(issued, issuedEntryCode)}><Download className="size-4" /> Download CSV</Button>
            <Button size="sm" variant="outline" onClick={() => { setIssued([]); setIssuedEntryCode("") }}>Finish and clear codes</Button>
          </div>
          <div className="max-h-48 divide-y divide-emerald-500/15 overflow-y-auto rounded-lg border border-emerald-500/20 bg-background">
            {issued.slice(0, 50).map(item => (
              <div key={item.sourceId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="font-medium">{item.firstName} {item.lastName} · {item.candidateCode}</span>
                <code className="font-mono tracking-wide">{item.accessCode}</code>
              </div>
            ))}
            {issued.length > 50 && <p className="p-2 text-xs text-muted-foreground">Download the CSV to see all {issued.length} credentials.</p>}
          </div>
        </div>
      )}

      {!picker?.schoolEnabled && source === "school" && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">No active school register found. Choose Candidate Directory instead.</div>
      )}
      <AssignmentSourceSelector selected={source} schoolEnabled={picker?.schoolEnabled ?? false} disabled={saving || issued.length > 0} onChange={chooseSource} />
      {source === "school" && picker && (
        <SchoolClassSelector
          sessions={picker.sessions} levels={picker.levels} classes={picker.classes}
          sessionId={sessionId || picker.currentSessionId || ""} levelId={levelId} classId={classId}
          disabled={saving || issued.length > 0}
          onSession={value => { setSessionId(value); setLevelId(""); setClassId(""); setSelected([]) }}
          onLevel={value => { setLevelId(value); setClassId(""); setSelected([]) }}
          onClass={value => { setClassId(value); setSelected([]) }}
        />
      )}
      {source === "school" && !levelId && !classId && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
          <GraduationCap className="size-4 shrink-0" /> Choose a class level such as JSS 2 to select students across all arms.
        </div>
      )}
      {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading register…</p>}
      {loadError && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
        {loadError}<Button size="sm" variant="outline" onClick={() => setReload(v => v + 1)}><RefreshCw className="size-4" /> Retry</Button>
      </div>}
      {!loadError && picker && !loading && (
        <CandidatePickerList
          rows={rows} selected={chosen} search={search} onSearch={setSearch} onSelected={setSelected}
          truncated={picker.truncated} disabled={saving || issued.length > 0}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-4">
        <p className="flex max-w-xl items-start gap-2 text-xs text-muted-foreground"><ShieldAlert className="size-4 shrink-0" /> One batch assignment. Already assigned candidates retain their existing access credentials.</p>
        <Button disabled={saving || !chosen.length || issued.length > 0 || loading || !!loadError} onClick={submit}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {saving ? "Assigning…" : `Assign ${chosen.length} and Issue Codes`}
        </Button>
      </div>
    </section>
  )
}
