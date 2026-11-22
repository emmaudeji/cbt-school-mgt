"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, CloudUpload, FileCheck2, FileSearch, ListChecks, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ImportSourcePicker } from "./ImportSourcePicker"
import { ImportColumnMapper } from "./ImportColumnMapper"
import { ImportReviewTable } from "./ImportReviewTable"
import { CandidateCodeSettings } from "./CandidateCodeSettings"
import { inferMapping, formatCandidates, checkImportRows } from "../../services/import/format"
import { bulkImportCandidatesAction, previewCandidateCodesAction } from "../../services/import/actions"
import type { CodePreview, ExtractedDocument, FieldMap, ImportRow, ImportResult } from "../../services/import/types"

import { useOrgStore } from "@/store/org-store"

import {
  importCandidatesToExamAction,
  type ImportToExamResult,
} from "../../services/import/import-to-exam-action"
import { urls } from "@/constants"
type Stage = "source" | "map" | "review" | "done"


type Props = {
  examSlug?: string
  examTitle?: string
}

export function CandidateBulkImport({
  examSlug,
  examTitle,
}: Props) {
  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const assignmentMode = Boolean(examSlug)
  const person = isSchool ? "student" : "candidate"
  const people = isSchool ? "students" : "candidates"
  const [stage, setStage] = useState<Stage>("source")
  const [document, setDocument] = useState<ExtractedDocument | null>(null)
  const [mapping, setMapping] = useState<FieldMap>({ first_name: null, last_name: null })
  const [fullNameIndex, setFullNameIndex] = useState<number | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [rows, setRows] = useState<ImportRow[]>([])
  const [preview, setPreview] = useState<CodePreview | null>(null)
  const [verified, setVerified] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const [examResult, setExamResult] = useState<ImportToExamResult | null>(null)

  const [pending, startPending] = useTransition()
  const included = useMemo(() => rows.filter(row => row.include), [rows])
  const issues = useMemo(() => {
    const all = checkImportRows(rows)
    const existing = new Set(preview?.existingNames ?? [])
    for (const row of included) {
      const name = `${row.first_name.trim()} ${row.last_name.trim()}`.trim().toLowerCase()
      if (existing.has(name)) all.push({ rowId: row.uid, level: "warning", message: "A candidate with this name already exists in the directory. Verify before importing." })
    }
    return all
  }, [rows, included, preview])
  const errors = issues.filter(issue => issue.level === "error").length
  const alerts = issues.filter(issue => issue.level === "warning").length
  const codeMap = useMemo(() => new Map(included.map((row, i) => [row.uid, preview?.codes[i] ?? ""])), [included, preview])

  const directoryHref = examSlug
    ? urls.examCandidtatesSelectFromDirectory(examSlug)
    : urls.candidates

  const examCandidatesHref = examSlug
    ? urls.examCandidates(examSlug)
    : null

  const checkCodes = () => startPending(async () => {
    try {
      const reply = await previewCandidateCodesAction(included.length, included.map(row => `${row.first_name.trim()} ${row.last_name.trim()}`.trim()))
      if (!reply.success || !reply.preview) {
        toast.error(reply.error ?? "Unable to load candidate codes")
        return
      }
      setPreview(reply.preview)
      setVerified(true)
    } catch { toast.error("Unable to check numbering. Please retry.") }
  })

  useEffect(() => {
    if (stage !== "review") return
    // The confirmation must match the exact set of included rows.
    setVerified(false)
  }, [included.map(row => row.uid).join("|"), stage])

  const handleExtraction = (data: ExtractedDocument) => {
    const inferred = inferMapping(data)
    setDocument(inferred.data)
    setMapping(inferred.mapping)
    setFullNameIndex(inferred.fullNameIndex)
    setWarnings(inferred.warnings)
    setRows([])
    setPreview(null)
    setVerified(false)
    setStage("map")
  }
  const next = () => {
    if (!document) return
    if (mapping.first_name === null && fullNameIndex === null) return toast.error("Map First name or Full name before continuing.")
    const formatted = formatCandidates(document, mapping, fullNameIndex)
    if (!formatted.length) return toast.error("No candidates were extracted.")
    setRows(formatted)
    setAcknowledged(false)
    setPreview(null)
    setStage("review")
    // First preview is requested automatically on arrival; final verification stays beside Import.
    startPending(async () => {
      const reply = await previewCandidateCodesAction(formatted.length, formatted.map(row => `${row.first_name.trim()} ${row.last_name.trim()}`.trim()))
      if (reply.success && reply.preview) setPreview(reply.preview)
    })
  }
  const update = (uid: string, patch: Partial<ImportRow>) => {
    setRows(current => current.map(row => row.uid === uid ? { ...row, ...patch } : row))
    setVerified(false)
    setAcknowledged(false)
  }
  const reset = () => {
    setStage("source"); setDocument(null); setRows([]); setPreview(null)
    setVerified(false); setAcknowledged(false); setResult(null)
    setExamResult(null)
  }
   
  const submit = () => {
    if (
      pending ||
      !verified ||
      !acknowledged ||
      errors > 0 ||
      included.length < 1 ||
      included.length > 500
    ) {
      return
    }

    startPending(async () => {
      const payload = included.map(row => ({
        first_name: row.first_name,
        last_name: row.last_name,
      }))

      try {
        if (examSlug) {
          const reply = await importCandidatesToExamAction(
            examSlug,
            payload
          )

          if (reply.status === "failed") {
            toast.error(reply.error)
            return
          }

          // Both complete and partial-success states mean
          // the directory import already happened.
          setExamResult(reply)
          setResult(reply.importResult)
          setStage("done")

          if (reply.status === "imported_not_assigned") {
            toast.warning(
              "Candidates imported. Examination assignment needs attention."
            )
          } else {
            toast.success(
              `${reply.assignment.assigned} ${people} added to the examination.`
            )
          }

          return
        }

        // Ordinary directory import is unchanged.
        const reply = await bulkImportCandidatesAction(
          payload
        )

        if (!reply.success || !reply.result) {
          toast.error(
            reply.error ?? "Unable to import candidates."
          )
          return
        }

        setResult(reply.result)
        setStage("done")

        toast.success(
          `${reply.result.created} ${people} created.`
        )
      } catch {
        toast.error(
          "Unable to confirm the result. Check the directory before retrying."
        )
      }
    })
  }

  const steps: { id: Stage; label: string; icon: typeof CloudUpload }[] = [
    { id: "source", label: "Upload", icon: CloudUpload },
    { id: "map", label: "Map names", icon: FileSearch },
    { id: "review", label: "Review & edit", icon: ListChecks },
    { id: "done", label: "Finished", icon: FileCheck2 },
  ]

  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-20 sm:px-6">
   
    <header className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-7">
      <Link
        href={directoryHref}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to {isSchool ? "Student" : "Candidate"} Directory
      </Link>

      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CloudUpload className="size-6 text-primary" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Import {isSchool ? "Students" : "Candidates"}
          </h1>

          <p className="text-sm font-medium leading-6 text-foreground/85">
            {assignmentMode
              ? `Upload ${people}, review their names, and add them to this examination.`
              : `Upload names, review them, and save new ${people} in your directory.`}
          </p>

          {assignmentMode && examTitle && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-primary" />
              Examination: {examTitle}
            </div>
          )}
        </div>
      </div>
    </header>


    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((item, index) => { const Icon = item.icon; const current = steps.findIndex(step => step.id === stage); return <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${index === current ? "border-primary/40 bg-primary/10 font-semibold" : index < current ? "border-emerald-500/25 bg-emerald-500/5" : "border-primary/10"}`}><Icon className={`size-4 shrink-0 ${index <= current ? "text-primary" : "text-muted-foreground"}`} />{item.label}</div> })}</div>
    <section className="rounded-xl border border-primary/20 bg-background p-4 sm:p-6">
      {stage === "source" && <ImportSourcePicker busy={pending} onExtract={handleExtraction} />}
      {stage === "map" && document && <div className="space-y-5">
        <div><h2 className="font-semibold">Map candidate names</h2><p className="mt-1 text-xs text-muted-foreground">{document.source} · {document.rows.length} rows</p></div>
        {warnings.map((warning,i) => <p key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">{warning}</p>)}
        <ImportColumnMapper headers={document.headers ?? []} mapping={mapping} setMapping={setMapping} fullNameIndex={fullNameIndex} setFullNameIndex={setFullNameIndex} />
        <div className="overflow-x-auto rounded-lg border"><table className="min-w-full text-left text-xs"><thead className="bg-primary/5"><tr>{document.headers?.map((head,i) => <th className="p-2" key={i}>{head}</th>)}</tr></thead><tbody>{document.rows.slice(0,4).map((row,i) => <tr className="border-t" key={i}>{document.headers?.map((_,j) => <td className="p-2" key={j}>{row.cells[j] ?? ""}</td>)}</tr>)}</tbody></table></div>
        <div className="flex justify-between gap-2"><Button variant="outline" onClick={() => setStage("source")}>Choose another file</Button><Button onClick={next}>Review candidates <ArrowRight className="size-4" /></Button></div>
      </div>}
      {stage === "review" && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Review and correct</h2><p className="text-xs text-muted-foreground">{included.length} included · {errors} errors · {alerts} warnings</p></div><Button variant="outline" size="sm" onClick={() => setStage("map")}>Edit mapping</Button></div>
        <CandidateCodeSettings preview={preview} onSaved={() => { setPreview(null); setVerified(false); checkCodes() }} />
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{rows.length} extracted</Badge><Badge variant="secondary">{included.length} selected</Badge><Badge variant="outline">{errors} blocking</Badge><Badge variant="outline">All new candidates Active</Badge></div>
        <ImportReviewTable rows={rows} issues={issues} codes={codeMap} onChange={update} onDelete={uid => { setRows(current => current.filter(row => row.uid !== uid)); setVerified(false); setAcknowledged(false) }} />
        <label className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} className="border border-foreground" /><span>I have reviewed these names, including any repeated names. Candidate codes are generated automatically and may be adjusted if another import completes first.</span></label>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" disabled={pending || included.length < 1 || included.length > 500} onClick={checkCodes}>{pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{verified ? "Recheck codes" : "Check candidate codes"}</Button>
          
          <Button
            disabled={
              pending ||
              !verified ||
              !acknowledged ||
              errors > 0 ||
              included.length < 1 ||
              included.length > 500
            }
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}

            {assignmentMode
              ? `Import & Assign ${included.length} ${people}`
              : `Import ${included.length} ${people}`}
          </Button>

        </div>
      </div>}

     
      {stage === "done" && result && (
        <div className="space-y-5 py-5">
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" />

            <h2 className="mt-3 text-xl font-bold">
              {examResult?.status === "imported_not_assigned"
                ? "Import saved. Assignment needs attention."
                : assignmentMode
                  ? "Import and Assignment Completed"
                  : "Import Completed"}
            </h2>

            <p className="mt-2 text-sm font-medium text-foreground/85">
              {result.created} new {people} saved to the directory.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-center">
              <p className="text-3xl font-bold tabular-nums">
                {result.created}
              </p>
              <p className="text-sm font-medium">
                Created
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-center">
              <p className="text-3xl font-bold tabular-nums">
                {result.skipped}
              </p>
              <p className="text-sm font-medium">
                Skipped
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-center">
              <p className="text-3xl font-bold tabular-nums">
                {examResult?.status === "complete"
                  ? examResult.assignment.assigned +
                    examResult.assignment.restored
                  : 0}
              </p>
              <p className="text-sm font-medium">
                {assignmentMode ? "Added to exam" : "New records"}
              </p>
            </div>
          </div>

          {examResult?.status === "imported_not_assigned" && (
            <div
              role="alert"
              className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4"
            >
              <p className="font-bold text-amber-900 dark:text-amber-200">
                The directory import succeeded, but exam assignment did not.
              </p>

              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                Your new records are safe. Open the directory,
                select the imported candidates and assign them
                to this examination.
                Do not upload the same list again.
              </p>
            </div>
          )}

          {assignmentMode && result.skipped > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">
                {result.skipped} existing or duplicate records were skipped.
              </p>

              <p className="mt-1 text-sm text-foreground/85">
                Skipped records were not automatically assigned.
                If you want to add an existing {person} to the exam,
                select that person from the directory.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {examResult?.status !== "imported_not_assigned" &&
              examCandidatesHref && (
                <Button asChild>
                  <Link href={examCandidatesHref}>
                    Back to Exam Candidates
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}

            <Button
              asChild
              variant={
                examResult?.status === "imported_not_assigned"
                  ? "default"
                  : "outline"
              }
            >
              <Link href={directoryHref}>
                {assignmentMode
                  ? `Choose Existing ${isSchool ? "Students" : "Candidates"}`
                  : "View Directory"}
              </Link>
            </Button>

            <Button variant="outline" onClick={reset}>
              Import Another List
            </Button>
          </div>
        </div>
      )}

    </section>
  </main>
}
