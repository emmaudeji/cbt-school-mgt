
"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock3,
  KeyRound, Search, UserRoundCheck, UsersRound,
  Globe2, UserRoundPlus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

import type {
  ExamCandidateFilter,
  ExamCandidateRosterPage,
  ExamCandidateRow,
} from "../services/exam-candidate-roster"

import { DownloadExamCredentialsButton } from "./DownloadExamCredentialsButton"

type CandidateRow = ExamCandidateRow & {
  exam_number?: string | null
}

type Props = {
  roster: Omit<ExamCandidateRosterPage, "rows"> & {
    rows: CandidateRow[]
  }
  filter: ExamCandidateFilter
  search: string
  isSchoolExam?: boolean
  accessMode: "registered" | "access_code" | "open_link" | null
  assignmentUrl?: string
}

const statusStyles: Record<ExamCandidateRow["exam_status"], string> = {
  not_started: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  submitted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  closed: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  revoked: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
}

const statusLabels: Record<ExamCandidateRow["exam_status"], string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  closed: "Completed",
  revoked: "Revoked",
}

const accessLabels = {
  registered: "Account Sign-in",
  access_code: "Exam Number",
  open_link: "Public Link",
}

function formatDate(value: string | null | undefined) {
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

function AccessCell({ mode }: {
  mode: Props["accessMode"]
}) {
  if (mode === "registered") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <UserRoundCheck className="size-4 text-violet-600" />
        Account Sign-in
      </span>
    )
  }

  if (mode === "access_code") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <KeyRound className="size-4 text-blue-600" />
        Exam Number
      </span>
    )
  }

  if (mode === "open_link") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <Globe2 className="size-4 text-emerald-600" />
        Public Link
      </span>
    )
  }

  return <span className="text-xs text-muted-foreground">—</span>
}

