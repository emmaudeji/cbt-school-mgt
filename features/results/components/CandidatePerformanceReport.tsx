"use client"

import Link from "next/link"
import { useMemo, useRef } from "react"
import {
  ArrowLeft, CalendarDays, CheckCircle2,
  FileDown, GraduationCap, History, Printer, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type {
  CandidatePerformanceData, PerformanceAttempt,
} from "../services/candidate-performance"
import { LinkButton } from "@/components/shared/LinkButton"
import { urls } from "@/constants"
import { PrintButton } from "@/components/shared/PrintButton"

type Props = {
  exam: { slug: string; title: string }
  data: CandidatePerformanceData
  selected: PerformanceAttempt | null
}

function date(value: string | null | undefined) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return "—"
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
  }).format(parsed)
}

function num(value: number | null | undefined) {
  return value == null ? "—" : Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })
}

function attemptLabel(a: PerformanceAttempt) {
  if (a.result_id) return a.result_released ? "Released" : "Finalized"
  if (a.attempt_status === "cancelled") return "Cancelled"
  if (a.attempt_status === "submitted" || a.attempt_status === "expired") {
    return a.pending_manual_count > 0 ? "Manual grading pending" : "Awaiting finalization"
  }
  return a.attempt_status.replaceAll("_", " ")
}

function percent(value: number | null | undefined) {
  return value == null ? "—" : `${num(value)}%`
}

