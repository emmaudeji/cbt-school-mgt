
"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Check, GraduationCap, KeyRound,
  Loader2, RefreshCw, UserRoundCheck,
} from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { urls } from "@/constants"
import type { AccessMode } from "@/types"
import type { CandidateManagementData } from "@/types/candidate-management"

import { assignPrivateCodeCandidatesAction } from "../../services/assignment/private-code-actions"
import { assignRegisteredSchoolStudentsAction } from "../../services/assignment/registered-school-actions"
import {
  loadSchoolAssignmentAction,
  type SchoolAssignmentPicker,
} from "../../services/assignment/school-actions"

import { SchoolAssignmentFilters } from "./SchoolAssignmentFilters"
import { SchoolStudentPicker } from "./SchoolStudentPicker"
import { ExamCredentialSummary } from "./ExamCredentialSummary"
import { MissingSchoolCredentials } from "./MissingSchoolCredentials"
import { ExamAccessModeSwitcher } from "./ExamAccessModeSwitcher"

type CredentialSummary = {
  assignedCount: number
  credentialsReadyCount: number
  credentialsMissingCount: number
  entryCode: string | null
}

type Props = {
  credentialSummary: CredentialSummary | null
  exam: CandidateManagementData["exam"]
  publication: CandidateManagementData["publication"]
  accessMode: CandidateManagementData["accessMode"]
}

