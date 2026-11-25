"use server"

import { revalidatePath } from "next/cache"

import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { getPublicExamClient } from "@/features/exams/services/public-exam-client"

import type {
  SyncSnapshot,
  SyncRow,
} from "./exam-sync-results"

export type RepairResult = {
  ok: boolean
  message: string
  outcome?: string
  imported?: number
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function recoverExamStudentResult(
  slug: string,
  linkId: string,
  studentId: string,
  attemptId: string
): Promise<RepairResult> {
  const fail = (message: string): RepairResult => ({
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
    return fail("Invalid recovery request.")
  }

  try {
    const context = await getStaffContext()

    if (!context) {
      return fail("Sign in to continue.")
    }

    const exam = await getExamBySlug(slug)

    if (
      !exam ||
      exam.organization_id !== context.organizationId
    ) {
      return fail("Examination is not available.")
    }

    // Recheck this exact student's current eligibility
    // with the staff-authenticated client.
    //
    // The existing preview RPC enforces the school's
    // exams.manage / results.manage authorization.
    const { data: preview, error: previewError } =
      await context.supabase.rpc(
        "cbt_school_sync_preview",
        {
          p_exam_id: exam.id,
        }
      )

    if (
      previewError ||
      !preview?.ok ||
      !Array.isArray(preview.rows)
    ) {
      return fail(
        "You are not authorized to recover these results."
      )
    }

    const snapshot = preview as SyncSnapshot

    const row = snapshot.rows.find(
      (item: SyncRow) =>
        item.link_id === linkId &&
        item.student_id === studentId &&
        item.attempt_id === attemptId
    )

    if (!row) {
      return fail(
        "This student or attempt has changed. Refresh the preview."
      )
    }

    if (
      row.sync_status !== "pending" &&
      row.sync_status !== "ready"
    ) {
      return fail(
        "This record does not require automatic recovery."
      )
    }

    // The user cannot choose an arbitrary examination,
    // student or attempt for this privileged operation.
    const { data, error } =
      await getPublicExamClient().rpc(
        "cbt_school_recover_attempt",
        {
          p_organization_id: context.organizationId,
          p_exam_id: exam.id,
          p_attempt_id: attemptId,
        }
      )

    if (error) {
      console.error(
        "[CBT:RECOVER_STUDENT_RESULT]",
        error
      )

      return fail(
        "Recovery could not be completed. Check server logs."
      )
    }

    if (!data?.ok) {
      const reason = data?.reason

      const messages: Record<string, string> = {
        attempt_still_active:
          "This examination is still active. It cannot be force-submitted.",
        attempt_not_found:
          "The attempt could not be found.",
        attempt_not_recoverable:
          "This attempt cannot be automatically recovered.",
        finalization_failed:
          "The grading engine could not finalize this attempt.",
      }

      return fail(
        messages[reason] ??
          "Recovery could not be completed."
      )
    }

    revalidatePath(
      `/exams/${encodeURIComponent(slug)}/sync-results`
    )

    if (data.outcome === "awaiting_grading") {
      return {
        ok: true,
        outcome: "awaiting_grading",
        imported: 0,
        message:
          "The attempt was checked. No finalized result is available yet. Manual grading or further investigation may be required.",
      }
    }

    const imported = Number(data.imported ?? 0)
    const failed = Number(data.failed ?? 0)

    return {
      ok: failed === 0,
      outcome: data.outcome,
      imported,
      message:
        failed > 0
          ? `CBT result finalized, but ${failed} school import operation(s) require attention.`
          : imported > 0
            ? `Recovery successful. ${imported} school score(s) synchronized.`
            : "Recovery completed. No new school score was required or eligible for import.",
    }
  } catch (error) {
    console.error(
      "[CBT:RECOVER_STUDENT_RESULT]",
      error
    )

    return fail(
      "An unexpected error occurred while recovering the result."
    )
  }
}