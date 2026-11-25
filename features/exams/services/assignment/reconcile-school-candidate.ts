
"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"

type Result =
  | {
      success: true
      candidateId: string
      alreadyLinked: boolean
    }
  | {
      success: false
      error: string
    }

export async function reconcileSchoolCandidateAction(
  examId: string,
  studentId: string,
  slug: string
): Promise<Result> {
  try {
    const staff = await getStaffContext()

    if (!staff) {
      return {
        success: false,
        error: "Your session has expired.",
      }
    }

    const { data, error } = await staff.supabase.rpc(
      "cbt_reconcile_school_student_identity",
      {
        p_exam_id: examId,
        p_student_id: studentId,
      }
    )

    if (error) {
      console.error("[CBT:RECONCILE_IDENTITY]", {
        code: error.code,
        message: error.message,
        details: error.details,
      })

      return {
        success: false,
        error: error.message,
      }
    }

    const result = data as {
      success: boolean
      alreadyLinked: boolean
      candidateId: string
    }

    if (!result?.success || !result.candidateId) {
      return {
        success: false,
        error: "Identity reconciliation could not be confirmed.",
      }
    }

    revalidatePath(
      `/exams/${encodeURIComponent(slug)}/candidates`
    )

    return {
      success: true,
      candidateId: result.candidateId,
      alreadyLinked: result.alreadyLinked,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reconcile student identity.",
    }
  }
}
