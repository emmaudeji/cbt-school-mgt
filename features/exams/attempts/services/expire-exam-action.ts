"use server"

import { createHash } from "node:crypto"
import { cookies } from "next/headers"

import { getPublicExamClient } from "@/features/exams/services/public-exam-client"

import { issueReviewReceipt } from  "@/features/exams/results/services/review-receipt"
import { autoSyncFinalizedAttempt } from "./auto-sync-result"

const validCode = /^[A-Z0-9]{6,32}$/
const validId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ExpireExamResult =
  | {
      success: true
      status: "submitted" | "expired"
      resultFinalized: boolean
    }
  | {
      success: false
      error: string
      retryable?: boolean
    }

export async function expireExamAttemptAction(
  code: string,
  attemptId: string
): Promise<ExpireExamResult> {
  const normalized = code.trim().toUpperCase()

  if (
    !validCode.test(normalized) ||
    !validId.test(attemptId)
  ) {
    return {
      success: false,
      error: "Invalid examination request.",
    }
  }

  // Read the original secure cookie directly.
  // Do NOT use getAttemptTokenHash() here because
  // that helper rejects expired examination sessions.
  const store = await cookies()
  const token =
    store.get(`cbt_open_${normalized}`)?.value

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return {
      success: false,
      error:
        "Your examination credential is unavailable. Contact your examiner.",
    }
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex")

  const { data, error } = await getPublicExamClient()
    .rpc("cbt_expire_exam_attempt", {
      p_token_hash: tokenHash,
      p_attempt_id: attemptId,
    })

  if (error) {
    console.error("[CBT:EXPIRE_ATTEMPT]", error)

    return {
      success: false,
      error: "Could not complete the expired examination.",
      retryable: true,
    }
  }

  if (!data?.ok) {
    return {
      success: false,
      retryable: data?.reason === "not_due",
      error:
        data?.reason === "not_due"
          ? "Waiting for the official examination deadline."
          : "Examination finalization could not be confirmed.",
    }
  }

  await autoSyncFinalizedAttempt(attemptId)

  // This does not change the result-release policy.
  // Failure to issue a review receipt must not undo
  // completed examination grading.
  try {
    await issueReviewReceipt(normalized, attemptId)
  } catch (receiptError) {
    console.error(
      "[CBT:EXPIRE_REVIEW_RECEIPT]",
      receiptError
    )
  }

  return {
    success: true,
    status: data.status as "submitted" | "expired",
    resultFinalized: data.result_finalized === true,
  }
}