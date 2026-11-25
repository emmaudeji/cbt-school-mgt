import "server-only"

import { getPublicExamClient } from
  "@/features/exams/services/public-exam-client"

const validId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Runs only on the trusted server.
 *
 * Failed school imports are logged, but do not cause
 * the student's completed examination to be treated
 * as an unsuccessful submission.
 */
export async function autoSyncFinalizedAttempt(
  attemptId: string
) {
  if (!validId.test(attemptId)) return

  try {
    const { data, error } = await getPublicExamClient()
      .rpc("cbt_school_auto_sync_attempt", {
        p_attempt_id: attemptId,
      })

    if (error) {
      console.error("[CBT:AUTO_SCHOOL_SYNC]", {
        attemptId,
        error,
      })
      return
    }

    if (!data?.ok || Number(data.failed ?? 0) > 0) {
      console.error(
        "[CBT:AUTO_SCHOOL_SYNC_INCOMPLETE]",
        { attemptId, data }
      )
    }
  } catch (error) {
    console.error(
      "[CBT:AUTO_SCHOOL_SYNC]",
      { attemptId, error }
    )
  }
}