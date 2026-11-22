import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck,
  Download, GraduationCap, Hourglass, Search, Users,
} from "lucide-react"
import { urls } from "@/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { getResultsPage, ResultRow, ResultFilter } from "../services/results"

type Props = Awaited<ReturnType<typeof getResultsPage>>

const FILTERS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All attempts" },
  { value: "pending", label: "Awaiting grading" },
  { value: "finalized", label: "Finalized" },
  { value: "released", label: "Released" },
  { value: "submitted", label: "Submitted" },
  { value: "expired", label: "Expired" },
  { value: "in_progress", label: "In progress" },
]

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
      }).format(date)
}

function displayNumber(value: number | null, suffix = "") {
  return value == null ? "—" : `${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}${suffix}`
}

function statusLabel(row: ResultRow) {
  if (row.result_id) return row.result_released ? "Released" : "Finalized"
  if (row.attempt_status === "cancelled") return "Cancelled"
  if (row.attempt_status === "submitted" || row.attempt_status === "expired") {
    return row.pending_manual_count > 0 ? "Manual grading" : "Awaiting grading"
  }
  return row.attempt_status.replaceAll("_", " ")
}

function statusClass(row: ResultRow) {
  if (row.result_id) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
  if (row.attempt_status === "submitted" || row.attempt_status === "expired") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300"
  }
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300"
}

