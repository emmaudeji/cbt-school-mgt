"use server"

import { getPublicExamClient } from "@/features/exams/services/public-exam-client"
import { getAttemptTokenHash } from "@/features/exams/attempts/services/attempt-player"
import { issueReviewReceipt } from "@/features/exams/results/services/review-receipt"

type SubmitExamResult = {
  success: boolean
  status?: "submitted" | "expired"
  error?: string
}

const validId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function submitExamAttemptAction(
  code: string,
  attemptId: string
): Promise<SubmitExamResult> {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{6,32}$/.test(normalized) || !validId(attemptId)) {
    return { success: false, error: "Invalid examination request" }
  }

  const tokenHash = await getAttemptTokenHash(normalized)
  if (!tokenHash) {
    return { success: false, error: "Your examination session has expired" }
  }

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_submit_exam_attempt",
    { p_token_hash: tokenHash, p_attempt_id: attemptId }
  )

  if (error) {
    console.error("[CBT:SUBMIT_ATTEMPT]", error)
    return { success: false, error: "Could not submit the examination" }
  }

  if (!data?.ok) {
    return {
      success: false,
      error: data?.reason === "unauthorized"
        ? "Your examination session is no longer valid"
        : "This attempt could not be submitted",
    }
  }

  // The grading trigger has already created the snapshot in the same SQL
  // transaction when grading is final. An independent HttpOnly receipt now
  // grants temporary access without continuing the exam session.
  // A pending-manual result has no snapshot yet; receipt issuance can be
  // retried once manual grading is finished.
  try {
    await issueReviewReceipt(normalized, attemptId)
  } catch (receiptError) {
    // Submission remains successful. Do not risk a duplicate submission.
    console.error("[CBT:REVIEW_RECEIPT_AFTER_SUBMIT]", receiptError)
  }

  return {
    success: true,
    status: data.status as "submitted" | "expired",
  }
}
