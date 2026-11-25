"use server"

import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { getPublicExamClient } from "@/features/exams/services/public-exam-client"

import type { SyncSnapshot } from "./exam-sync-results"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AttemptDiagnosis = {
  ok: true
  attempt_id: string
  candidate_id: string
  publication_id: string
  attempt_number: number
  attempt_status: string

  started_at: string | null
  expires_at: string | null
  submitted_at: string | null
  closed_at: string | null
  server_now: string

  deadline_passed: boolean

  question_count: number
  answered_count: number
  question_grade_count: number
  written_question_count: number

  grading_status: string | null
  pending_manual_count: number | null
  grading_total: number | null
  grading_earned: number | null
  grading_run_status: string | null

  result_id: string | null
  result_finalized: boolean

  issue: string
  suggested_action: "recover" | "sync" | "inspect_only"
}

export type InspectAttemptResult =
  | { ok: true; diagnosis: AttemptDiagnosis }
  | { ok: false; message: string }

export async function inspectExamStudentAttempt(
  slug: string,
  linkId: string,
  studentId: string,
  attemptId: string
): Promise<InspectAttemptResult> {
  const fail = (message: string): InspectAttemptResult => ({
    ok: false,
    message,
  })

  if (
    !slug ||
    slug.length > 200 ||
    !UUID.test(linkId) ||
    !UUID.test(studentId) ||
    !UUID.test(attemptId)
  ) {
    return fail("Invalid examination request.")
  }

  try {
    const context = await getStaffContext()

    if (!context) {
      return fail("Sign in to inspect this attempt.")
    }

    const exam = await getExamBySlug(slug)

    if (
      !exam ||
      exam.organization_id !== context.organizationId
    ) {
      return fail("Examination not found.")
    }

    const { data: preview, error: previewError } =
      await context.supabase.rpc(
        "cbt_school_sync_preview",
        { p_exam_id: exam.id }
      )

    if (
      previewError ||
      !preview?.ok ||
      !Array.isArray(preview.rows)
    ) {
      return fail(
        "You do not have permission to inspect these results."
      )
    }

    const snapshot = preview as SyncSnapshot

    const matchingRow = snapshot.rows.find(
      (row) =>
        row.link_id === linkId &&
        row.student_id === studentId &&
        row.attempt_id === attemptId
    )

    if (!matchingRow) {
      return fail(
        "This attempt is no longer the current previewed attempt. Refresh the table."
      )
    }

    const { data, error } =
      await getPublicExamClient().rpc(
        "cbt_school_inspect_attempt",
        {
          p_organization_id: context.organizationId,
          p_exam_id: exam.id,
          p_attempt_id: attemptId,
        }
      )

    if (error) {
      console.error("[CBT:INSPECT_ATTEMPT]", error)

      return fail(
        "Could not load the examination diagnosis."
      )
    }

    if (!data?.ok) {
      return fail("Attempt details are unavailable.")
    }

    return {
      ok: true,
      diagnosis: data as AttemptDiagnosis,
    }
  } catch (error) {
    console.error("[CBT:INSPECT_ATTEMPT]", error)

    return fail(
      "Unable to inspect this examination attempt."
    )
  }
}