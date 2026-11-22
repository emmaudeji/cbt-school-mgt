import "server-only"

import { notFound, redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { urls } from "@/constants"

export type CandidateProfile = {
  id: string
  first_name: string
  last_name: string
  candidate_code: string | null
}

export type SectionPerformance = {
  section_title: string
  earned_points: number | null
  total_points: number
  question_count: number
}

export type PerformanceAttempt = {
  attempt_id: string
  attempt_number: number
  attempt_status: string
  started_at: string | null
  submitted_at: string | null
  closed_at: string | null
  publication_id: string
  revision: number
  grading_status: string | null
  pending_manual_count: number
  provisional_points: number | null
  provisional_total: number | null
  result_id: string | null
  earned_points: number | null
  total_points: number | null
  percentage: number | null
  finalized_at: string | null
  result_released: boolean
  school_assessment_linked: boolean
  sections: SectionPerformance[]
}

export type CandidatePerformanceData = {
  isSchool: boolean
  candidate: CandidateProfile
  attempts: PerformanceAttempt[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getCandidatePerformance(slug: string, candidateId: string) {
  if (!UUID.test(candidateId)) notFound()

  const context = await getStaffContext()
  if (!context) redirect(urls.login)
  const exam = await getExamBySlug(slug)

  const { data, error } = await context.supabase.rpc("cbt_staff_candidate_performance", {
    p_exam_id: exam.id,
    p_candidate_id: candidateId,
  })

  if (error) {
    if (error.code === "42501" || error.code === "P0002") notFound()
    console.error("[CBT:CANDIDATE_PERFORMANCE]", error)
    throw new Error("Unable to load candidate performance. Install the candidate performance RPC.")
  }

  const result = data as unknown as CandidatePerformanceData
  if (!result?.candidate || !Array.isArray(result.attempts)) notFound()
  return { exam, data: result }
}
