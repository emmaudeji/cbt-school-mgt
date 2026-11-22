
"use client"

import { useEffect, useState, useTransition } from "react"
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Search,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


import type {
  ExamCandidateFilter,
  ExamCandidateRosterPage,
  ExamCandidateRow,
} from "../services/exam-candidate-roster"
import { useOrgStore } from "@/store/org-store"
import { DownloadExamCredentialsButton } from "./DownloadExamCredentialsButton"

// Exam Numbers must be supplied by a permission-checked
// server query, never generated or decrypted in React.
type CandidateRow = ExamCandidateRow & {
  exam_number?: string | null
}

type Props = {
  roster: Omit<ExamCandidateRosterPage, "rows"> & {
    rows: CandidateRow[]
  }
  filter: ExamCandidateFilter
  search: string
}

const statusStyles: Record<
  ExamCandidateRow["exam_status"],
  string
> = {
  not_started:
    "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  in_progress:
    "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  submitted:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  closed:
    "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  revoked:
    "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
}

const statusLabels: Record<
  ExamCandidateRow["exam_status"],
  string
> = {
  not_started: "Not started",
  in_progress: "Taking exam",
  submitted: "Submitted",
  closed: "Completed",
  revoked: "Access removed",
}

function dateLabel(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(date)
}

export function ExamCandidateList({
  roster,
  filter,
  search,
}: Props) {
  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [input, setInput] = useState(search)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setInput(search)
  }, [search])

  const filters: {
    value: ExamCandidateFilter
    label: string
  }[] = [
    {
      value: "all",
      label: isSchool ? "All students" : "All candidates",
    },
    { value: "not_started", label: "Not started" },
    { value: "in_progress", label: "Taking exam" },
    { value: "submitted", label: "Submitted" },
    { value: "closed", label: "Completed" },
    { value: "revoked", label: "Access removed" },
  ]

  const pageCount = Math.max(
    1,
    Math.ceil(roster.total / roster.pageSize)
  )

  const first = roster.total
    ? (roster.page - 1) * roster.pageSize + 1
    : 0

  const last = Math.min(
    roster.page * roster.pageSize,
    roster.total
  )

  function navigate(values: {
    page?: number
    filter?: ExamCandidateFilter
    search?: string
  }) {
    const next = new URLSearchParams(params.toString())

    const page = values.page ?? 1
    const nextFilter = values.filter ?? filter
    const nextSearch = values.search ?? search

    if (page > 1) next.set("page", String(page))
    else next.delete("page")

    if (nextFilter !== "all") {
      next.set("status", nextFilter)
    } else {
      next.delete("status")
    }

    if (nextSearch.trim()) {
      next.set("q", nextSearch.trim())
    } else {
      next.delete("q")
    }

    const query = next.toString()

    startTransition(() => {
      router.push(
        query ? `${pathname}?${query}` : pathname
      )
    })
  }

  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-background">

      {/* Header and filters */}
      <div className="flex flex-col gap-3 border-b border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-background">
            <UsersRound className="size-4 text-primary" />
          </div>

          <div>
            <h3 className="text-sm font-bold">
              {isSchool ? "Exam Students" : "Exam Candidates"}
            </h3>

            <p className="text-xs text-foreground/75">
              {roster.total.toLocaleString()} matching{" "}
              {isSchool ? "students" : "candidates"}
            </p>
          </div>
        </div>

        <div className="">
          <DownloadExamCredentialsButton
          />
           
        </div>

        <div className="flex flex-wrap gap-2">
          <form
            className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"
            onSubmit={event => {
              event.preventDefault()
              navigate({ search: input })
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />

            <Input
              value={input}
              onChange={event =>
                setInput(event.target.value)
              }
              placeholder={
                isSchool
                  ? "Search student name"
                  : "Search name or code"
              }
              className="h-9 bg-background pl-9 pr-14 text-sm"
              aria-label={
                isSchool
                  ? "Search exam students"
                  : "Search exam candidates"
              }
            />

            <button
              type="submit"
              disabled={pending}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary disabled:opacity-50"
            >
              Find
            </button>
          </form>

          <Select
            value={filter}
            onValueChange={value =>
              navigate({
                filter: value as ExamCandidateFilter,
              })
            }
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-40 bg-background text-xs">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {filters.map(item => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Candidate list */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-primary/[0.035] text-xs text-foreground/80">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {isSchool ? "Student" : "Candidate"}
              </th>

              <th className="px-4 py-3 font-semibold">
                Exam Number
              </th>

              <th className="px-4 py-3 font-semibold">
                Exam progress
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Attempts
              </th>

              <th className="px-4 py-3 font-semibold">
                Last activity
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-primary/10">
            {roster.rows.map(candidate => {
              const fullName = [
                candidate.first_name,
                candidate.last_name,
              ].filter(Boolean).join(" ")

              const examNumber = candidate.exam_number
              const hasExamNumber = Boolean(examNumber)

              return (
                <tr
                  key={candidate.assignment_id}
                  className="transition-colors hover:bg-primary/[0.035]"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">
                      {fullName}
                    </p>

                    {candidate.candidate_code && (
                      <p className="mt-1 text-xs text-foreground/70">
                        {isSchool
                          ? "Student ID"
                          : "Candidate ID"}
                        :{" "}
                        <span className="font-medium">
                          {candidate.candidate_code}
                        </span>
                      </p>
                    )}
                  </td>

                  {/* Exam Number */}
                  <td className="px-4 py-3">
                    {hasExamNumber ? (
                      <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                        <KeyRound className="size-4 text-primary" />

                        <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                          {examNumber}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-foreground/65">
                        Not available
                      </span>
                    )}
                  </td>

                  {/* Exam status */}
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={statusStyles[candidate.exam_status]}
                    >
                      {candidate.exam_status === "submitted" ? (
                        <CheckCircle2 className="mr-1 size-3" />
                      ) : (
                        <Clock3 className="mr-1 size-3" />
                      )}

                      {statusLabels[candidate.exam_status]}
                    </Badge>
                  </td>

                  {/* Attempts */}
                  <td className="px-4 py-3 text-center font-semibold tabular-nums">
                    {candidate.attempt_count}
                  </td>

                  {/* Activity */}
                  <td className="px-4 py-3 text-xs text-foreground/80">
                    {dateLabel(
                      candidate.last_submitted_at ??
                      candidate.last_started_at ??
                      candidate.assigned_at
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!roster.rows.length && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <UsersRound className="size-7 text-primary/60" />

            <p className="text-sm font-semibold">
              {isSchool
                ? "No students found"
                : "No candidates found"}
            </p>

            <p className="text-xs text-foreground/75">
              Try another search or filter.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 px-3 py-3">
        <p className="text-xs text-foreground/75">
          Showing {first}–{last} of{" "}
          {roster.total.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending || roster.page <= 1}
            onClick={() =>
              navigate({ page: roster.page - 1 })
            }
          >
            <ArrowLeft className="size-3.5" />
            Previous
          </Button>

          <span className="min-w-12 text-center text-xs font-medium tabular-nums">
            {roster.page} / {pageCount}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={pending || roster.page >= pageCount}
            onClick={() =>
              navigate({ page: roster.page + 1 })
            }
          >
            Next
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}












// "use client"

// import { useEffect, useState, useTransition } from "react"
// import { usePathname, useRouter, useSearchParams } from "next/navigation"
// import {
//   ArrowLeft,
//   ArrowRight,
//   CheckCircle2,
//   Clock3,
//   Search,
//   UsersRound,
// } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import type {
//   ExamCandidateFilter,
//   ExamCandidateRosterPage,
//   ExamCandidateRow,
// } from "../services/exam-candidate-roster"

// type Props = {
//   roster: ExamCandidateRosterPage
//   filter: ExamCandidateFilter
//   search: string
// }

// const filters: { value: ExamCandidateFilter; label: string }[] = [
//   { value: "all", label: "All candidates" },
//   { value: "not_started", label: "Not started" },
//   { value: "in_progress", label: "In progress" },
//   { value: "submitted", label: "Submitted" },
//   { value: "closed", label: "Closed" },
//   { value: "revoked", label: "Revoked" },
// ]

// const statusStyles: Record<ExamCandidateRow["exam_status"], string> = {
//   not_started: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
//   in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
//   submitted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
//   closed: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
//   revoked: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
// }

// const statusLabels: Record<ExamCandidateRow["exam_status"], string> = {
//   not_started: "Not started",
//   in_progress: "In progress",
//   submitted: "Submitted",
//   closed: "Closed",
//   revoked: "Revoked",
// }

// function dateLabel(value: string | null) {
//   if (!value) return "—"
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return "—"
//   return new Intl.DateTimeFormat("en-NG", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     timeZone: "Africa/Lagos",
//   }).format(date)
// }

// export function ExamCandidateList({ roster, filter, search }: Props) {
//   const router = useRouter()
//   const pathname = usePathname()
//   const params = useSearchParams()
//   const [input, setInput] = useState(search)
//   const [pending, startTransition] = useTransition()

//   useEffect(() => setInput(search), [search])

//   const pageCount = Math.max(1, Math.ceil(roster.total / roster.pageSize))
//   const first = roster.total ? (roster.page - 1) * roster.pageSize + 1 : 0
//   const last = Math.min(roster.page * roster.pageSize, roster.total)

//   const navigate = (values: { page?: number; filter?: ExamCandidateFilter; search?: string }) => {
//     const next = new URLSearchParams(params.toString())
//     const page = values.page ?? 1
//     const nextFilter = values.filter ?? filter
//     const nextSearch = values.search ?? search

//     if (page > 1) next.set("page", String(page))
//     else next.delete("page")

//     if (nextFilter !== "all") next.set("status", nextFilter)
//     else next.delete("status")

//     if (nextSearch.trim()) next.set("q", nextSearch.trim())
//     else next.delete("q")

//     const query = next.toString()
//     startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
//   }

//   return (
//     <div className="overflow-hidden rounded-xl border border-primary/20 bg-background">
//       <div className="flex flex-col gap-3 border-b border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-center gap-2">
//           <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-background">
//             <UsersRound className="size-4 text-primary" />
//           </div>
//           <div>
//             <p className="text-sm font-semibold">Candidate Roster</p>
//             <p className="text-xs text-foreground/75">{roster.total} matching candidates</p>
//           </div>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <form
//             className="relative min-w-0 flex-1 sm:w-60 sm:flex-none"
//             onSubmit={event => { event.preventDefault(); navigate({ search: input }) }}
//           >
//             <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
//             <Input
//               value={input}
//               onChange={event => setInput(event.target.value)}
//               placeholder="Search name or code"
//               className="h-9 bg-background pl-9 pr-14 text-sm"
//               aria-label="Search examination candidates"
//             />
//             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary" disabled={pending}>
//               Find
//             </button>
//           </form>
//           <Select value={filter} onValueChange={value => navigate({ filter: value as ExamCandidateFilter })} disabled={pending}>
//             <SelectTrigger className="h-9 w-40 bg-background text-xs"><SelectValue placeholder="All candidates" /></SelectTrigger>
//             <SelectContent>
//               {filters.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[660px] text-left text-sm">
//           <thead className="border-b border-primary/15 bg-primary/[0.035] text-xs text-foreground/75">
//             <tr>
//               <th className="px-4 py-3 font-semibold">Candidate</th>
//               <th className="px-4 py-3 font-semibold">Code</th>
//               <th className="px-4 py-3 font-semibold">Exam status</th>
//               <th className="px-4 py-3 text-center font-semibold">Attempts</th>
//               <th className="px-4 py-3 font-semibold">Last activity</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-primary/10">
//             {roster.rows.map(candidate => (
//               <tr key={candidate.assignment_id} className="transition-colors hover:bg-primary/[0.035]">
//                 <td className="px-4 py-3">
//                   <div className="font-semibold">{[candidate.first_name, candidate.last_name].filter(Boolean).join(" ")}</div>
//                   <div className="mt-0.5 text-xs capitalize text-foreground/65">{candidate.source.replaceAll("_", " ")}</div>
//                 </td>
//                 <td className="px-4 py-3 font-mono text-xs">{candidate.candidate_code ?? "—"}</td>
//                 <td className="px-4 py-3">
//                   <Badge variant="outline" className={statusStyles[candidate.exam_status]}>
//                     {candidate.exam_status === "submitted" ? <CheckCircle2 className="mr-1 size-3" /> : <Clock3 className="mr-1 size-3" />}
//                     {statusLabels[candidate.exam_status]}
//                   </Badge>
//                 </td>
//                 <td className="px-4 py-3 text-center font-semibold tabular-nums">{candidate.attempt_count}</td>
//                 <td className="px-4 py-3 text-xs text-foreground/80">
//                   {dateLabel(candidate.last_submitted_at ?? candidate.last_started_at ?? candidate.assigned_at)}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {!roster.rows.length && (
//           <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
//             <UsersRound className="size-7 text-primary/60" />
//             <p className="text-sm font-semibold">No matching candidates</p>
//             <p className="text-xs text-foreground/70">Try another search or filter, or add candidates to this examination.</p>
//           </div>
//         )}
//       </div>

//       <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 px-3 py-3">
//         <p className="text-xs text-foreground/75">Showing {first}–{last} of {roster.total}</p>
//         <div className="flex items-center gap-2">
//           <Button size="sm" variant="outline" disabled={pending || roster.page <= 1} onClick={() => navigate({ page: roster.page - 1 })}>
//             <ArrowLeft className="size-3.5" /> Previous
//           </Button>
//           <span className="min-w-12 text-center text-xs font-medium tabular-nums">{roster.page} / {pageCount}</span>
//           <Button size="sm" variant="outline" disabled={pending || roster.page >= pageCount} onClick={() => navigate({ page: roster.page + 1 })}>
//             Next <ArrowRight className="size-3.5" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