function queryPath(
  slug: string,
  search: string,
  status: ResultFilter,
  page: number,
  exportFile = false,
) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status !== "all") params.set("status", status)
  if (!exportFile && page > 1) params.set("page", String(page))
  const base = `/exams/${encodeURIComponent(slug)}/results`
  const path = exportFile ? `${base}/export` : base
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function Stat({ label, value, icon, tint }: {
  label: string; value: string | number; icon: ReactNode; tint: string
}) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${tint}`}>
      <div className="flex items-center gap-2 text-xs font-medium">{icon}<span>{label}</span></div>
      <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
    </div>
  )
}

export function ResultsDashboard({ exam, data, search, status, page, limit }: Props) {
  const isSchool = data.isSchool
  const candidate = isSchool ? "Student" : "Candidate"
  const pages = Math.max(1, Math.ceil(data.total / limit))
  const currentPage = Math.min(page, pages)
  const summary = data.summary

  return (
    <main className="mx-auto w-full space-y-5 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <Link href={urls.examQuestions(exam.slug)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <ArrowLeft className="size-3.5" /> Exam Questions
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Results & Grading</h1>
          <p className="text-sm text-muted-foreground">{exam.title} · {isSchool ? "Student examination results" : "Candidate examination results"}</p>
        </div>
        <Button asChild size="sm" className="shadow-none">
          <a href={queryPath(exam.slug, search, status, page, true)}>
            <Download className="size-4" /> Download CSV
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Submitted" value={summary.submitted} icon={<Users className="size-4" />} tint="border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300" />
        <Stat label="Finalized" value={summary.finalized} icon={<CheckCircle2 className="size-4" />} tint="border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" />
        <Stat label="Not finalized" value={summary.pending} icon={<Hourglass className="size-4" />} tint="border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300" />
        <Stat label="Manual pending" value={summary.manualPending} icon={<ClipboardCheck className="size-4" />} tint="border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300" />
        <Stat label="Average" value={displayNumber(summary.averagePercentage, "%")} icon={<GraduationCap className="size-4" />} tint="border-primary/25 bg-primary/5 text-foreground" />
        <Stat label="Highest" value={displayNumber(summary.highestPercentage, "%")} icon={<CheckCircle2 className="size-4" />} tint="border-primary/25 bg-primary/5 text-foreground" />
      </div>

      {isSchool && (
        <p className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-xs leading-5 text-foreground/80">
          School results: CBT marks remain separate from term assessments until an authorized assessment import is performed. Rows marked "Linked" have an active published-exam assessment link.
        </p>
      )}

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="space-y-3 border-b bg-muted/30 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">{candidate} results</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{data.total.toLocaleString("en-NG")} matching attempts · Each sitting appears separately</p>
            </div>
          </div>
          <form action={queryPath(exam.slug, "", "all", 1)} method="get" className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input name="search" defaultValue={search} maxLength={120} placeholder={`Search ${candidate.toLowerCase()} or code`} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <select name="status" defaultValue={status} aria-label="Filter by status" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              {FILTERS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Button type="submit" size="sm" className="h-9 shadow-none">Apply filters</Button>
          </form>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-muted/20 text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">{candidate}</th>
                <th className="px-3 py-3 font-semibold">Attempt</th>
                <th className="px-3 py-3 font-semibold">Submitted</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Grading</th>
                {isSchool && <th className="px-3 py-3 font-semibold">Assessment</th>}
                <th className="px-4 py-3 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.rows.map(row => (
                <tr key={row.attempt_id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{`${row.first_name} ${row.last_name}`.trim()}</p>
                    <p className="text-xs text-muted-foreground">{row.candidate_code || "No candidate code"}</p>
                  </td>
                  <td className="px-3 py-3 text-xs">#{row.attempt_number} <span className="text-muted-foreground">· Rev {row.revision}</span></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(row.submitted_at ?? row.closed_at)}</td>
                  <td className="px-3 py-3">
                    {row.result_id ? (
                      <div><span className="font-semibold tabular-nums">{displayNumber(row.earned_points)} / {displayNumber(row.total_points)}</span><p className="text-xs text-muted-foreground">{displayNumber(row.percentage, "%")}</p></div>
                    ) : <span className="text-xs text-muted-foreground">Not finalized</span>}
                  </td>
                  <td className="px-3 py-3"><Badge variant="outline" className={statusClass(row)}>{statusLabel(row)}</Badge></td>
                  {isSchool && <td className="px-3 py-3 text-xs">{row.school_assessment_linked ? <Badge variant="outline" className="border-violet-500/30 text-violet-700 dark:text-violet-300">Linked</Badge> : <span className="text-muted-foreground">Standalone</span>}</td>}
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm" className="h-8 shadow-none">
                      <Link href={urls.examCandidateResultDetails(exam.slug, row.candidate_id, row.attempt_id) }>
                        View performance <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={isSchool ? 7 : 6} className="px-4 py-12 text-center text-sm text-muted-foreground">No attempts match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>Page {currentPage} of {pages}</span>
          <div className="flex gap-2">
            {currentPage > 1 && <Button asChild variant="outline" size="sm" className="h-8 shadow-none"><Link href={queryPath(exam.slug, search, status, currentPage - 1)}>Previous</Link></Button>}
            {currentPage < pages && <Button asChild variant="outline" size="sm" className="h-8 shadow-none"><Link href={queryPath(exam.slug, search, status, currentPage + 1)}>Next <ArrowRight className="size-3.5" /></Link></Button>}
          </div>
        </div>
      </section>
    </main>
  )
}






// import Link from "next/link"
// import type { ReactNode } from "react"
// import {
//   ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck,
//   Download, GraduationCap, Hourglass, Search, Users,
// } from "lucide-react"
// import { urls } from "@/constants"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import type { getResultsPage, ResultRow, ResultFilter } from "../services/results"

// type Props = Awaited<ReturnType<typeof getResultsPage>>

// const FILTERS: { value: ResultFilter; label: string }[] = [
//   { value: "all", label: "All attempts" },
//   { value: "pending", label: "Awaiting grading" },
//   { value: "finalized", label: "Finalized" },
//   { value: "released", label: "Released" },
//   { value: "submitted", label: "Submitted" },
//   { value: "expired", label: "Expired" },
//   { value: "in_progress", label: "In progress" },
// ]

// function formatDate(value: string | null) {
//   if (!value) return "—"
//   const date = new Date(value)
//   return Number.isNaN(date.getTime())
//     ? "—"
//     : new Intl.DateTimeFormat("en-NG", {
//         dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
//       }).format(date)
// }

// function displayNumber(value: number | null, suffix = "") {
//   return value == null ? "—" : `${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}${suffix}`
// }

// function statusLabel(row: ResultRow) {
//   if (row.result_id) return row.result_released ? "Released" : "Finalized"
//   if (row.attempt_status === "cancelled") return "Cancelled"
//   if (row.attempt_status === "submitted" || row.attempt_status === "expired") {
//     return row.pending_manual_count > 0 ? "Manual grading" : "Awaiting grading"
//   }
//   return row.attempt_status.replaceAll("_", " ")
// }

// function statusClass(row: ResultRow) {
//   if (row.result_id) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
//   if (row.attempt_status === "submitted" || row.attempt_status === "expired") {
//     return "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300"
//   }
//   return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300"
// }

// function queryPath(
//   slug: string,
//   search: string,
//   status: ResultFilter,
//   page: number,
//   exportFile = false,
// ) {
//   const params = new URLSearchParams()
//   if (search) params.set("search", search)
//   if (status !== "all") params.set("status", status)
//   if (!exportFile && page > 1) params.set("page", String(page))
//   const base = `/exams/${encodeURIComponent(slug)}/results`
//   const path = exportFile ? `${base}/export` : base
//   const query = params.toString()
//   return query ? `${path}?${query}` : path
// }

// function Stat({ label, value, icon, tint }: {
//   label: string; value: string | number; icon: ReactNode; tint: string
// }) {
//   return (
//     <div className={`min-w-0 rounded-xl border p-3 ${tint}`}>
//       <div className="flex items-center gap-2 text-xs font-medium">{icon}<span>{label}</span></div>
//       <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
//     </div>
//   )
// }

// export function ResultsDashboard({ exam, data, search, status, page, limit }: Props) {
//   const isSchool = data.isSchool
//   const candidate = isSchool ? "Student" : "Candidate"
//   const pages = Math.max(1, Math.ceil(data.total / limit))
//   const currentPage = Math.min(page, pages)
//   const summary = data.summary

//   return (
//     <main className="mx-auto w-full space-y-5 pb-12">
//       <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
//         <div className="space-y-1">
//           <Link href={urls.examQuestions(exam.slug)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
//             <ArrowLeft className="size-3.5" /> Exam Questions
//           </Link>
//           <h1 className="text-xl font-bold tracking-tight text-foreground">Results & Grading</h1>
//           <p className="text-sm text-muted-foreground">{exam.title} · {isSchool ? "Student examination results" : "Candidate examination results"}</p>
//         </div>
//         <Button asChild size="sm" className="shadow-none">
//           <a href={queryPath(exam.slug, search, status, page, true)}>
//             <Download className="size-4" /> Download CSV
//           </a>
//         </Button>
//       </div>

//       <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
//         <Stat label="Submitted" value={summary.submitted} icon={<Users className="size-4" />} tint="border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300" />
//         <Stat label="Finalized" value={summary.finalized} icon={<CheckCircle2 className="size-4" />} tint="border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" />
//         <Stat label="Not finalized" value={summary.pending} icon={<Hourglass className="size-4" />} tint="border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300" />
//         <Stat label="Manual pending" value={summary.manualPending} icon={<ClipboardCheck className="size-4" />} tint="border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300" />
//         <Stat label="Average" value={displayNumber(summary.averagePercentage, "%")} icon={<GraduationCap className="size-4" />} tint="border-primary/25 bg-primary/5 text-foreground" />
//         <Stat label="Highest" value={displayNumber(summary.highestPercentage, "%")} icon={<CheckCircle2 className="size-4" />} tint="border-primary/25 bg-primary/5 text-foreground" />
//       </div>

//       {isSchool && (
//         <p className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-xs leading-5 text-foreground/80">
//           School results: CBT marks remain separate from term assessments until an authorized assessment import is performed. Rows marked "Linked" have an active published-exam assessment link.
//         </p>
//       )}

//       <section className="overflow-hidden rounded-xl border bg-card">
//         <div className="space-y-3 border-b bg-muted/30 p-3 sm:p-4">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <div>
//               <h2 className="text-sm font-bold text-foreground">{candidate} results</h2>
//               <p className="mt-0.5 text-xs text-muted-foreground">{data.total.toLocaleString("en-NG")} matching attempts · Each sitting appears separately</p>
//             </div>
//           </div>
//           <form action={queryPath(exam.slug, "", "all", 1)} method="get" className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
//             <label className="relative block">
//               <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
//               <input name="search" defaultValue={search} maxLength={120} placeholder={`Search ${candidate.toLowerCase()} or code`} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
//             </label>
//             <select name="status" defaultValue={status} aria-label="Filter by status" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring">
//               {FILTERS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
//             </select>
//             <Button type="submit" size="sm" className="h-9 shadow-none">Apply filters</Button>
//           </form>
//         </div>

//         <div className="w-full overflow-x-auto">
//           <table className="w-full min-w-[860px] text-left text-sm">
//             <thead className="bg-muted/20 text-xs text-muted-foreground">
//               <tr className="border-b">
//                 <th className="px-4 py-3 font-semibold">{candidate}</th>
//                 <th className="px-3 py-3 font-semibold">Attempt</th>
//                 <th className="px-3 py-3 font-semibold">Submitted</th>
//                 <th className="px-3 py-3 font-semibold">Score</th>
//                 <th className="px-3 py-3 font-semibold">Grading</th>
//                 {isSchool && <th className="px-3 py-3 font-semibold">Assessment</th>}
//                 <th className="px-4 py-3 text-right font-semibold">Details</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y">
//               {data.rows.map(row => (
//                 <tr key={row.attempt_id} className="hover:bg-muted/20">
//                   <td className="px-4 py-3">
//                     <p className="font-semibold text-foreground">{`${row.first_name} ${row.last_name}`.trim()}</p>
//                     <p className="text-xs text-muted-foreground">{row.candidate_code || "No candidate code"}</p>
//                   </td>
//                   <td className="px-3 py-3 text-xs">#{row.attempt_number} <span className="text-muted-foreground">· Rev {row.revision}</span></td>
//                   <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(row.submitted_at ?? row.closed_at)}</td>
//                   <td className="px-3 py-3">
//                     {row.result_id ? (
//                       <div><span className="font-semibold tabular-nums">{displayNumber(row.earned_points)} / {displayNumber(row.total_points)}</span><p className="text-xs text-muted-foreground">{displayNumber(row.percentage, "%")}</p></div>
//                     ) : <span className="text-xs text-muted-foreground">Not finalized</span>}
//                   </td>
//                   <td className="px-3 py-3"><Badge variant="outline" className={statusClass(row)}>{statusLabel(row)}</Badge></td>
//                   {isSchool && <td className="px-3 py-3 text-xs">{row.school_assessment_linked ? <Badge variant="outline" className="border-violet-500/30 text-violet-700 dark:text-violet-300">Linked</Badge> : <span className="text-muted-foreground">Standalone</span>}</td>}
//                   <td className="px-4 py-3 text-right">
//                     {/* Candidate-detail route is the next module stage; avoid broken links until implemented. */}
//                     <span className="text-xs text-muted-foreground">{row.result_id ? "Finalized" : "Pending"}</span>
//                   </td>
//                 </tr>
//               ))}
//               {data.rows.length === 0 && (
//                 <tr><td colSpan={isSchool ? 7 : 6} className="px-4 py-12 text-center text-sm text-muted-foreground">No attempts match these filters.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
//           <span>Page {currentPage} of {pages}</span>
//           <div className="flex gap-2">
//             {currentPage > 1 && <Button asChild variant="outline" size="sm" className="h-8 shadow-none"><Link href={queryPath(exam.slug, search, status, currentPage - 1)}>Previous</Link></Button>}
//             {currentPage < pages && <Button asChild variant="outline" size="sm" className="h-8 shadow-none"><Link href={queryPath(exam.slug, search, status, currentPage + 1)}>Next <ArrowRight className="size-3.5" /></Link></Button>}
//           </div>
//         </div>
//       </section>
//     </main>
//   )
// }
