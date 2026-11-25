
"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { tables } from "@/constants"

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s)

type Counts = {
  createdCandidates: number
  assigned: number
  restored: number
  alreadyAssigned: number
  revoked: number
  needsRegistration: number
}

type Result =
  | { success: true; data: Counts }
  | { success: false; error: string }

export async function assignRegisteredSchoolStudentsAction(
  publicationId: string,
  examSlug: string,
  studentIds: string[]
): Promise<Result> {
  if (
    !isUuid(publicationId) ||
    studentIds.length < 1 ||
    studentIds.length > 500 ||
    studentIds.some(id => !isUuid(id)) ||
    new Set(studentIds).size !== studentIds.length
  ) {
    return { success: false, error: "Select 1–500 distinct students." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false, error: "Staff session expired." }

  const { supabase, organizationId } = context

  try {
    const { data: exam, error: examError } = await supabase
      .from(tables.cbt_exams)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("slug", examSlug)
      .maybeSingle()

    if (examError || !exam) {
      return { success: false, error: "Examination not found." }
    }

    const { data: publication, error: publicationError } = await supabase
      .from(tables.cbt_exam_publications)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("exam_id", exam.id)
      .eq("id", publicationId)
      .maybeSingle()

    if (publicationError || !publication) {
      return { success: false, error: "Publication not found. Refresh the page." }
    }

    // The database validates membership, mode and candidate identity.
    const { data, error } = await supabase.rpc(
      "cbt_apply_candidate_assignments",
      {
        p_publication_id: publicationId,
        p_source: "school",
        p_ids: studentIds,
        p_status: "assigned",
      }
    )

    if (error) {
      console.error("[CBT:ASSIGN_REGISTERED_SCHOOL]", error)
      return {
        success: false,
        error: error.message || "Unable to assign students.",
      }
    }

    const counts = data as Counts
    revalidatePath(`/exams/${encodeURIComponent(examSlug)}/candidates`)
    revalidatePath(`/exams/${encodeURIComponent(examSlug)}/candidates/assign`)

    return { success: true, data: counts }
  } catch (error) {
    console.error("[CBT:ASSIGN_REGISTERED_SCHOOL]", error)
    return { success: false, error: "Unable to assign students." }
  }
}
