"use server"

import { revalidatePath } from "next/cache"
import type { AssignmentBatchResult, AssignmentPickerData, AssignmentPickerFilters, AssignmentSource } from "./types"
import { getStaffContext } from "@/services/auth";

type LoadResponse = { success: true; data: AssignmentPickerData } | { success: false; error: string }
type SaveResponse = { success: true; data: AssignmentBatchResult } | { success: false; error: string }

export async function loadAssignmentPickerAction(
  publicationId: string,
  filters: AssignmentPickerFilters
): Promise<LoadResponse> {
  if (!/^[0-9a-f-]{36}$/i.test(publicationId) || !["directory", "school"].includes(filters.source)) {
    return { success: false, error: "Invalid assignment selection." }
  }
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { data, error } = await context.supabase.rpc("cbt_get_assignment_picker", {
    p_publication_id: publicationId,
    p_source: filters.source,
    p_search: (filters.search ?? "").trim().slice(0, 100),
    p_session_id: filters.sessionId || null,
    p_level_id: filters.levelId || null,
    p_class_id: filters.classId || null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as AssignmentPickerData }
}

export async function applyCandidateAssignmentsAction(
  publicationId: string,
  slug: string,
  source: AssignmentSource,
  candidateIds: string[],
  status: "assigned" | "revoked" = "assigned"
): Promise<SaveResponse> {
  if (!/^[0-9a-f-]{36}$/i.test(publicationId) || candidateIds.length < 1 || candidateIds.length > 500 ||
    !["directory", "school"].includes(source) || !["assigned", "revoked"].includes(status) ||
    candidateIds.some(id => !/^[0-9a-f-]{36}$/i.test(id))) {
    return { success: false, error: "Choose between 1 and 500 valid candidates." }
  }
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { data, error } = await context.supabase.rpc("cbt_apply_candidate_assignments", {
    p_publication_id: publicationId,
    p_source: source,
    p_ids: [...new Set(candidateIds)],
    p_status: status,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath(`/exams/${encodeURIComponent(slug)}/candidates`)
  return { success: true, data: data as AssignmentBatchResult }
}
