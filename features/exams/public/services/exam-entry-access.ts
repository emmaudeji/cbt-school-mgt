import "server-only"

import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { getPublicExamClient } from "./public-exam-client"

export type ExamAccessMode = "registered" | "access_code" | "open_link"
export type ExamEntryPreview = {
  found: boolean
  publication_id?: string
  mode?: ExamAccessMode
  title?: string
  description?: string | null
  instructions?: string | null
  duration_seconds?: number
  available_from?: string
  available_until?: string
}

export const isExamEntryCode = (code: string) => /^[A-Z0-9]{6,32}$/.test(code)
export const normalizeExamEntryCode = (code: string) => code.trim().toUpperCase()

// Preserve the old cookie name and path so existing public sessions and
// review receipts remain valid while access_code uses the same player.
export const examSessionCookieName = (code: string) => `cbt_open_${code}`

export async function getExamEntryPreview(code: string): Promise<ExamEntryPreview> {
  const normalized = normalizeExamEntryCode(code)
  if (!isExamEntryCode(normalized)) return { found: false }
  const { data, error } = await getPublicExamClient().rpc("cbt_exam_entry_preview", {
    p_entry_code: normalized,
  })
  if (error) {
    console.error("[CBT:EXAM_ENTRY_PREVIEW]", error)
    return { found: false }
  }
  return (data ?? { found: false }) as ExamEntryPreview
}

export async function getCurrentExamSession(code: string) {
  const normalized = normalizeExamEntryCode(code)
  if (!isExamEntryCode(normalized)) return null
  const token = (await cookies()).get(examSessionCookieName(normalized))?.value
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null

  const preview = await getExamEntryPreview(normalized)
  if (!preview.found || !preview.publication_id) return null
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const { data, error } = await getPublicExamClient().rpc("cbt_verify_candidate_session", {
    p_token_hash: tokenHash,
  })
  if (error || !data?.ok || data.publication_id !== preview.publication_id) return null
  return data as {
    ok: true
    session_id: string
    organization_id: string
    publication_id: string
    candidate_id: string
    assignment_id: string
    first_name: string
    last_name: string
    expires_at: string
  }
}
