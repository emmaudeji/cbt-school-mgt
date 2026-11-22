"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { issueAccessCode } from "./credential-crypto"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BATCH_SIZE = 200

type RepairResult =
  | { success: true; repaired: number; hasMore: boolean }
  | { success: false; error: string }

/** One bounded, repeatable batch. Never exposes plaintext credentials to the browser. */
export async function repairMissingExamCredentialsBatchAction(
  publicationId: string,
  examSlug: string,
): Promise<RepairResult> {
  if (!UUID_RE.test(publicationId) || !examSlug || examSlug.length > 150) {
    return { success: false, error: "Invalid examination." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your staff session has expired." }

  try {
    const { data: candidates, error: queryError } = await context.supabase.rpc(
      "cbt_get_missing_exam_credential_candidate_ids",
      { p_publication_id: publicationId, p_limit: BATCH_SIZE },
    )
    if (queryError) return { success: false, error: queryError.message }

    const ids: string[] = (candidates ?? []) as string[]
    if (!Array.isArray(ids) || ids.some(id => !UUID_RE.test(id))) {
      return { success: false, error: "Unexpected credential reconciliation response." }
    }
    if (ids.length === 0) return { success: true, repaired: 0, hasMore: false }

    // Uses the same six-character code generator, encryption and HMAC as normal assignment.
    const rows = ids.map(id => ({ id, ...issueAccessCode() }))
    const { data, error } = await context.supabase.rpc(
      "cbt_assign_private_code_candidates",
      { p_publication_id: publicationId, p_source: "directory", p_rows: rows },
    )
    if (error) return { success: false, error: error.message }

    const result = data as { reissuedExisting?: number; issuedCount?: number }
    const repaired = result.reissuedExisting ?? 0
    if (repaired < 1) {
      return { success: false, error: "No credentials were repaired; refresh the examination and retry." }
    }

    revalidatePath(`/exams/${encodeURIComponent(examSlug)}/candidates`)
    revalidatePath(`/exams/${encodeURIComponent(examSlug)}/candidates/assign`)
    return { success: true, repaired, hasMore: ids.length === BATCH_SIZE }
  } catch {
    return { success: false, error: "Unable to prepare missing credentials. Check the server configuration." }
  }
}
