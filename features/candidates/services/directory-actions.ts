"use server"

import { revalidatePath } from "next/cache"
import type { CandidateFormValues } from "./directory-types"
import { getStaffContext } from "@/services/auth"

export async function saveDirectoryCandidateAction(value: CandidateFormValues): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  const firstName = value.firstName?.trim() ?? ""
  const lastName = value.lastName?.trim() ?? ""
  const candidateCode = value.candidateCode?.trim() ?? ""

  if (!firstName || firstName.length > 120 || lastName.length > 120) {
    return { success: false, error: "Provide a valid candidate name." }
  }
  if (candidateCode && !/^[A-Za-z0-9_-]{3,64}$/.test(candidateCode)) {
    return { success: false, error: "Candidate code must contain 3-64 letters, numbers, underscores or hyphens." }
  }
  if (value.status !== "active" && value.status !== "inactive") {
    return { success: false, error: "Invalid candidate status." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { data, error } = await context.supabase.rpc("cbt_upsert_directory_candidate", {
    p_organization_id: context.organizationId,
    p_candidate_id: value.id || null,
    p_first_name: firstName,
    p_last_name: lastName,
    p_candidate_code: candidateCode || null,
    p_status: value.status,
  })

  if (error) {
    if (error.code === "23505") return { success: false, error: "That candidate code is already in use." }
    return { success: false, error: error.message ?? "Unable to save candidate." }
  }

  revalidatePath("/candidates")
  return { success: true, id: data as string }
}
