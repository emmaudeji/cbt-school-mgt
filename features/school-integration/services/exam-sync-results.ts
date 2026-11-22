import "server-only"

import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"

export type SyncStatus =
  | "ready" | "synced" | "existing_score" | "pending"
  | "revision_mismatch" | "no_attempt" | "missing_membership" | "invalid_result"

export type SyncRow = {
  link_id: string
  component_id: string
  component_name: string
  session_name: string
  term_name: string
  class_name: string
  subject_name: string
  student_id: string
  student_name: string
  admission_number: string | null
  publication_id: string
  revision: number
  max_score: number
  attempt_id: string | null
  attempt_number: number | null
  attempt_status: string | null
  attempted_revision: number | null
  result_id: string | null
  earned_points: number | null
  total_points: number | null
  converted_score: number | null
  school_score_id: string | null
  school_score: number | null
  previous_result_id: string | null
  sync_status: SyncStatus
}

export type SyncSnapshot = {
  ok: true
  active_links: number
  rows: SyncRow[]
}

export async function getExamSyncResults(slug: string) {
  try {
    const context = await getStaffContext()
    if (!context) return null

    const exam = await getExamBySlug(slug)
    if (!exam || exam.organization_id !== context.organizationId) {
      console.error("[CBT:EXAM_SYNC] Organization mismatch or missing exam")
      return null
    }

    const { data, error } = await context.supabase.rpc("cbt_school_sync_preview", {
      p_exam_id: exam.id,
    })
    if (error) {
      console.error("[CBT:EXAM_SYNC_PREVIEW]", error)
      return null
    }
    if (!data?.ok || !Array.isArray(data.rows)) {
      console.error("[CBT:EXAM_SYNC_PREVIEW] Invalid payload", data)
      return null
    }
    return { exam, snapshot: data as SyncSnapshot }
  } catch (error) {
    console.error("[CBT:EXAM_SYNC_PREVIEW]", error)
    return null
  }
}
