
"use client"
import {
  assignDirectoryToExamAction,
} from "../services/assign-directory-to-exam"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookUser,
  CheckCircle2,
  FileUp,
  Loader2,
  Search,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ExamDirectoryPage, getCandidateDirectory } from "../services/directory-queries"
import type {
  DirectoryCandidate,
  DirectoryPage,
} from "../services/directory-types"
import { CandidateDirectoryTable } from "./CandidateDirectoryTable"
import { CandidateFormDialog } from "./CandidateFormDialog"
import { useOrgStore } from "@/store/org-store"
import { urls } from "@/constants"

type Status = "all" | "active" | "inactive"

export type DirectoryAssignmentResult =
  | { success: true; assigned?: number }
  | { success: false; error: string }

type Props = {
  initial: ExamDirectoryPage
  examSlug?: string
  publicationId?: string
  returnTo?: string
}

const MAX_SELECTION = 500

export function CandidateDirectory({
  initial,
  examSlug,
  returnTo,
  publicationId
  // onAssign,
}: Props) {
  const organizationId = useOrgStore(
    state => state.organization.id
  )
  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const assignmentMode = Boolean(examSlug)
  const person = isSchool ? "student" : "candidate"
  const people = isSchool ? "students" : "candidates"

  const [data, setData] = useState(initial)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<Status>("all")
  const [page, setPage] = useState(1)

  const [editing, setEditing] =
    useState<DirectoryCandidate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set()
  )
  const [selectionLoaded, setSelectionLoaded] = useState(false)

  const [loading, startLoading] = useTransition()
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectionMessage, setSelectionMessage] =
    useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [assignedCount, setAssignedCount] = useState(0)

  const requestId = useRef(0)

  const storageKey = examSlug
    ? `cbt:exam-selection:${organizationId}:${examSlug}`
    : null

  // Restore only this examination's selections.
  useEffect(() => {
    setSelectionLoaded(false)
    setCompleted(false)

    if (!storageKey) {
      setSelected(new Set())
      setSelectionLoaded(true)
      return
    }

    try {
      const stored = sessionStorage.getItem(storageKey)
      const ids: unknown = stored ? JSON.parse(stored) : []

      setSelected(
        new Set(
          Array.isArray(ids)
            ? ids
                .filter(
                  (id): id is string =>
                    typeof id === "string" &&
                    /^[0-9a-f-]{36}$/i.test(id)
                )
                .slice(0, MAX_SELECTION)
            : []
        )
      )
    } catch {
      setSelected(new Set())
    }

    setSelectionLoaded(true)
  }, [storageKey])

  // Persist across refreshes, filters and pagination.
  useEffect(() => {
    if (!storageKey || !selectionLoaded) return

    try {
      if (selected.size) {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify([...selected])
        )
      } else {
        sessionStorage.removeItem(storageKey)
      }
    } catch {
      // Storage may be disabled; in-memory selection still works.
    }
  }, [selected, storageKey, selectionLoaded])

  const reload = useCallback(
    (nextPage: number, term: string, filter: Status) => {
      const request = ++requestId.current

      startLoading(async () => {
        try {
          const result = await getCandidateDirectory({
            page: nextPage,
            search: term,
            status: filter,
            publicationId,
          })

          if (request !== requestId.current) return

          setData(result)
          setError(null)
        } catch (issue) {
          if (request !== requestId.current) return

          setError(
            issue instanceof Error
              ? issue.message
              : "Unable to load the directory."
          )
        }
      })
    },
    []
  )

  useEffect(() => {
    const timeout = setTimeout(
      () => reload(page, search, status),
      250
    )

    return () => clearTimeout(timeout)
  }, [page, search, status, reload])

  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const changeStatus = (value: Status) => {
    setStatus(value)
    setPage(1)
  }

  const maxPage = Math.max(
    1,
    Math.ceil(data.total / data.pageSize)
  )

  const selectablePageIds = data.rows
  .filter(
    candidate =>
      candidate.status === "active" &&
      candidate.exam_assignment_status !== "assigned"
  )
  .map(candidate => candidate.id)

  const selectedOnPage = selectablePageIds.filter(
    id => selected.has(id)
  ).length

  const allPageSelected =
    selectablePageIds.length > 0 &&
    selectedOnPage === selectablePageIds.length

  const somePageSelected =
    selectedOnPage > 0 && !allPageSelected

  const selectedCount = selected.size
  const limitReached = selectedCount >= MAX_SELECTION

