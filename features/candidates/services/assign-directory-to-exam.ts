
"use server"

import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"
import { assignPrivateCodeCandidatesAction } from "@/features/exams/services/assignment/private-code-actions"

export type AssignDirectoryResult =
  | {
      success: true
      assigned: number
      alreadyAssigned: number
      restored: number
    }
  | {
      success: false
      error: string
    }

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )

export async function assignDirectoryToExamAction(
  examSlug: string,
  ids: string[]
): Promise<AssignDirectoryResult> {
  if (
    !examSlug ||
    examSlug.length > 200 ||
    !/^[a-zA-Z0-9_-]+$/.test(examSlug)
  ) {
    return {
      success: false,
      error: "Invalid examination.",
    }
  }

  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 500 ||
    ids.some(id => typeof id !== "string" || !isUuid(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return {
      success: false,
      error: "Select between 1 and 500 valid candidates.",
    }
  }

  try {
    const context = await getExamAssignmentContext(examSlug)

    if (!context.exam || !context.publication) {
      return {
        success: false,
        error: "This examination is unavailable.",
      }
    }

    if (context.accessMode !== "access_code") {
      return {
        success: false,
        error:
          "This examination is not using individual Exam Numbers.",
      }
    }

    // The existing RPC checks:
    // - organization membership
    // - examination management permission
    // - publication seal
    // - active directory candidates
    // - assignment uniqueness
    // - credential issuance and reuse
    const result = await assignPrivateCodeCandidatesAction(
      context.publication.id,
      context.exam.slug,
      "directory",
      ids
    )

    if (!result.success) {
      return result
    }

    return {
      success: true,
      assigned: result.data.assigned,
      restored: result.data.restored,
      alreadyAssigned: result.data.alreadyAssigned,
    }
  } catch (error) {
    console.error(
      "[assignDirectoryToExamAction]",
      error instanceof Error ? error.message : "Unknown error"
    )

    return {
      success: false,
      error: "Unable to assign candidates. Please try again.",
    }
  }
}
