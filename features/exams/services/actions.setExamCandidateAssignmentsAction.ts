"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { tables, urls } from "@/constants"
import { getStaffContext } from "@/services/auth"
import { toSlug } from "@/lib"

type ActionResult = {
  success: boolean
  error?: string
  data?: { id: string; name: string }
}


export async function setExamCandidateAssignmentsAction(
  publicationId: string,
  slug: string,
  candidateIds: string[],
  status: "assigned" | "revoked"
): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      count: 0,
      error: "Your session has expired.",
    }
  }

  if (
    candidateIds.length === 0 ||
    candidateIds.length > 100 ||
    new Set(candidateIds).size !== candidateIds.length
  ) {
    return {
      success: false,
      count: 0,
      error: "Select between 1 and 100 distinct candidates.",
    }
  }

  const { data: publication, error: publicationError } =
    await context.supabase
      .from(tables.cbt_exam_publications)
      .select("id, cbt_exams!inner(slug)")
      .eq("organization_id", context.organizationId)
      .eq("id", publicationId)
      .eq("cbt_exams.slug", slug)
      .maybeSingle()

  if (publicationError || !publication) {
    return {
      success: false,
      count: 0,
      error: "Examination publication not found.",
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_set_registered_assignments",
    {
      p_publication_id: publicationId,
      p_candidate_ids: candidateIds,
      p_status: status,
    }
  )

  if (error) {
    console.error("[CBT:SET_CANDIDATE_ASSIGNMENTS]", error)

    return {
      success: false,
      count: 0,
      error: error.message || "Unable to update assignments.",
    }
  }

  revalidatePath(`/exams/${slug}/candidates`)

  return {
    success: true,
    count: data ?? 0,
  }
}
