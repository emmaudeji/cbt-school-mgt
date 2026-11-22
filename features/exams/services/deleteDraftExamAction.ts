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

type DeleteDraftExamResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteDraftExamAction(
  examId: string,
  slug: string
): Promise<DeleteDraftExamResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(examId)) {
    return { success: false, error: "Invalid examination ID." }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { success: false, error: "Invalid examination URL." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  // The RPC independently checks organization membership, ownership,
  // draft status and the absence of *any* published revision.
  const { data, error } = await context.supabase.rpc("cbt_delete_draft_exam", {
    p_exam_id: examId,
  })

  if (error) {
    console.error("[CBT:DELETE_DRAFT_EXAM]", { examId, error })
    return {
      success: false,
      error: error.message || "Unable to delete examination.",
    }
  }

  if (!data || data.success !== true) {
    return { success: false, error: "Deletion could not be confirmed." }
  }

  revalidatePath("/exams")
  return { success: true }
}
