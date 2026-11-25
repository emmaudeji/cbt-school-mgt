import "server-only"

import { createHash } from "node:crypto"
import { cookies } from "next/headers"

import { getPublicExamClient } from "../../public/services/public-exam-client"
import { getCurrentExamSession } from "../../public/services/exam-entry-access"

export type ExamOption = {
  id: string
  text: string
  number: number
}

export type ExamQuestion = {
  id: string
  number: number
  type: "single_choice" | "multiple_choice" | "true_false" | "free_text"
  prompt: string
  options: ExamOption[]
  answer: {
    revision: number
    selected_ids: string[]
    text: string
  }
}

export type ExamPlayerData = {
  ok: true
  attempt_id: string
  attempt_number: number
  status: "created" | "in_progress" | "submitted" | "expired" | "cancelled"
  started_at: string | null
  expires_at: string | null
  server_now: string
  questions: ExamQuestion[]
}

// function isValidId(id: string) {
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
// }

export async function getAttemptTokenHash(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{6,32}$/.test(normalized)) return null

  // The existing public access helper verifies that this exact link belongs
  // to the candidate's valid session and sealed publication.
  const session = await getCurrentExamSession(normalized)
  if (!session) return null

  const token = (await cookies()).get(`cbt_open_${normalized}`)?.value
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null

  return createHash("sha256").update(token).digest("hex")
}

export async function getPublicExamPlayer(
  code: string,
  attemptId: string
): Promise<ExamPlayerData | null> {
  // if (!isValidId(attemptId)) return null

  const tokenHash = await getAttemptTokenHash(code)
  if (!tokenHash) return null

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_get_attempt_player",
    {
      p_token_hash: tokenHash,
      p_attempt_id: attemptId,
    }
  )

  if (error) {
    console.error("[CBT:PLAYER_LOAD]", error)
    throw new Error("Unable to load your examination")
  }

  if (!data?.ok) return null
  return data as ExamPlayerData
}
