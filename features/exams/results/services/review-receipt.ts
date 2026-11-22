import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { getPublicExamClient } from "@/features/exams/services/public-exam-client"

const validCode = (value: string) => /^[A-Z0-9]{6,32}$/.test(value)
const validId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export function reviewCookieName(attemptId: string) {
  return `cbt_review_${attemptId}`
}

export async function issueReviewReceipt(code: string, attemptId: string) {
  const normalized = code.trim().toUpperCase()
  if (!validCode(normalized) || !validId(attemptId)) return false

  const store = await cookies()
  const examToken = store.get(`cbt_open_${normalized}`)?.value
  if (!examToken || !/^[0-9a-f]{64}$/.test(examToken)) return false

  const examHash = createHash("sha256").update(examToken).digest("hex")
  const reviewToken = randomBytes(32).toString("hex")
  const reviewHash = createHash("sha256").update(reviewToken).digest("hex")

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_issue_review_ticket",
    {
      p_exam_token_hash: examHash,
      p_attempt_id: attemptId,
      p_ticket_hash: reviewHash,
    }
  )

  if (error || !data?.ok || !data.expires_at) {
    if (error) console.error("[CBT:ISSUE_REVIEW_RECEIPT]", error)
    return false
  }

  const expires = new Date(data.expires_at)
  if (!Number.isFinite(expires.getTime()) || expires <= new Date()) return false

  store.set(reviewCookieName(attemptId), reviewToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/take/${normalized}/attempt/${attemptId}`,
    expires,
  })

  return true
}

export async function getReviewReceipt(code: string, attemptId: string) {
  const normalized = code.trim().toUpperCase()
  if (!validCode(normalized) || !validId(attemptId)) return null
  const token = (await cookies()).get(reviewCookieName(attemptId))?.value
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  return createHash("sha256").update(token).digest("hex")
}
