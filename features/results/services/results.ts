import "server-only"

import { notFound, redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { urls } from "@/constants"

export const RESULT_FILTERS = [
  "all", "in_progress", "submitted", "expired", "pending", "finalized", "released",
] as const
export type ResultFilter = (typeof RESULT_FILTERS)[number]

export type ResultRow = {
  attempt_id: string
  candidate_id: string
  attempt_number: number
  attempt_status: string
  started_at: string | null
  submitted_at: string | null
  closed_at: string | null
  revision: number
  publication_id: string
  first_name: string
  last_name: string
  candidate_code: string | null
  grading_status: string | null
  pending_manual_count: number
  result_id: string | null
  earned_points: number | null
  total_points: number | null
  percentage: number | null
  finalized_at: string | null
  result_released: boolean
  school_assessment_linked: boolean
}

export type ResultSummary = {
  attempts: number
  submitted: number
  inProgress: number
  finalized: number
  pending: number
  manualPending: number
  averagePercentage: number | null
  highestPercentage: number | null
  lowestPercentage: number | null
}

export type ResultPage = {
  isSchool: boolean
  summary: ResultSummary
  total: number
  rows: ResultRow[]
}

export function normalizeFilter(value: string | undefined): ResultFilter {
  return RESULT_FILTERS.includes(value as ResultFilter)
    ? (value as ResultFilter)
    : "all"
}

export async function getResultsPage(
  slug: string,
  args: { search?: string; status?: string; page?: number; limit?: number } = {},
) {
  const exam = await getExamBySlug(slug)
  const context = await getStaffContext()
  if (!context) redirect(urls.login)

  const limit = Math.min(500, Math.max(1, args.limit ?? 20))
  const page = Math.max(1, Math.trunc(args.page ?? 1))
  const search = (args.search ?? "").trim().slice(0, 120)
  const status = normalizeFilter(args.status)

  // This RPC verifies results.manage and reads private tables internally.
  // Do NOT query private.cbt_results directly from the browser.
  const { data, error } = await context.supabase.rpc("cbt_staff_exam_results", {
    p_exam_id: exam.id,
    p_search: search,
    p_status: status,
    p_limit: limit,
    p_offset: (page - 1) * limit,
  })

  if (error) {
    if (error.code === "42501") notFound()
    console.error("[CBT:RESULTS_DASHBOARD]", error)
    throw new Error("Unable to load examination results. Verify that the results RPC is installed.")
  }

  return {
    exam,
    page,
    limit,
    search,
    status,
    data: data as unknown as ResultPage,
  }
}
