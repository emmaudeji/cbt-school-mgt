import "server-only"

import { getPublicExamClient } from "@/features/exams/services/public-exam-client"
import { getReviewReceipt } from "./review-receipt"

export type ReviewOption = {
  id: string
  number: number
  text: string
  selected: boolean
  correct: boolean
}

export type ReviewQuestion = {
  id: string
  number: number
  type: "single_choice" | "multiple_choice" | "true_false" | "free_text"
  prompt: string
  explanation: string | null
  max_points: number
  awarded_points: number | null
  answer_text: string
  options: ReviewOption[]
}

export type CandidateReviewSnapshot = {
  ok: true
  attempt_id: string
  expires_at: string
  result_enabled: boolean
  review_enabled: boolean
  review_ready: boolean
  result: {
    attempt_number: number
    status: "submitted" | "expired"
    grading_status: "scored"
    awarded_points: number
    total_max_points: number
    pending_manual_count: number
  } | null
  questions: ReviewQuestion[]
}

export async function getCandidateReviewSnapshot(
  code: string,
  attemptId: string,
  includeReview = false
): Promise<CandidateReviewSnapshot | null> {
  const tokenHash = await getReviewReceipt(code, attemptId)
  if (!tokenHash) return null

  const { data, error } = await getPublicExamClient().rpc("cbt_get_review_snapshot", {
    p_ticket_hash: tokenHash,
    p_attempt_id: attemptId,
    p_include_review: includeReview,
  })

  if (error) {
    console.error("[CBT:REVIEW_SNAPSHOT]", error)
    throw new Error("Unable to load examination review")
  }
  return data?.ok ? (data as CandidateReviewSnapshot) : null
}
