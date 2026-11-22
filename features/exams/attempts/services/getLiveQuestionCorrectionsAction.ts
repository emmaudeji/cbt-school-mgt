"use server"

import { getPublicExamClient } from "@/features/exams/services/public-exam-client"
import { getAttemptTokenHash } from "./attempt-player"

export type LiveQuestionCorrection = {
  id: string
  prompt: string
  updated_at: string
  options: { id: string; text: string }[]
}

export async function getLiveQuestionCorrectionsAction(
  code: string,
  attemptId: string
): Promise<{ success: boolean; corrections: LiveQuestionCorrection[] }> {
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) {
    return { success: false, corrections: [] }
  }

  const tokenHash = await getAttemptTokenHash(code)
  if (!tokenHash) return { success: false, corrections: [] }

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_get_attempt_live_corrections",
    {
      p_token_hash: tokenHash,
      p_attempt_id: attemptId,
    }
  )

  if (error || !data?.ok || !Array.isArray(data.corrections)) {
    if (error) console.error("[CBT:LIVE_CORRECTIONS]", error.code)
    return { success: false, corrections: [] }
  }

  return { success: true, corrections: data.corrections as LiveQuestionCorrection[] }
}
