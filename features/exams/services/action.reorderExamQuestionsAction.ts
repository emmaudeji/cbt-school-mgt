"use server"

import { revalidatePath } from "next/cache"

import { urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

export async function reorderExamQuestionsAction(
  examId: string,
  slug: string,
  layout: { id: string; section_id: string }[]
): Promise<{ success: boolean; error?: string }> {
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { error } = await context.supabase.rpc("cbt_reorder_exam_question_rules", {
    p_exam_id: examId,
    p_layout: layout,
  })

  if (error) {
    console.error("[CBT:REORDER_QUESTIONS]", { examId, error })
    return { success: false, error: error.message ?? "Unable to reorder questions." }
  }

  revalidatePath(urls.examDetails(slug))
  return { success: true }
}
