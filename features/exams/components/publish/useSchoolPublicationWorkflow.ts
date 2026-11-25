
"use client"

import { useState } from "react"

import {
  publishWithSchoolAssignmentAction,
  initializeSchoolAssessmentLinksAction,
  assignSchoolPublicationBatchAction,
  type AccessMode,
  type AssignmentChoice,
} from "@/features/exams/services/assignment/school-publication-actions"

type Recovery = {
  examId: string
  slug: string
  publicationId: string
  revision: number

  choice: AssignmentChoice
  selectedIds: string[]

  // First finish assessment integration, then
  // continue the existing student assignment batches.
  assessmentPending: boolean

  cursor: string | null
  processed: number
  assigned: number
  skippedNoAccount: number
  alreadyAssigned: number
}

type WorkflowResult =
  | {
      success: true
      revision: number
      assigned: number
      skippedNoAccount: number
    }
  | {
      success: false
      error: string
      published: boolean
    }

function makeRecovery(args: {
  examId: string
  slug: string
  publicationId: string
  revision: number
  choice: AssignmentChoice
  selectedIds: string[]
  assessmentPending: boolean
}): Recovery {
  return {
    examId: args.examId,
    slug: args.slug,
    publicationId: args.publicationId,
    revision: args.revision,
    choice: args.choice,
    selectedIds: args.selectedIds,
    assessmentPending: args.assessmentPending,
    cursor: null,
    processed: 0,
    assigned: 0,
    skippedNoAccount: 0,
    alreadyAssigned: 0,
  }
}

export function useSchoolPublicationWorkflow() {
  const [working, setWorking] = useState(false)

  const [recovery, setRecovery] =
    useState<Recovery | null>(null)

  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")

  /**
   * Continue an existing publication.
   *
   * This function NEVER creates another publication.
   */
  async function complete(
    start: Recovery
  ): Promise<WorkflowResult> {
    let state = start

    try {
      // -----------------------------------------
      // 1. Recover assessment integration first.
      // -----------------------------------------
      if (state.assessmentPending) {
        setProgress("Initializing school assessment links...")

        const result =
          await initializeSchoolAssessmentLinksAction(
            state.examId,
            state.slug,
            state.publicationId
          )

        if (!result.success) {
          setRecovery(state)
          setError(result.error)

          return {
            success: false,
            error: result.error,
            published: true,
          }
        }

        state = {
          ...state,
          assessmentPending: false,
        }

        setRecovery(state)
        setProgress(
          result.status === "ready"
            ? `${result.linked} assessment link(s) ready.`
            : "No saved assessment setup for this examination."
        )
      }

      // -----------------------------------------
      // 2. Nothing to assign when staff selected
      // Assign later.
      // -----------------------------------------
      if (state.choice === "later") {
        setRecovery(null)
        setError("")
        setProgress("")

        return {
          success: true,
          revision: state.revision,
          assigned: state.assigned,
          skippedNoAccount: state.skippedNoAccount,
        }
      }

      // -----------------------------------------
      // 3. Preserve your existing batch assignment
      // workflow, including cursor-based recovery.
      // -----------------------------------------
      for (let batch = 0; batch < 1000; batch++) {
        const result =
          await assignSchoolPublicationBatchAction({
            examId: state.examId,
            slug: state.slug,
            publicationId: state.publicationId,
            choice: state.choice,
            selectedIds: state.selectedIds,
            cursor: state.cursor,
          })

        if (!result.success) {
          setRecovery(state)
          setError(result.error)

          return {
            success: false,
            error: result.error,
            published: true,
          }
        }

        const part = result.batch
        const previousCursor = state.cursor

        state = {
          ...state,
          cursor: part.nextCursor,
          processed:
            state.processed + part.processed,
          assigned:
            state.assigned +
            part.assigned +
            part.restored,
          alreadyAssigned:
            state.alreadyAssigned +
            part.alreadyAssigned,
          skippedNoAccount:
            state.skippedNoAccount +
            part.skippedNoAccount,
        }

        setRecovery(state)

        setProgress(
          `${state.processed} checked · ` +
          `${state.assigned} new/restored · ` +
          `${state.alreadyAssigned} already assigned · ` +
          `${state.skippedNoAccount} need attention`
        )

        if (part.completed) {
          setRecovery(null)
          setError("")
          setProgress("")

          return {
            success: true,
            revision: state.revision,
            assigned: state.assigned,
            skippedNoAccount: state.skippedNoAccount,
          }
        }

        if (
          !part.nextCursor ||
          part.nextCursor === previousCursor
        ) {
          const message =
            "Assignment cursor did not advance. Refresh before retrying."

          setRecovery(state)
          setError(message)

          return {
            success: false,
            error: message,
            published: true,
          }
        }
      }

      const message =
        "Batch limit reached. Continue assignments to finish."

      setRecovery(state)
      setError(message)

      return {
        success: false,
        error: message,
        published: true,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Publication setup was interrupted."

      setRecovery(state)
      setError(message)

      return {
        success: false,
        error: message,
        published: true,
      }
    }
  }

  /**
   * Create a new publication, initialize assessments,
   * and then assign initial students.
   */
  async function publish(args: {
    examId: string
    slug: string
    mode: AccessMode
    choice: AssignmentChoice
    selectedIds: string[]
  }): Promise<WorkflowResult> {
    if (working || recovery) {
      return {
        success: false,
        error:
          "Finish the existing publication setup first.",
        published: Boolean(recovery),
      }
    }

    setWorking(true)
    setError("")
    setProgress("Publishing examination...")

    try {
      const result =
        await publishWithSchoolAssignmentAction(
          args.examId,
          args.slug,
          args.mode,
          args.choice,
          args.selectedIds
        )

      // -----------------------------------------
      // The server may have successfully published
      // the revision before assessment linking failed.
      // Preserve that publication for recovery.
      // -----------------------------------------
      if (!result.success) {
        setError(result.error)
        setProgress("")

        if (
          result.published &&
          result.publicationId &&
          result.revision != null
        ) {
          const state = makeRecovery({
            ...args,
            publicationId: result.publicationId,
            revision: result.revision,
            assessmentPending: true,
          })

          setRecovery(state)

          return {
            success: false,
            error: result.error,
            published: true,
          }
        }

        return {
          success: false,
          error: result.error,
          published: Boolean(result.published),
        }
      }

      // -----------------------------------------
      // Assessment links were initialized by the
      // server action before reaching this point.
      // -----------------------------------------
      if (
        args.choice === "later" ||
        !result.isSchoolExam
      ) {
        setProgress("")

        return {
          success: true,
          revision: result.revision,
          assigned: 0,
          skippedNoAccount: 0,
        }
      }

      // -----------------------------------------
      // Begin initial student assignment.
      // -----------------------------------------
      const state = makeRecovery({
        ...args,
        publicationId: result.publicationId,
        revision: result.revision,
        assessmentPending: false,
      })

      setRecovery(state)

      return await complete(state)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Publication could not be confirmed. Check the latest revision before retrying."

      setError(message)

      return {
        success: false,
        error: message,
        published: Boolean(recovery),
      }
    } finally {
      setWorking(false)
    }
  }

  /**
   * Retry unfinished assessment setup or student
   * assignment for the same published revision.
   */
  async function retry(): Promise<WorkflowResult> {
    if (!recovery || working) {
      return {
        success: false,
        error: "Nothing to resume.",
        published: false,
      }
    }

    setWorking(true)
    setError("")

    try {
      return await complete(recovery)
    } finally {
      setWorking(false)
    }
  }

  return {
    publish,
    retry,
    working,
    error,
    progress,
    recovery,
  }
}
