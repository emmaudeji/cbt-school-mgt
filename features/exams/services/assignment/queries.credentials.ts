import "server-only"
import { getStaffContext } from "@/services/auth"

type Summary = {
  assignedCount: number
  credentialsReadyCount: number
  credentialsMissingCount: number
  entryCode: string | null
  accessMode: "registered" | "access_code" | "open_link"
}

export async function getExamCredentialSummary(publicationId: string | null): Promise<Summary | null> {
  if (!publicationId) return null
  const context = await getStaffContext()
  if (!context) return null
  const { data, error } = await context.supabase.rpc("cbt_get_exam_credential_summary", {
    p_publication_id: publicationId,
  })
  if (error) throw new Error("Unable to load exam credentials overview")
  return data as Summary
}
