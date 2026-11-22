import "server-only"

import { notFound, redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { urls } from "@/constants"
import type { ReviewQuestion } from "@/features/exams/results/services/candidate-review-snapshot"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type StaffReviewQuestion = ReviewQuestion & {
  section: string | null
  grading_status: string
}

export type StaffAttemptReview = {
  ok: true
  isSchool: boolean
  candidate: {
    id: string
    first_name: string
    last_name: string
    candidate_code: string | null
  }
  attempt_id: string
  attempt_number: number
  attempt_status: "submitted" | "expired"
  submitted_at: string | null
  closed_at: string | null
  revision: number
  result: {
    earned_points: number
    total_points: number
    percentage: number
    finalized_at: string
  } | null
  questions: StaffReviewQuestion[]
}

export async function getStaffAttemptReview(
  slug: string,
  candidateId: string,
  attemptId: string
) {
  // if (!UUID.test(candidateId) || !UUID.test(attemptId)) notFound()

  const context = await getStaffContext()
  if (!context) redirect(urls.login)
  const exam = await getExamBySlug(slug)

  const { data, error } = await context.supabase.rpc("cbt_staff_attempt_review", {
    p_exam_id: exam.id,
    p_candidate_id: candidateId,
    p_attempt_id: attemptId,
  })

  if (error) {
  console.error("[CBT:STAFF_ATTEMPT_REVIEW]", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    examId: exam.id,
    candidateId,
    attemptId,
  })

  // if (["42501", "P0002"].includes(error.code)) {
  //   notFound()
  // }

  throw new Error(
    "Could not load the staff review. Verify the staff review SQL migration."
  )
}

  // if (error) {
  //   if (["42501", "P0002"].includes(error.code)) notFound()
  //   console.error("[CBT:STAFF_ATTEMPT_REVIEW]", error)
  //   throw new Error("Could not load the staff review. Verify the staff review SQL migration.")
  // }

  const snapshot = data as StaffAttemptReview | { ok: false } | null
  if (!snapshot?.ok || !Array.isArray(snapshot.questions)) notFound()
  return { exam, snapshot: snapshot as StaffAttemptReview }
}