export function SchoolAssignmentWorkspace({
  exam, publication, accessMode, credentialSummary,
}: Props) {
  const router = useRouter()
  const publicationId = publication?.id ?? ""
  const isCode = accessMode === "access_code"
  const isRegistered = accessMode === "registered"
  const enabled = !!publicationId && (isCode || isRegistered)

  const [picker, setPicker] = useState<SchoolAssignmentPicker | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [levelId, setLevelId] = useState("")
  const [classIds, setClassIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [reload, setReload] = useState(0)
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (!enabled) return
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await loadSchoolAssignmentAction(publicationId, {
        sessionId: sessionId || null,
        levelId: levelId || null,
        classIds,
        search,
      }).catch(() => ({
        success: false as const,
        error: "Unable to load the school register.",
      }))

      if (!active) return
      if (result.success) {
        setPicker(result.data)
        setLoadError("")
        if (!sessionId && result.data.currentSessionId) {
          setSessionId(result.data.currentSessionId)
        }
      } else {
        setPicker(null)
        setSelected([])
        setLoadError(result.error)
      }
      setLoading(false)
    }, search.trim() ? 300 : 0)

    return () => { active = false; clearTimeout(timer) }
  }, [enabled, publicationId, sessionId, levelId, classIds, search, reload])

  const rows = picker?.rows ?? []

  const eligibleIds = useMemo(() => new Set(
    rows.filter(row => !row.assigned && (!isRegistered || row.loginReady))
      .map(row => row.id)
  ), [rows, isRegistered])

  const chosen = selected.filter(id => eligibleIds.has(id))
  const canAssign = enabled && !!levelId && !!picker &&
    !picker.truncated && !loading && !loadError &&
    chosen.length > 0 && !saving

  function assign() {
    if (!canAssign) return
    const ids = [...chosen]

    startSaving(async () => {
      try {
        if (isCode) {
          const result = await assignPrivateCodeCandidatesAction(
            publicationId, exam.slug, "school", ids
          )
          if (!result.success) { toast.error(result.error); return }

          toast.success(
            `${result.data.assigned} assigned · ${result.data.restored} restored · ${result.data.alreadyAssigned} already assigned`
          )
          if (result.data.reissuedExisting > 0) {
            toast.info(`${result.data.reissuedExisting} existing codes replaced.`)
          }
        } else {
          const result = await assignRegisteredSchoolStudentsAction(
            publicationId, exam.slug, ids
          )
          if (!result.success) { toast.error(result.error); return }

          toast.success(
            `${result.data.assigned} assigned · ${result.data.restored} restored · ${result.data.alreadyAssigned} already assigned`
          )
        }

        setSelected([])
        setReload(n => n + 1)
        router.refresh()
      } catch (error) {
        console.error("[CBT:SCHOOL_ASSIGNMENT]", error)
        toast.error("Unable to confirm the assignment. Refresh before retrying.")
      }
    })
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-12 sm:px-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={urls.examCandidates(exam.slug)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <ArrowLeft className="size-3.5" /> Back to Candidates
          </Link>
          <h1 className="mt-2 text-xl font-bold">Assign School Students</h1>
          <p className="mt-1 text-sm text-foreground/80">{exam.title}</p>
        </div>
        {publication && (
          <Badge variant="outline">Revision {publication.revision}</Badge>
        )}
      </header>

      <div className="flex items-start gap-3 rounded-lg border border-blue-500/25 bg-blue-500/5 p-3">
        <GraduationCap className="mt-0.5 size-5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-bold">Flexible School Assignment</p>
          <p className="mt-1 text-xs leading-5 text-foreground/80">
            Select students from any academic session, class level or arm.
            A JSS 3 student may take a JSS 1 examination when assigned.
            The examination's academic classification remains unchanged.
          </p>
        </div>
      </div>

      <ExamCredentialSummary
        examSlug={exam.slug}
        publicationId={publication?.id ?? null}
        accessMode={accessMode as AccessMode}
        assignedCount={credentialSummary?.assignedCount ?? 0}
        credentialsReadyCount={credentialSummary?.credentialsReadyCount ?? 0}
        credentialsMissingCount={credentialSummary?.credentialsMissingCount ?? 0}
        entryCode={credentialSummary?.entryCode}
        downloadHref={isCode && (credentialSummary?.credentialsReadyCount ?? 0) > 0
          ? `/api/exams/${encodeURIComponent(exam.slug)}/candidates/credentials`
          : null}
      />

      {isCode && publication && (
        <MissingSchoolCredentials
          publicationId={publication.id}
          examSlug={exam.slug}
          missingCount={credentialSummary?.credentialsMissingCount ?? 0}
          onCompleted={() => setReload(n => n + 1)}
        />
      )}

      {!enabled ? (
        publication && accessMode ? (
          <ExamAccessModeSwitcher
            examSlug={exam.slug}
            publicationId={publication.id}
            accessMode={accessMode}
          />
        ) : (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            Publish the examination before assigning students.
          </p>
        )
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              {isCode
                ? <KeyRound className="size-4 text-amber-600" />
                : <UserRoundCheck className="size-4 text-violet-600" />}
              <div>
                <h2 className="text-sm font-bold">
                  {isCode ? "Assign with Exam Numbers" : "Assign to Student Accounts"}
                </h2>
                <p className="text-xs text-foreground/75">
                  {isCode
                    ? "No school account required."
                    : "Students must have active registered accounts."}
                </p>
              </div>
            </div>
            <Badge variant="outline">{chosen.length} selected</Badge>
          </div>

          <div className="space-y-4 p-4">
            <SchoolAssignmentFilters
              sessions={picker?.sessions ?? []}
              levels={picker?.levels ?? []}
              classes={picker?.classes ?? []}
              sessionId={sessionId || picker?.currentSessionId || ""}
              levelId={levelId}
              classIds={classIds}
              disabled={saving || loading}
              onSession={id => {
                setSessionId(id)
                setLevelId("")
                setClassIds([])
                setSearch("")
                setSelected([])
              }}
              onLevel={id => {
                setLevelId(id)
                setClassIds([])
                setSearch("")
                setSelected([])
              }}
              onClasses={ids => {
                setClassIds(ids)
                setSelected([])
              }}
            />

            {loadError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{loadError}</p>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => setReload(n => n + 1)} className="shadow-none">
                  <RefreshCw className="size-4" /> Retry
                </Button>
              </div>
            )}

            {!levelId ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-foreground/75">
                Choose any class level, then select all or specific students.
                All arms in that level are included unless narrowed.
              </div>
            ) : (
              <SchoolStudentPicker
                rows={rows}
                selected={chosen}
                search={search}
                accessMode={accessMode}
                truncated={picker?.truncated}
                loading={loading}
                disabled={saving || loading || !!loadError || !!picker?.truncated}
                onSearch={value => {
                  setSearch(value)
                  setSelected([])
                }}
                onSelect={setSelected}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <p className="text-xs leading-5 text-foreground/75">
                Assignments apply to revision {publication?.revision}.
                Previous examination attempts remain separate.
              </p>
              <Button type="button" disabled={!canAssign}
                onClick={assign} className="shadow-none">
                {saving
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Check className="size-4" />}
                {saving ? "Assigning..." : isCode
                  ? `Assign ${chosen.length} & Issue Codes`
                  : `Assign ${chosen.length} to Accounts`}
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}













// "use client"

// import { useEffect, useMemo, useState, useTransition } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { ArrowLeft, Check, GraduationCap, Loader2, RefreshCw } from "lucide-react"
// import { toast } from "react-toastify"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader } from "@/components/ui/card"
// import type { CandidateManagementData } from "@/types/candidate-management"
// import {
//   assignPrivateCodeCandidatesAction,
// } from "../../services/assignment/private-code-actions"
// import {
//   loadSchoolAssignmentAction,
//   type SchoolAssignmentPicker
// } from "../../services/assignment/school-actions"
// import { SchoolAssignmentFilters } from "./SchoolAssignmentFilters"
// import { SchoolStudentPicker } from "./SchoolStudentPicker"
 
// import { urls } from "@/constants"
// import { ExamCredentialSummary } from "./ExamCredentialSummary"
// import { AccessMode } from "@/types"
// import { ExamAccessModeSwitcher } from "./ExamAccessModeSwitcher"
// import { MissingSchoolCredentials } from "./MissingSchoolCredentials"
 
// type CredentialSummary = {
//   assignedCount: number
//   credentialsReadyCount: number
//   credentialsMissingCount: number
//   entryCode: string | null
// }

// type Props = {
//   credentialSummary: CredentialSummary | null
//   exam: CandidateManagementData["exam"]
//   publication: CandidateManagementData["publication"]
//   accessMode: CandidateManagementData["accessMode"]
// }

// export function SchoolAssignmentWorkspace({ exam, publication, accessMode, credentialSummary }: Props) {
//   const router = useRouter()
//   const publicationId = publication?.id ?? ""
//   const [picker, setPicker] = useState<SchoolAssignmentPicker | null>(null)
//   const [sessionId, setSessionId] = useState("")
//   const [levelId, setLevelId] = useState("")
//   const [classIds, setClassIds] = useState<string[]>([])
//   const [search, setSearch] = useState("")
//   const [selected, setSelected] = useState<string[]>([])
//   const [loading, setLoading] = useState(false)
//   const [loadError, setLoadError] = useState("")
//   const [reload, setReload] = useState(0)
//   const [saving, startSaving] = useTransition()
//   const enabled = Boolean(publicationId) && accessMode === "access_code"

//   useEffect(() => {
//     if (!enabled) return
//     let active = true
//     const timer = setTimeout(async () => {
//       setLoading(true)
//       const result = await loadSchoolAssignmentAction(publicationId, {
//         sessionId: sessionId || null,
//         levelId: levelId || null,
//         classIds,
//         search
//       }).catch(() => ({ success: false as const, error: "Unable to load the school register." }))
//       if (!active) return
//       if (result.success) {
//         setPicker(result.data)
//         setLoadError("")
//         if (!sessionId && result.data.currentSessionId) setSessionId(result.data.currentSessionId)
//       } else {
//         setPicker(null)
//         setSelected([])
//         setLoadError(result.error)
//       }
//       setLoading(false)
//     }, search.trim() ? 300 : 0)
//     return () => { active = false; clearTimeout(timer) }
//   }, [enabled, publicationId, sessionId, levelId, classIds, search, reload])

//   const rows = picker?.rows ?? []
//   // Only select candidates that the picker explicitly identifies as needing assignment.
//   // To support credential repair for existing assignments, the picker RPC must
//   // expose a verified credentialReady status for each row (see README).
//   const eligibleIds = useMemo(() => new Set(rows.filter(row => !row.assigned).map(row => row.id)), [rows])
//   const chosen = selected.filter(id => eligibleIds.has(id))
//   const canAssign = Boolean(enabled && levelId && picker && !picker.truncated && !loading && !loadError && chosen.length > 0 && !saving)

//   function clearSelection() {
//     setSelected([])
//   }

//   function applyAssignment() {
//     if (!canAssign || !picker) return
//     const ids = [...chosen]

//     startSaving(async () => {
//       const result = await assignPrivateCodeCandidatesAction(publicationId, exam.slug, "school", ids)
//         .catch(() => ({ success: false as const, error: "Unable to assign the selected students." }))
//       if (!result.success) {
//         toast.error(result.error)
//         return
//       }
//       setSelected([])
//       setReload(value => value + 1)
//       router.refresh()
//       toast.success(`${result.data.assigned} assigned · ${result.data.restored} restored · ${result.data.alreadyAssigned} already assigned`)
//       if (result.data.reissuedExisting > 0) toast.info(`${result.data.reissuedExisting} legacy personal code(s) were replaced so they can be downloaded again.`)
//     })
//   }

//   return (
//     <section className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-12 sm:px-5">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div className="space-y-1">
//           <Link className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
//             href={urls.examCandidates(exam.slug)}>
//             <ArrowLeft className="size-3.5" /> Back to examination candidates
//           </Link>
//           <h1 className="text-xl font-bold tracking-tight">Assign School Students</h1>
//           {/* <p className="text-sm text-foreground/75">{exam.title}</p> */}
//         </div>
//         {publication && <Badge variant="outline" className="border-primary/25 bg-primary/5">Revision {publication.revision}</Badge>}
//       </div>

//       <ExamCredentialSummary
//         examSlug={exam.slug}
//         publicationId={publication?.id ?? null}
//         accessMode={accessMode as AccessMode}
//         assignedCount={credentialSummary?.assignedCount ?? 0}
//         credentialsReadyCount={credentialSummary?.credentialsReadyCount ?? 0}
//         credentialsMissingCount={credentialSummary?.credentialsMissingCount ?? 0}
//         entryCode={credentialSummary?.entryCode}
//         downloadHref={accessMode === "access_code" && (credentialSummary?.credentialsReadyCount ?? 0) > 0
//           ? `/api/exams/${encodeURIComponent(exam.slug)}/candidates/credentials`
//           : null}
//       />

//       {accessMode === "access_code" && publication && (
//         <MissingSchoolCredentials
//           publicationId={publication.id}
//           examSlug={exam.slug}
//           missingCount={credentialSummary?.credentialsMissingCount ?? 0}
//           onCompleted={() => setReload(value => value + 1)}
//         />
//       )}


//       {enabled && (credentialSummary?.credentialsMissingCount ?? 0) > 0 && (
//         <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
//           <p className="text-sm font-semibold">Some assigned candidates need downloadable codes</p>
//           <p className="mt-1 text-sm text-foreground/75">
//             {credentialSummary!.credentialsMissingCount.toLocaleString()} existing assignment(s) have no recoverable personal code.
//             This page currently lets you assign additional students, but older assignments
//             need credential reconciliation before their codes can appear in the download.
//           </p>
//         </div>
//       )}

//       {!enabled ? (
//         publication && accessMode ? (
//           <ExamAccessModeSwitcher examSlug={exam.slug} publicationId={publication.id} accessMode={accessMode} />
//         ) : (
//           <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
//             Publish this examination before assigning school students.
//           </p>
//         )
//       ) : (
//         <>
//           <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
//             <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
//               <GraduationCap className="size-5" />
//             </div>
//             <div>
//               <p className="text-sm font-semibold">No student accounts needed</p>
//               <p className="text-xs text-foreground/75">Each newly assigned student gets their own examination access code.</p>
//             </div>
//           </div>


//           <Card className="gap-0 overflow-hidden border-primary/20 py-0 shadow-none">
//             <CardHeader className="border-b border-primary/15 bg-primary/5 px-4 py-3">
//               <div className="flex flex-wrap items-center justify-between gap-2">
//                 <div>
//                   <h2 className="text-base font-semibold">Select students</h2>
//                   <p className="text-xs text-foreground/75">Choose a level, optionally select multiple classes, then pick the students to assign.</p>
//                 </div>
//                 <Badge variant="outline" className="bg-background">{chosen.length} selected</Badge>
//               </div>
//             </CardHeader>
//             <CardContent className="space-y-4 px-3 py-4 sm:px-4">
//               <SchoolAssignmentFilters
//                 sessions={picker?.sessions ?? []}
//                 levels={picker?.levels ?? []}
//                 classes={picker?.classes ?? []}
//                 sessionId={sessionId || picker?.currentSessionId || ""}
//                 levelId={levelId}
//                 classIds={classIds}
//                 disabled={saving}
//                 onSession={value => { setSessionId(value); setLevelId(""); setClassIds([]); clearSelection() }}
//                 onLevel={value => { setLevelId(value); setClassIds([]); clearSelection() }}
//                 onClasses={value => { setClassIds(value); clearSelection() }}
//               />

//               {loadError && (
//                 <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
//                   {loadError}
//                   <Button variant="outline" size="sm" onClick={() => setReload(value => value + 1)}>
//                     <RefreshCw className="size-3.5" /> Retry
//                   </Button>
//                 </div>
//               )}

//               {!levelId ? (
//                 <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground/80">
//                   Start by choosing a class level such as JSS 2. All arms will be included by default.
//                 </p>
//               ) : (
//                 <SchoolStudentPicker rows={rows} selected={chosen} search={search} truncated={picker?.truncated}
//                   loading={loading} disabled={saving || loading || !!loadError || !!picker?.truncated}
//                   onSearch={value => { setSearch(value); clearSelection() }} onSelect={setSelected} />
//               )}

//               <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-3">
//                 <p className="text-xs text-foreground/75">
//                   {picker?.truncated
//                     ? "Narrow your selection before assigning. This prevents silently leaving students out."
//                     : "New and restored assignments receive personal access codes. Existing assignments keep their codes."}
//                 </p>
//                 <Button disabled={!canAssign} onClick={applyAssignment}>
//                   {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
//                   {saving ? "Assigning students…" : `Assign ${chosen.length} & Issue Codes`}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </>
//       )}
//     </section>
//   )
// }
