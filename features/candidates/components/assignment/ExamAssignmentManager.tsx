"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookUser, Check, GraduationCap, Loader2, RefreshCw, ShieldAlert, UserMinus, UsersRound } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CandidateManagementData } from "@/types/candidate-management"
import { candidateName } from "../../services/candidate-ui"
import { applyCandidateAssignmentsAction, loadAssignmentPickerAction } from "../../services/assignment/actions"
import type { AssignmentPickerData, AssignmentSource } from "../../services/assignment/types"
import { AssignmentSourceSelector } from "./AssignmentSourceSelector"
import { SchoolClassSelector } from "./SchoolClassSelector"
import { CandidatePickerList } from "./CandidatePickerList"

type Props = { data: CandidateManagementData }

export function ExamAssignmentManager({ data }: Props) {
  const router = useRouter()
  const publicationId = data.publication?.id ?? ""
  const [source, setSource] = useState<AssignmentSource>("directory")
  const [picker, setPicker] = useState<AssignmentPickerData | null>(null)
  const [search, setSearch] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [levelId, setLevelId] = useState("")
  const [classId, setClassId] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [tab, setTab] = useState("add")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [reloadVersion, setReloadVersion] = useState(0)
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (!publicationId) return
    let alive = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await loadAssignmentPickerAction(publicationId, {
        source,
        search,
        sessionId: sessionId || null,
        levelId: source === "school" ? levelId || null : null,
        classId: source === "school" ? classId || null : null,
      }).catch(() => ({ success: false as const, error: "Unable to load candidates." }))
      if (!alive) return
      if (result.success) {
        setPicker(result.data)
        setLoadError("")
        if (source === "school" && !sessionId && result.data.currentSessionId) {
          setSessionId(result.data.currentSessionId)
        }
      } else {
        setLoadError(result.error)
      }
      setLoading(false)
    }, search ? 250 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [publicationId, source, search, sessionId, levelId, classId, reloadVersion])

  const assignedMap = useMemo(() => new Map(data.assignments.map(a => [a.candidate_id, a])), [data.assignments])
  const candidateMap = useMemo(() => new Map(data.candidates.map(c => [c.id, c])), [data.candidates])

  const chooseSource = useCallback((next: AssignmentSource) => {
    setSource(next)
    setSearch("")
    setSelected([])
  }, [])

  const shownRows = picker?.rows ?? []
  const availableIds = new Set(shownRows.filter(row => !row.assigned && row.loginReady).map(row => row.id))
  const selectedAvailable = selected.filter(id => availableIds.has(id))
  
  function submit(ids: string[], actionSource: AssignmentSource, status: "assigned" | "revoked" = "assigned") {
    if (!publicationId || saving || !ids.length) return
    startSaving(async () => {
      const result = await applyCandidateAssignmentsAction(publicationId, data.exam.slug, actionSource, ids, status)
        .catch(() => ({ success: false as const, error: "Unable to confirm the assignment." }))
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const response = result.data
      if (status === "revoked") {
        toast.success(`${response.revoked} candidate access assignment(s) revoked.`)
      } else {
        toast.success(`${response.assigned} assigned, ${response.restored} restored, ${response.alreadyAssigned} already assigned. ${response.createdCandidates} new CBT candidate records.`)
        if (response.needsRegistration) toast.info(`${response.needsRegistration} candidate(s) still need an active registered account to sign in.`)
      }
      setSelected([])
      setReloadVersion(v => v + 1)
      router.refresh()
    })
  }

  return (
    <section id="candidate-assignments" className="scroll-mt-6 space-y-4">
      <div className="rounded-xl border border-primary/20 bg-background">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/15 bg-primary/5 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Assign examination candidates</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose existing candidates or import students straight from your school register.</p>
          </div>
          <Button asChild size="sm" variant="outline"><Link href="/candidates"><BookUser className="size-4" /> Candidate Directory</Link></Button>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <div className="px-4 pt-4">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="add"><UsersRound className="size-4" /> Assign candidates</TabsTrigger>
              <TabsTrigger value="assigned"><Check className="size-4" /> Assignments ({data.assignments.length})</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="add" className="space-y-4 p-4 sm:p-5">
            <AssignmentSourceSelector selected={source} schoolEnabled={picker?.schoolEnabled ?? false} onChange={chooseSource} disabled={saving} />
            {source === "school" && picker && (
              <SchoolClassSelector
                sessions={picker.sessions} levels={picker.levels} classes={picker.classes}
                sessionId={sessionId || picker.currentSessionId || ""} levelId={levelId} classId={classId} disabled={saving}
                onSession={value => { setSessionId(value); setLevelId(""); setClassId(""); setSelected([]) }}
                onLevel={value => { setLevelId(value); setClassId(""); setSelected([]) }}
                onClass={value => { setClassId(value); setSelected([]) }}
              />
            )}
            {source === "school" && !levelId && !classId && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
                For a whole year group such as JSS 2, choose its class level. “All classes / arms” includes every class within that level and session.
              </p>
            )}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading candidate register…</div>}
            {loadError && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
                {loadError}<Button variant="outline" size="sm" onClick={() => setReloadVersion(v => v + 1)}><RefreshCw className="size-4" /> Retry</Button>
              </div>
            )}
            {!loadError && picker && (
              <CandidatePickerList rows={shownRows} search={search} selected={selectedAvailable}
                onSearch={value => { setSearch(value); setSelected([]) }}
                onSelected={setSelected} truncated={picker.truncated} disabled={loading || saving} />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
              <div className="text-xs text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">{selectedAvailable.length} candidate{selectedAvailable.length === 1 ? "" : "s"} selected</p>
                Candidates without registered accounts are visible but cannot be assigned yet. One database operation saves the selection.
              </div>
              <Button disabled={saving || loading || !!loadError || selectedAvailable.length === 0}
                onClick={() => submit(selectedAvailable, source)}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Assign {selectedAvailable.length}
              </Button>
            </div>
            {source === "school" && (
              <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3 text-xs text-foreground/80">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" />
                A school student is matched by their permanent student ID. Existing CBT candidates are reused; newly linked students receive automatically generated CBT candidate codes.
              </div>
            )}
          </TabsContent>
          <TabsContent value="assigned" className="divide-y divide-primary/10">
            {data.assignments.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No examination candidates assigned yet.</p>
            ) : data.assignments.map(assignment => {
              const candidate = assignment.candidate ?? candidateMap.get(assignment.candidate_id)
              const ready = candidateMap.get(assignment.candidate_id)?.membership_id
              return (
                <div key={assignment.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{candidate ? candidateName(candidate) : "Candidate unavailable"}</p>
                    <p className="text-xs text-muted-foreground">{candidate?.candidate_code ?? assignment.candidate_id}</p>
                  </div>
                  <Badge variant={assignment.status === "assigned" ? "secondary" : "outline"} className="capitalize">{assignment.status}</Badge>
                  {assignment.status === "assigned" && !ready && <Badge variant="outline" className="border-amber-500/30"><ShieldAlert className="size-3" /> Account needed</Badge>}
                  <Button size="sm" variant="outline" disabled={saving}
                    onClick={() => submit([assignment.candidate_id], "directory", assignment.status === "assigned" ? "revoked" : "assigned")}>
                    {assignment.status === "assigned" ? <><UserMinus className="size-4" /> Revoke</> : <><RefreshCw className="size-4" /> Restore</>}
                  </Button>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