function toggleCandidate(id: string, checked: boolean) {
  const candidate = data.rows.find(item => item.id === id)

  if (
    checked &&
    (!candidate ||
      candidate.status !== "active" ||
      candidate.exam_assignment_status === "assigned")
  ) {
    return
  }

  setSelectionMessage(null)
  setCompleted(false)

  setSelected(previous => {
    const next = new Set(previous)

    if (checked) {
      if (next.size >= MAX_SELECTION) {
        return previous
      }

      next.add(id)
    } else {
      next.delete(id)
    }

    return next
  })
}

  function togglePage(checked: boolean) {
    setSelectionMessage(null)
    setCompleted(false)

    setSelected(previous => {
      const next = new Set(previous)

      if (!checked) {
        selectablePageIds.forEach(id => next.delete(id))
        return next
      }

      const remaining = MAX_SELECTION - next.size
      const missing = selectablePageIds.filter(
        id => !next.has(id)
      )

      missing.slice(0, remaining).forEach(
        id => next.add(id)
      )

      if (missing.length > remaining) {
        setSelectionMessage(
          `Selection limit reached. Assign these ${MAX_SELECTION} ${people} first, then select more.`
        )
      }

      return next
    })
  }

  async function assignSelected() {
    if (!examSlug || !selected.size || assigning) return

    setAssigning(true)
    setError(null)
    setSelectionMessage(null)

    try {
      const result = await assignDirectoryToExamAction(
        examSlug,
        [...selected]
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      setAssignedCount(
        result.assigned +
        result.restored +
        result.alreadyAssigned
      )

      setSelected(new Set())
      setCompleted(true)

      reload(page, search, status)
    } catch {
      setError(
        "Unable to assign the selected candidates. Please try again."
      )
    } finally {
      setAssigning(false)
    }
  }

  const importHref = examSlug
    ? urls.examCandidtatesImport(examSlug)
    : urls.candidatesImport

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-12 sm:px-5">

      {/* Page heading */}
      <header className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
        {returnTo && (
          <Link
            href={returnTo}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to Exam Candidates
          </Link>
        )}

        <div className="flex  leading-tight items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <BookUser className="size-5" />

              <span className="text-xs font-bold uppercase tracking-wide">
                {assignmentMode
                  ? "Exam assignment"
                  : isSchool
                    ? "School directory"
                    : "Candidate directory"}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              {assignmentMode
                ? `Choose Exam ${isSchool ? "Students" : "Candidates"}`
                : isSchool
                  ? "Student Directory"
                  : "Candidate Directory"}
            </h1>

            <p className="text-sm leading-6 text-foreground/85">
              {assignmentMode
                ? `Select the ${people} who should take this examination. You can search, change pages and keep selecting before assigning.`
                : `Manage your organization's ${people}. Each record can be used across different examinations.`}
            </p>
          </div>

          <div className="grid  gap-2">
            <Button asChild variant="outline">
              <Link href={importHref!}>
                <FileUp className="size-4" />
                {assignmentMode
                  ? `Import ${isSchool ? "Students" : "Candidates"}`
                  : "Bulk Import"}
              </Link>
            </Button>

            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <UserRoundPlus className="size-4" />
              Add {isSchool ? "Student" : "Candidate"}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex justify-self-end items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
          <Users className="size-4 text-sky-700 dark:text-sky-300" />

          <span className="text-sm font-semibold tabular-nums">
            {data.total.toLocaleString()}
          </span>

          <span className="text-sm text-foreground/85">
            matching {people}
          </span>
        </div>
      </header>

      {/* Successful assignment */}
      {completed && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <CheckCircle2 className="size-6 shrink-0 text-emerald-700 dark:text-emerald-300" />

            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-bold text-foreground">
                Assignment completed
              </p>

              <p className="text-sm font-medium text-foreground">
                {assignedCount} {people} processed.
                Their examination access is ready.
                You can return to the examination or add more.
              </p>
            </div>

            {returnTo && (
              <Button asChild size="sm">
                <Link href={returnTo}>
                  Back to Exam Candidates
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/65" />

            <Input
              value={search}
              onChange={event =>
                changeSearch(event.target.value)
              }
              placeholder={
                `Search ${people} by name or code`
              }
              className="pl-9"
              aria-label={`Search ${people}`}
            />
          </div>

          <Select
            value={status}
            onValueChange={value =>
              changeStatus(value as Status)
            }
          >
            <SelectTrigger className="w-full bg-background sm:w-44">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection controls */}
        {assignmentMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-background text-primary">
                <Users className="size-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">
                  {selectedCount} {people} selected
                </p>

                <p className="text-xs font-medium text-foreground/80">
                  Up to {MAX_SELECTION} per batch.
                  Selections stay when changing pages.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedCount || assigning}
                onClick={() => {
                  setSelected(new Set())
                  setSelectionMessage(null)
                }}
              >
                <X className="size-4" />
                Clear selection
              </Button>

              <Button
                size="sm"
                disabled={
                  !selectedCount ||
                  assigning ||
                  !selectionLoaded
                }
                onClick={assignSelected}
              >
                {assigning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}

                Assign {selectedCount} {people}
              </Button>
            </div>
          </div>
        )}

        {assignmentMode  && (
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Candidate selection is ready. Assignment will be enabled
            when the examination assignment action is connected.
          </p>
        )}

        {selectionMessage && (
          <p
            role="status"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-foreground"
          >
            {selectionMessage}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        <div
          className={loading ? "opacity-60" : ""}
          aria-busy={loading}
        >
          <CandidateDirectoryTable
            candidates={data.rows}
            onEdit={candidate => {
              setEditing(candidate)
              setDialogOpen(true)
            }}
            isSchool={isSchool}
            assignmentMode={assignmentMode}
            selectedIds={selected}
            onToggle={toggleCandidate}
            onTogglePage={togglePage}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            limitReached={limitReached}
            disabled={assigning || !selectionLoaded}
          />
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-medium text-foreground/75">
            {loading && (
              <Loader2 className="size-3.5 animate-spin" />
            )}

            Page {data.page} of {maxPage} ·{" "}
            {data.total.toLocaleString()} matching {people}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ArrowLeft className="size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={loading || page >= maxPage}
              onClick={() => setPage(p => p + 1)}
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {!assignmentMode && returnTo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">
            Return to your examination when you are done.
          </p>

          <Button asChild size="sm" variant="outline">
            <Link href={returnTo}>
              Back to Exam Candidates
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}

      <CandidateFormDialog
        open={dialogOpen}
        candidate={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false)
          reload(page, search, status)
        }}
      />
    </main>
  )
}
