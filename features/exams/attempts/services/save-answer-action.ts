"use server"

import { getPublicExamClient } from "../../public/services/public-exam-client"
import { getAttemptTokenHash } from "./attempt-player"

type SaveResult = {
  success: boolean
  revision?: number
  conflict?: boolean
  error?: string
}

export async function saveExamAnswerAction(
  code: string,
  attemptId: string,
  questionId: string,
  selectedIds: string[],
  text: string,
  expectedRevision: number
): Promise<SaveResult> {
  if (
    !/^[A-Z0-9]{6,32}$/.test(code) ||
    !/^[0-9a-f-]{36}$/i.test(attemptId) ||
    !/^[0-9a-f-]{36}$/i.test(questionId) ||
    !Array.isArray(selectedIds) || selectedIds.length > 100 ||
    selectedIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
    typeof text !== "string" || text.length > 5000 ||
    !Number.isInteger(expectedRevision) || expectedRevision < 0
  ) {
    return { success: false, error: "Invalid answer details" }
  }

  const tokenHash = await getAttemptTokenHash(code)
  if (!tokenHash) {
    return { success: false, error: "Your candidate session has expired" }
  }

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_save_attempt_answer",
    {
      p_token_hash: tokenHash,
      p_attempt_id: attemptId,
      p_attempt_question_id: questionId,
      p_selected_ids: selectedIds,
      p_text_answer: text || null,
      p_expected_revision: expectedRevision,
    }
  )

  if (error) {
    console.error("[CBT:ANSWER_SAVE]", error)
    return { success: false, error: "Unable to save this answer" }
  }

  if (!data?.ok) {
    return {
      success: false,
      conflict: data?.reason === "conflict",
      error: data?.reason === "conflict"
        ? "This answer changed in another tab. Reload to recover the latest saved version."
        : data?.reason === "closed"
          ? "This attempt is no longer accepting answers"
          : "Unable to save this answer",
    }
  }

  return { success: true, revision: data.revision }
}