export function ExamCandidateList({
  roster,
  filter,
  search,
  isSchoolExam = false,
  accessMode,
  assignmentUrl,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [input, setInput] = useState(search)
  const [pending, startTransition] = useTransition()

  useEffect(() => setInput(search), [search])

  const filters: {
    value: ExamCandidateFilter
    label: string
  }[] = [
    { value: "all", label: "All" },
    { value: "not_started", label: "Not Started" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "closed", label: "Completed" },
    { value: "revoked", label: "Revoked" },
  ]

  const pages = Math.max(
    1,
    Math.ceil(roster.total / Math.max(roster.pageSize, 1))
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
    const params = new URLSearchParams(searchParams.toString())

    const nextPage = values.page ?? 1
    const nextFilter = values.filter ?? filter
    const nextSearch = (values.search ?? search)
      .trim()
      .slice(0, 120)

    if (nextPage > 1) {
      params.set("page", String(nextPage))
    } else {
      params.delete("page")
    }

    if (nextFilter !== "all") {
      params.set("status", nextFilter)
    } else {
      params.delete("status")
    }

    if (nextSearch) {
      params.set("q", nextSearch)
    } else {
      params.delete("q")
    }

    const query = params.toString()

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="space-y-3 border-b bg-primary/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <UsersRound className="size-4" />
            </span>

            <div>
              <h3 className="text-sm font-bold">
                {isSchoolExam ? "Student Roster" : "Candidate Roster"}
              </h3>

              <p className="text-xs text-foreground/75">
                {roster.total.toLocaleString()} matching records
              </p>
            </div>
          </div>

          {accessMode === "access_code" && (
            <DownloadExamCredentialsButton />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <form
            className="relative min-w-0 flex-1"
            onSubmit={event => {
              event.preventDefault()
              navigate({ search: input })
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/55" />

            <Input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Search name or candidate ID"
              aria-label="Search assigned candidates"
              className="h-9 bg-background pl-9 pr-14 shadow-none"
            />

            <button
              type="submit"
              disabled={pending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary disabled:opacity-50"
            >
              Find
            </button>
          </form>

          <Select
            value={filter}
            disabled={pending}
            onValueChange={value =>
              navigate({ filter: value as ExamCandidateFilter })
            }
          >
            <SelectTrigger className="h-9 w-40 bg-background text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {filters.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={`overflow-x-auto transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
      >
        <table className="w-full min-w-[690px] text-left text-sm">
          <thead className="border-b bg-muted/30 text-xs">
            <tr>
              <th className="px-3 py-3 font-semibold">
                {isSchoolExam ? "Student" : "Candidate"}
              </th>
              <th className="px-3 py-3 font-semibold">Access</th>
              <th className="px-3 py-3 font-semibold">Exam Status</th>
              <th className="px-3 py-3 text-center font-semibold">
                Attempts
              </th>
              <th className="px-3 py-3 font-semibold">
                Last Activity
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {roster.rows.map(candidate => (
              <tr
                key={candidate.assignment_id}
                className="hover:bg-primary/[0.035]"
              >
                <td className="px-3 py-3">
                  <p className="font-semibold">
                    {[candidate.first_name, candidate.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </p>

                  {candidate.candidate_code && (
                    <p className="mt-0.5 text-xs text-foreground/70">
                      Candidate ID: {candidate.candidate_code}
                    </p>
                  )}
                </td>

                <td className="px-3 py-3">
                  <AccessCell mode={accessMode} />
                </td>

                <td className="px-3 py-3">
                  <Badge
                    variant="outline"
                    className={statusStyles[candidate.exam_status]}
                  >
                    {candidate.exam_status === "submitted" ||
                    candidate.exam_status === "closed" ? (
                      <CheckCircle2 className="mr-1 size-3" />
                    ) : (
                      <Clock3 className="mr-1 size-3" />
                    )}
                    {statusLabels[candidate.exam_status]}
                  </Badge>
                </td>

                <td className="px-3 py-3 text-center font-semibold tabular-nums">
                  {candidate.attempt_count}
                </td>

                <td className="px-3 py-3 text-xs text-foreground/80">
                  {formatDate(
                    candidate.last_submitted_at ??
                    candidate.last_started_at ??
                    candidate.assigned_at
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {roster.rows.length === 0 && (
          <div className="px-4 py-10 text-center">
            <UsersRound className="mx-auto size-7 text-primary" />

            <p className="mt-2 text-sm font-bold">
              {search || filter !== "all"
                ? "No matching candidates"
                : "No candidates assigned yet"}
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-foreground/75">
              {search || filter !== "all"
                ? "Try another search or change the status filter."
                : "Only successfully assigned candidates appear here. You can add students using the assignment page."}
            </p>

            {!search &&
              filter === "all" &&
              isSchoolExam &&
              assignmentUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 shadow-none"
                >
                  <Link href={assignmentUrl}>
                    <UserRoundPlus className="size-4" />
                    Assign Students
                  </Link>
                </Button>
              )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3">
        <p className="text-xs text-foreground/75">
          Showing {first}–{last} of{" "}
          {roster.total.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || roster.page <= 1}
            onClick={() =>
              navigate({ page: roster.page - 1 })
            }
            className="shadow-none"
          >
            <ArrowLeft className="size-3.5" />
            Previous
          </Button>

          <span className="min-w-12 text-center text-xs font-semibold tabular-nums">
            {roster.page} / {pages}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || roster.page >= pages}
            onClick={() =>
              navigate({ page: roster.page + 1 })
            }
            className="shadow-none"
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
//   ArrowLeft, ArrowRight, CheckCircle2,
//   Clock3, KeyRound, Search, UsersRound,
// } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Select, SelectContent, SelectItem,
//   SelectTrigger, SelectValue,
// } from "@/components/ui/select"

// import type {
//   ExamCandidateFilter, ExamCandidateRosterPage, ExamCandidateRow,
// } from "../services/exam-candidate-roster"

// import { DownloadExamCredentialsButton } from "./DownloadExamCredentialsButton"

// type CandidateRow = ExamCandidateRow & {
//   exam_number?: string | null
// }

// type Props = {
//   roster: Omit<ExamCandidateRosterPage, "rows"> & {
//     rows: CandidateRow[]
//   }
//   filter: ExamCandidateFilter
//   search: string
//   isSchoolExam?: boolean
// }

// const statusStyles: Record<ExamCandidateRow["exam_status"], string> = {
//   not_started: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
//   in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
//   submitted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
//   closed: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
//   revoked: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
// }

// const statusLabels: Record<ExamCandidateRow["exam_status"], string> = {
//   not_started: "Not Started",
//   in_progress: "In Progress",
//   submitted: "Submitted",
//   closed: "Completed",
//   revoked: "Revoked",
// }

// function formatDate(value: string | null) {
//   if (!value) return "—"
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return "—"
//   return new Intl.DateTimeFormat("en-NG", {
//     day: "numeric", month: "short", year: "numeric",
//     hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
//   }).format(date)
// }

// export function ExamCandidateList({
//   roster, filter, search, isSchoolExam = false,
// }: Props) {
//   const router = useRouter()
//   const pathname = usePathname()
//   const searchParams = useSearchParams()
//   const [input, setInput] = useState(search)
//   const [pending, startTransition] = useTransition()

//   useEffect(() => setInput(search), [search])

//   const filters: { value: ExamCandidateFilter; label: string }[] = [
//     { value: "all", label: isSchoolExam ? "All Students" : "All Candidates" },
//     { value: "not_started", label: "Not Started" },
//     { value: "in_progress", label: "In Progress" },
//     { value: "submitted", label: "Submitted" },
//     { value: "closed", label: "Completed" },
//     { value: "revoked", label: "Revoked" },
//   ]

//   const pages = Math.max(1, Math.ceil(roster.total / roster.pageSize))
//   const first = roster.total ? (roster.page - 1) * roster.pageSize + 1 : 0
//   const last = Math.min(roster.page * roster.pageSize, roster.total)

//   function navigate(values: {
//     page?: number
//     filter?: ExamCandidateFilter
//     search?: string
//   }) {
//     const params = new URLSearchParams(searchParams.toString())
//     const page = values.page ?? 1
//     const nextFilter = values.filter ?? filter
//     const nextSearch = (values.search ?? search).trim().slice(0, 120)

//     if (page > 1) params.set("page", String(page))
//     else params.delete("page")
//     if (nextFilter !== "all") params.set("status", nextFilter)
//     else params.delete("status")
//     if (nextSearch) params.set("q", nextSearch)
//     else params.delete("q")

//     const query = params.toString()
//     startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
//   }

//   return (
//     <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
//       <div className="space-y-3 border-b bg-primary/5 p-3">
//         <div className="flex flex-wrap items-center justify-between gap-2">
//           <div className="flex items-center gap-2">
//             <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
//               <UsersRound className="size-4" />
//             </span>
//             <div>
//               <h3 className="text-sm font-bold">
//                 {isSchoolExam ? "Student Roster" : "Candidate Roster"}
//               </h3>
//               <p className="text-xs text-foreground/75">
//                 {roster.total.toLocaleString()} matching records
//               </p>
//             </div>
//           </div>
//           <DownloadExamCredentialsButton />
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <form className="relative min-w-0 flex-1"
//             onSubmit={event => {
//               event.preventDefault()
//               navigate({ search: input })
//             }}>
//             <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/55" />
//             <Input value={input} onChange={e => setInput(e.target.value)}
//               placeholder={isSchoolExam ? "Search student name" : "Search name or code"}
//               aria-label="Search examination roster"
//               className="h-9 bg-background pl-9 pr-14 shadow-none" />
//             <button type="submit" disabled={pending}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary disabled:opacity-50">
//               Find
//             </button>
//           </form>

//           <Select value={filter} disabled={pending}
//             onValueChange={value => navigate({ filter: value as ExamCandidateFilter })}>
//             <SelectTrigger className="h-9 w-39 bg-background text-xs shadow-none">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               {filters.map(item => (
//                 <SelectItem key={item.value} value={item.value}>
//                   {item.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className={`overflow-x-auto ${pending ? "opacity-60" : ""}`}>
//         <table className="w-full min-w-[700px] text-left text-sm">
//           <thead className="border-b bg-muted/30 text-xs">
//             <tr>
//               <th className="px-3 py-3 font-semibold">
//                 {isSchoolExam ? "Student" : "Candidate"}
//               </th>
//               <th className="px-3 py-3 font-semibold">Exam Number</th>
//               <th className="px-3 py-3 font-semibold">Progress</th>
//               <th className="px-3 py-3 text-center font-semibold">Attempts</th>
//               <th className="px-3 py-3 font-semibold">Last Activity</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y">
//             {roster.rows.map(candidate => (
//               <tr key={candidate.assignment_id} className="hover:bg-primary/[0.035]">
//                 <td className="px-3 py-3">
//                   <p className="font-semibold">
//                     {[candidate.first_name, candidate.last_name].filter(Boolean).join(" ")}
//                   </p>
//                   {candidate.candidate_code && (
//                     <p className="mt-0.5 text-xs text-foreground/75">
//                       {isSchoolExam ? "Student ID" : "Candidate ID"}: {candidate.candidate_code}
//                     </p>
//                   )}
//                 </td>
//                 <td className="px-3 py-3">
//                   {candidate.exam_number ? (
//                     <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-1.5 font-mono text-xs font-bold tracking-wider">
//                       <KeyRound className="size-3.5 text-blue-600" />
//                       {candidate.exam_number}
//                     </span>
//                   ) : (
//                     <span className="text-xs text-foreground/65">Not available</span>
//                   )}
//                 </td>
//                 <td className="px-3 py-3">
//                   <Badge variant="outline" className={statusStyles[candidate.exam_status]}>
//                     {candidate.exam_status === "submitted" || candidate.exam_status === "closed"
//                       ? <CheckCircle2 className="mr-1 size-3" />
//                       : <Clock3 className="mr-1 size-3" />}
//                     {statusLabels[candidate.exam_status]}
//                   </Badge>
//                 </td>
//                 <td className="px-3 py-3 text-center font-semibold tabular-nums">
//                   {candidate.attempt_count}
//                 </td>
//                 <td className="px-3 py-3 text-xs text-foreground/80">
//                   {formatDate(
//                     candidate.last_submitted_at ??
//                     candidate.last_started_at ??
//                     candidate.assigned_at
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {!roster.rows.length && (
//           <div className="px-4 py-10 text-center">
//             <UsersRound className="mx-auto size-7 text-primary" />
//             <p className="mt-2 text-sm font-bold">No matching records</p>
//             <p className="mt-1 text-xs text-foreground/75">
//               Try another search, filter or assignment method.
//             </p>
//           </div>
//         )}
//       </div>

//       <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3">
//         <p className="text-xs text-foreground/75">
//           Showing {first}–{last} of {roster.total.toLocaleString()}
//         </p>
//         <div className="flex items-center gap-2">
//           <Button size="sm" variant="outline" className="shadow-none"
//             disabled={pending || roster.page <= 1}
//             onClick={() => navigate({ page: roster.page - 1 })}>
//             <ArrowLeft className="size-3.5" /> Previous
//           </Button>
//           <span className="min-w-12 text-center text-xs font-semibold tabular-nums">
//             {roster.page} / {pages}
//           </span>
//           <Button size="sm" variant="outline" className="shadow-none"
//             disabled={pending || roster.page >= pages}
//             onClick={() => navigate({ page: roster.page + 1 })}>
//             Next <ArrowRight className="size-3.5" />
//           </Button>
//         </div>
//       </div>
//     </section>
//   )
// }
 