export function CandidatePerformanceReport({ exam, data, selected }: Props) {
  const { candidate, attempts, isSchool } = data
  const noun = isSchool ? "Student" : "Candidate"
  const name = `${candidate.first_name} ${candidate.last_name}`.trim()
  const base = urls.examResults(exam.slug) 
  const candidatePath = `${base}/${encodeURIComponent(candidate.id)}`
  const finalized = useMemo(() => attempts.filter(a => a.result_id !== null), [attempts])
  const best = useMemo(() => finalized.reduce<number | null>((previous, attempt) => {
    if (attempt.percentage == null) return previous
    return previous == null ? Number(attempt.percentage) : Math.max(previous, Number(attempt.percentage))
  }, null), [finalized])
  const canPrint = !!selected?.result_id
  const articleRef = useRef<HTMLElement>(null)
  return (
    <main className="candidate-report mx-auto w-full max-w-5xl space-y-5 pb-12">
      <nav className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to Results
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton contentRef={articleRef} title={`${name}-${exam.title}`} label="Print / Save PDF"/>

          <LinkButton variant={"secondary"} href={urls.examCandidateResultReview(exam.slug, candidate.id, selected?.attempt_id!)}>
            Review Exam
          </LinkButton>
        </div>
      </nav>

      {attempts.length > 0 && (
        <section className="print-hidden rounded-xl border bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Attempt history</h2>
            <Badge variant="secondary">{attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attempts.map(attempt => {
              const active = selected?.attempt_id === attempt.attempt_id
              return (
                <Link key={attempt.attempt_id}
                  href={`${candidatePath}?attempt=${encodeURIComponent(attempt.attempt_id)}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg border p-3 transition-colors hover:bg-muted/40 ${active ? "border-primary bg-primary/5" : "bg-background"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">Attempt #{attempt.attempt_number}</span>
                    <span className={`text-xs ${attempt.result_id ? "text-emerald-700" : "text-muted-foreground"}`}>{attemptLabel(attempt)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Revision {attempt.revision}</span>
                    <span>{attempt.result_id ? `${percent(attempt.percentage)}` : "No final score"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{date(attempt.submitted_at ?? attempt.closed_at ?? attempt.started_at)}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

     
        <article ref={articleRef} className="print-sheet w-full rounded-2xl border bg-white p-5 text-slate-900 shadow-sm sm:p-8">
          <header className="print-section border-b-2 border-slate-800 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{isSchool ? "School Examination Report" : "Candidate Examination Report"}</p>
                <h1 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">{exam.title}</h1>
                <p className="mt-1 text-xs text-slate-500">Performance statement · CBT examination</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold">
                <GraduationCap className="size-4" /> RESULTS
              </div>
            </div>
          </header>

          <section className="print-section mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3">
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">{noun} name</p><p className="mt-1 font-semibold">{name}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">{noun} ID</p><p className="mt-1 break-all font-medium">{candidate.candidate_code || "Not assigned"}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">Attempt</p><p className="mt-1 font-medium">{selected ? `#${selected.attempt_number} · Revision ${selected.revision}` : "—"}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">Started</p><p className="mt-1 font-medium">{date(selected?.started_at)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">Submitted / closed</p><p className="mt-1 font-medium">{date(selected?.submitted_at ?? selected?.closed_at)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-slate-500">Grading status</p><p className="mt-1 font-medium">{selected ? attemptLabel(selected) : "No attempts"}</p></div>
          </section>

          {!selected ? (
            <div className="mt-8 rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">No examination attempts are recorded for this {noun.toLowerCase()}.</div>
          ) : selected.result_id ? (
            <>
              <section className="print-section print-soft mt-6 grid grid-cols-3 gap-3 rounded-lg bg-slate-100 p-4">
                <div><p className="text-[11px] font-medium uppercase text-slate-500">Marks earned</p><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{num(selected.earned_points)}</p></div>
                <div><p className="text-[11px] font-medium uppercase text-slate-500">Maximum marks</p><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{num(selected.total_points)}</p></div>
                <div><p className="text-[11px] font-medium uppercase text-slate-500">Percentage</p><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{percent(selected.percentage)}</p></div>
              </section>
              <section className="print-section mt-6">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4" /><h2 className="print-page-heading text-sm font-bold uppercase tracking-wide">Section performance</h2></div>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="print-soft bg-slate-100 text-slate-700">
                      <tr><th className="px-3 py-2 font-semibold">Section</th><th className="px-3 py-2 text-right font-semibold">Questions</th><th className="px-3 py-2 text-right font-semibold">Score</th><th className="px-3 py-2 text-right font-semibold">%</th></tr>
                    </thead>
                    <tbody>
                      {selected.sections.map((section, index) => {
                        const p = section.earned_points != null && Number(section.total_points) > 0
                          ? (Number(section.earned_points) / Number(section.total_points)) * 100 : null
                        return <tr key={`${index}-${section.section_title}`} className="border-t border-slate-200">
                          <td className="px-3 py-2">{section.section_title}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{section.question_count}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{num(section.earned_points)} / {num(section.total_points)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{percent(p)}</td>
                        </tr>
                      })}
                      {selected.sections.length === 0 && <tr><td colSpan={4} className="px-3 py-5 text-center text-slate-500">No section breakdown available.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="print-section mt-6 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Finalized on {date(selected.finalized_at)}. {selected.result_released ? "Released result." : "Staff report; not yet released to the candidate."}</span>
              </section>
            </>
          ) : (
            <div className="print-section mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <strong>Official result not yet available.</strong>
              <p className="mt-1">{selected.pending_manual_count > 0
                ? `${selected.pending_manual_count} written question(s) still require marking.`
                : selected.attempt_status === "in_progress"
                  ? "This examination is still in progress."
                  : "This attempt is awaiting grading finalization."}</p>
            </div>
          )}

          <footer className="print-footer mt-8 hidden border-t border-slate-200 pt-3 text-[10px] text-slate-500">
            <div className="flex justify-between gap-3"><span>{exam.title} · {name}</span><span>Generated from the examination results system</span></div>
          </footer>
        </article>
  

      <section className="print-hidden grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm"><History className="size-4 text-muted-foreground" /><span>{attempts.length} total attempt(s)</span></div>
        <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-muted-foreground" /><span>{finalized.length} finalized</span></div>
        <div className="flex items-center gap-2 text-sm"><CalendarDays className="size-4 text-muted-foreground" /><span>Best finalized: {percent(best)}</span></div>
      </section>
      <p className="print-hidden flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileDown className="size-4" /> Select a finalized attempt, then choose Print / Save PDF. In the print dialog, select “Save as PDF”; the page is formatted for A4.
      </p>
    </main>
  )
}
