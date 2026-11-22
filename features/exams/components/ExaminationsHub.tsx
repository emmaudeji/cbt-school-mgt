
"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FilePenLine,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { DuplicateExamDialog } from "./DuplicateExamDialog"
import { DeleteExamDialog } from "./DeleteExamDialog"

import type {
  ExamIndexResult,
  ExamIndexItem,
  ExamIndexStatus,
} from "../services/exam-index-query"

type Props = {
  result: ExamIndexResult
}

const filters = [
  { value: "all", label: "All exams" },
  { value: "draft", label: "Drafts" },
  { value: "active", label: "Published" },
  { value: "archived", label: "Archived" },
] as const

function formatDate(value: string | null) {
  if (!value) return "Not scheduled"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Invalid schedule"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "No duration"

  if (seconds % 3600 === 0) {
    return `${seconds / 3600} hr`
  }

  return `${Math.round(seconds / 60)} min`
}

function statusLabel(status: ExamIndexStatus) {
  if (status === "active") return "Published"
  if (status === "draft") return "Draft"

  return "Archived"
}

function availability(exam: ExamIndexItem, now: number) {
  if (exam.status !== "active") {
    return "Not open to candidates"
  }

  const start = exam.available_from
    ? new Date(exam.available_from).getTime()
    : NaN

  const end = exam.available_until
    ? new Date(exam.available_until).getTime()
    : NaN

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "Schedule incomplete"
  }

  if (now < start) return "Starts later"
  if (now >= end) return "Closed"

  return "Within exam window"
}

