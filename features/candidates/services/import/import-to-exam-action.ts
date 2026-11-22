
"use server"

// Important behaviour: The action assigns only candidates actually created by that import. If a record is skipped because it already exists, we don't guess which student it belongs to based on a matching name. The teacher can select that existing record from the directory.

// This prevents accidentally assigning the wrong student when two people share the same name.

import { getStaffContext } from "@/services/auth"

import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"
import { assignPrivateCodeCandidatesAction } from "@/features/exams/services/assignment/private-code-actions"

import { bulkImportCandidatesAction } from "./actions"

import type {
  CandidateImportValue,
  ImportResult,
} from "./types"

type AssignmentSummary = {
  assigned: number
  restored: number
  alreadyAssigned: number
  issuedCount: number
}

export type ImportToExamResult =
  | {
      status: "complete"
      importResult: ImportResult
      assignment: AssignmentSummary
    }
  | {
      status: "imported_not_assigned"
      importResult: ImportResult
      error: string
    }
  | {
      status: "failed"
      error: string
    }

export async function importCandidatesToExamAction(
  examSlug: string,
  rows: CandidateImportValue[]
): Promise<ImportToExamResult> {
  if (
    !/^[a-zA-Z0-9_-]{1,200}$/.test(examSlug) ||
    !Array.isArray(rows) ||
    rows.length < 1 ||
    rows.length > 500
  ) {
    return {
      status: "failed",
      error: "Invalid examination or import selection.",
    }
  }

  try {
    const staff = await getStaffContext()

    if (!staff) {
      return {
        status: "failed",
        error: "Your staff session has expired.",
      }
    }

    const context = await getExamAssignmentContext(
      examSlug
    )

    if (
      !context.exam ||
      !context.publication ||
      context.accessMode !== "access_code"
    ) {
      return {
        status: "failed",
        error: "This examination is unavailable for assignment.",
      }
    }

    // Explicit authorization BEFORE saving any directory records.
    const permission = await staff.supabase.rpc(
      "cbt_can_import_for_exam",
      {
        p_publication_id: context.publication.id,
      }
    )

    if (permission.error || permission.data !== true) {
      return {
        status: "failed",
        error: "You cannot manage students for this examination.",
      }
    }

    // STEP 1: Save new directory records.
    const imported = await bulkImportCandidatesAction(
      rows
    )

    if (!imported.success || !imported.result) {
      return {
        status: "failed",
        error:
          imported.error ??
          "Unable to import candidates.",
      }
    }

    const importResult = imported.result

    // Only use IDs that the import RPC confirms it created.
    // Skipped duplicate names are NOT safe to resolve by name.
    const newIds = importResult.rows
      .filter(row => row.outcome === "created")
      .map(row => row.id)

    if (newIds.length === 0) {
      return {
        status: "complete",
        importResult,
        assignment: {
          assigned: 0,
          restored: 0,
          alreadyAssigned: 0,
          issuedCount: 0,
        },
      }
    }

    // STEP 2: Assign those newly created candidates.
    // This also generates their encrypted Exam Numbers.
    const assignment =
      await assignPrivateCodeCandidatesAction(
        context.publication.id,
        context.exam.slug,
        "directory",
        newIds
      )

    if (!assignment.success) {
      return {
        status: "imported_not_assigned",
        importResult,
        error:
          "The new candidates were saved to the directory, " +
          "but were not added to the examination. " +
          "Open the directory and assign them there. " +
          "Do not import the same list again.",
      }
    }

    return {
      status: "complete",
      importResult,
      assignment: {
        assigned: assignment.data.assigned,
        restored: assignment.data.restored,
        alreadyAssigned: assignment.data.alreadyAssigned,
        issuedCount: assignment.data.issuedCount,
      },
    }
  } catch (error) {
    // Unexpected failures can have ambiguous outcomes
    // if a request fails after the database has committed.
    console.error(
      "[importCandidatesToExamAction]",
      error instanceof Error ? error.message : "Unknown error"
    )

    return {
      status: "failed",
      error:
        "Unable to confirm the import result. " +
        "Check the directory before trying again.",
    }
  }
}
