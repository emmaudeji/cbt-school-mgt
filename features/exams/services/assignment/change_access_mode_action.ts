"use server"

import { getStaffContext } from "@/services/auth"
import { tables } from "@/constants"

type AccessMode = "registered" | "access_code" | "open_link"
type Result =
  | { success: true; mode: AccessMode; assignedWithoutPrivateCodes: number }
  | { success: false; error: string }

export async function changeExamAccessModeAction(
  examSlug: string,
  publicationId: string,
  mode: AccessMode
): Promise<Result> {
  if (!["registered", "access_code", "open_link"].includes(mode)) {
    return { success: false, error: "Choose a valid access method." }
  }
  try {
    const context = await getStaffContext()
    if (!context) return { success: false, error: "Sign in as an authorized staff member." }
    const { supabase, organizationId } = context
    const { data: exam, error: examError } = await supabase
      .from(tables.cbt_exams)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("slug", examSlug)
      .maybeSingle()
    if (examError || !exam) return { success: false, error: "Examination not found." }

    const { data: publication, error: publicationError } = await supabase
      .from(tables.cbt_exam_publications)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("exam_id", exam.id)
      .eq("id", publicationId)
      .maybeSingle()
    if (publicationError || !publication) {
      return { success: false, error: "Examination publication not found." }
    }

    // Regenerate Supabase types after applying the migration so this RPC is typed.
    const { data, error } = await supabase.rpc("cbt_change_publication_access_mode", {
      p_publication_id: publicationId,
      p_mode: mode,
    })
    if (error) {
      console.error("[CBT:CHANGE_ACCESS_MODE]", error)
      return { success: false, error: error.message || "Unable to change access method." }
    }
    const result = data as {
      mode: AccessMode
      assignedWithoutPrivateCodes: number
    }
    return {
      success: true,
      mode: result.mode,
      assignedWithoutPrivateCodes: result.assignedWithoutPrivateCodes ?? 0,
    }
  } catch (error) {
    console.error("[CBT:CHANGE_ACCESS_MODE]", error)
    return { success: false, error: "Unable to change access method. Please try again." }
  }
}