function ExamRow({
  exam,
  now,
}: {
  exam: ExamIndexItem
  now: number
}) {
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const base = `/exams/${encodeURIComponent(exam.slug)}`

  const canDelete =
    exam.status === "draft" &&
    exam.latest_revision === null

  return (
    <article className="rounded-xl border border-primary/20 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.025]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/25 bg-primary/10 text-foreground shadow-none"
            >
              {statusLabel(exam.status)}
            </Badge>

            {exam.latest_revision !== null && (
              <Badge
                variant="outline"
                className="border-primary/15 text-foreground/80 shadow-none"
              >
                Revision {exam.latest_revision}
              </Badge>
            )}

            <span className="text-xs font-medium text-foreground/75">
              {availability(exam, now)}
            </span>
          </div>

          <Link
            href={base}
            className="block w-fit max-w-full text-base font-semibold text-foreground hover:text-primary hover:underline"
          >
            {exam.title}
          </Link>

          {exam.description && (
            <p className="line-clamp-2 text-sm text-foreground/75">
              {exam.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5 text-primary" />
              {formatDuration(exam.duration_seconds)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" />
              Opens: {formatDate(exam.available_from)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" />
              Closes: {formatDate(exam.available_until)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
          <Button
            asChild
            size="sm"
            variant={exam.status === "draft" ? "default" : "outline"}
            className="shadow-none"
          >
            <Link
              href={
                exam.status === "draft"
                  ? `${base}/settings`
                  : base
              }
            >
              {exam.status === "draft" ? (
                <FilePenLine className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}

              {exam.status === "draft"
                ? "Continue setup"
                : "Open exam"}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 border-primary/25 shadow-none"
                aria-label={`More actions for ${exam.title}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 border-primary/20 shadow-none"
            >
              <DropdownMenuLabel>
                Examination actions
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link href={base}>
                  <FileText className="mr-2 size-4" />
                  Overview
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`${base}/settings`}>
                  <Settings2 className="mr-2 size-4" />
                  Settings & publishing
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`${base}/questions`}>
                  <BookOpen className="mr-2 size-4" />
                  Add Questions
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`${base}/candidates`}>
                  <Users className="mr-2 size-4" />
                  Candidates & access
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => setDuplicateOpen(true)}
              >
                <Copy className="mr-2 size-4" />
                Duplicate / Reuse
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {canDelete ? (
                <DropdownMenuItem
                  onSelect={() => setDeleteOpen(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Examination
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled
                  className="opacity-60"
                  title="Only unpublished draft examinations can be permanently deleted."
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete unavailable
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DuplicateExamDialog
        source={{
          id: exam.id,
          title: exam.title,
        }}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />

      {canDelete && (
        <DeleteExamDialog
          exam={{
            id: exam.id,
            slug: exam.slug,
            title: exam.title,
          }}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </article>
  )
}

export function ExaminationsHub({ result }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [search, setSearch] = useState(result.query)
  const [now] = useState(() => Date.now())

  const pageCount = Math.max(
    1,
    Math.ceil(result.total / result.pageSize)
  )

  function linkTo(next: {
    q?: string
    status?: string
    page?: number
  }) {
    const params = new URLSearchParams()

    const q = next.q ?? result.query
    const status = next.status ?? result.status

    if (q.trim()) {
      params.set("q", q.trim())
    }

    if (status !== "all") {
      params.set("status", status)
    }

    const page = next.page ?? 1

    if (page > 1) {
      params.set("page", String(page))
    }

    const suffix = params.toString()

    return suffix
      ? `${pathname}?${suffix}`
      : pathname
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    router.push(
      linkTo({
        q: search,
        page: 1,
      })
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Examinations
          </h1>

          <p className="text-sm text-foreground/75">
            Find, manage and publish examinations for your organization.
          </p>
        </div>

        <Button asChild className="shadow-none">
          <Link href="/exams/new">
            <Plus className="size-4" />
            Create examination
          </Link>
        </Button>
      </header>

      <section className="rounded-xl border border-primary/20 bg-primary/[0.035] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">
            {result.total}{" "}
            {result.total === 1
              ? "examination"
              : "examinations"}
          </div>

          <p className="text-xs text-foreground/75">
            Existing attempts and results remain tied
            to their published revision.
          </p>
        </div>

        <div className="mt-3">
          <form
            onSubmit={onSearch}
            className="flex w-full max-w-lg items-center gap-2"
          >
            <label className="relative block min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />

              <span className="sr-only">
                Search examinations by title
              </span>

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search examination titles"
                className="border-primary/25 bg-background pl-9"
              />
            </label>

            <Button
              type="submit"
              variant="outline"
              className="border-primary/25 shadow-none"
            >
              Search
            </Button>
          </form>
        </div>

        <nav
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Filter examinations"
        >
          {filters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={
                result.status === filter.value
                  ? "default"
                  : "outline"
              }
              className={
                result.status === filter.value
                  ? "shadow-none"
                  : "border-primary/20 shadow-none"
              }
              asChild
            >
              <Link
                href={linkTo({
                  status: filter.value,
                  page: 1,
                })}
              >
                {filter.label}
              </Link>
            </Button>
          ))}
        </nav>
      </section>

      <section
        aria-label="Examination list"
        className="space-y-3"
      >
        {result.exams.length > 0 ? (
          result.exams.map((exam) => (
            <ExamRow
              key={exam.id}
              exam={exam}
              now={now}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-5 py-14 text-center">
            <BookOpen className="mx-auto size-8 text-primary" />

            <h2 className="mt-3 font-semibold">
              No examinations found
            </h2>

            <p className="mt-1 text-sm text-foreground/75">
              Try another title or status filter,
              or create an examination.
            </p>

            <Button
              asChild
              variant="outline"
              className="mt-4 border-primary/25 shadow-none"
            >
              <Link href={pathname}>
                Clear filters
              </Link>
            </Button>
          </div>
        )}
      </section>

      {pageCount > 1 && (
        <nav
          aria-label="Examination pages"
          className="flex items-center justify-between gap-3 border-t border-primary/15 pt-4"
        >
          <p className="text-sm text-foreground/75">
            Page {result.page} of {pageCount}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              asChild={result.page > 1}
              disabled={result.page <= 1}
              className="border-primary/25 shadow-none"
            >
              {result.page > 1 ? (
                <Link
                  href={linkTo({
                    page: result.page - 1,
                  })}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Link>
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  Previous
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              asChild={result.page < pageCount}
              disabled={result.page >= pageCount}
              className="border-primary/25 shadow-none"
            >
              {result.page < pageCount ? (
                <Link
                  href={linkTo({
                    page: result.page + 1,
                  })}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </nav>
      )}
    </main>
  )
}
