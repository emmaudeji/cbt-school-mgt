
"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { tables } from "@/constants"
import { publishExamAction } from "@/features/exams/services/action"
import { assignPrivateCodeCandidatesAction } from "@/features/exams/services/assignment/private-code-actions"

export type AccessMode = "access_code" | "registered" | "open_link"
export type AssignmentChoice = "all" | "specific" | "later"

export type InitialStudent = {
  id: string
  firstName: string
  lastName: string
  code: string | null
  className: string
  loginReady: boolean
}

export type CandidatePage = {
  isSchoolExam: boolean
  rows: InitialStudent[]
  nextCursor: string | null
  hasMore: boolean
}

export type AssignmentProgress = {
  publicationId: string
  revision: number
  assigned: number
  restored: number
  alreadyAssigned: number
  createdCandidates: number
  skippedNoAccount: number
  processed: number
  completed: boolean
  nextCursor: string | null
}

export type PublishWithAssignmentResult =
  | {
      success: true
      publicationId: string
      revision: number
      isSchoolExam: boolean
    }
  | {
      success: false
      error: string
      published?: boolean
      publicationId?: string
      revision?: number
      isSchoolExam?: boolean
    }

const uuid = (s: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s)

async function contextForExam(examId: string, slug: string) {
  const context = await getStaffContext()

  if (!context) {
    throw new Error("Your staff session has expired.")
  }

  const { data, error } = await context.supabase
    .from(tables.cbt_exams)
    .select("id, slug")
    .eq("id", examId)
    .eq("slug", slug)
    .eq("organization_id", context.organizationId)
    .maybeSingle()

  if (error || !data) {
    throw new Error("Examination not found.")
  }

  return context
}

export async function getInitialSchoolStudentsAction(
  examId: string,
  slug: string,
  search = "",
  cursor: string | null = null
): Promise<
  | { success: true; data: CandidatePage }
  | { success: false; error: string }
> {
  if (!uuid(examId) || (cursor !== null && !uuid(cursor))) {
    return { success: false, error: "Invalid selection." }
  }

  try {
    const context = await contextForExam(examId, slug)

    const { data, error } = await context.supabase.rpc(
      "cbt_get_school_publication_candidates",
      {
        p_exam_id: examId,
        p_search: search.trim().slice(0, 100),
        p_after: cursor,
        p_limit: 100,
        p_only_ids: null,
      }
    )


    console.log({data, error})
    if (error) throw error
    return {
      success: true,
      data: data as CandidatePage,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load students.",
    }
  }
}


export async function publishWithSchoolAssignmentAction(
  examId: string,
  slug: string,
  mode: AccessMode,
  choice: AssignmentChoice,
  selectedIds: string[] = []
): Promise<PublishWithAssignmentResult> {
  if (
    !uuid(examId) ||
    !["access_code", "registered", "open_link"].includes(mode) ||
    !["all", "specific", "later"].includes(choice) ||
    selectedIds.length > 500 ||
    new Set(selectedIds).size !== selectedIds.length ||
    selectedIds.some((id) => !uuid(id))
  ) {
    return {
      success: false,
      error: "Invalid publication selection.",
    }
  }

  if (choice === "specific" && selectedIds.length === 0) {
    return {
      success: false,
      error: "Select at least one student.",
    }
  }

  if (mode === "open_link" && choice !== "later") {
    return {
      success: false,
      error:
        "Public-link publication does not preassign school students. Choose Assign later.",
    }
  }

  // Track successful publication outside the try block.
  // If a later step fails, never report that nothing
  // was published.
  let confirmedPublication: {
    publicationId: string
    revision: number
    isSchoolExam: boolean
  } | null = null

  try {
    const context = await contextForExam(examId, slug)

    const { data: schoolContext, error: schoolError } =
      await context.supabase
        .from("school_cbt_exam_contexts")
        .select("id")
        .eq("organization_id", context.organizationId)
        .eq("exam_id", examId)
        .limit(1)

    if (schoolError) throw schoolError

    const isSchoolExam = Boolean(schoolContext?.length)

    if (!isSchoolExam && choice !== "later") {
      return {
        success: false,
        error:
          "Automatic school assignment is only available for school-linked examinations.",
      }
    }

    // Preserve your existing selected-student validation.
    if (isSchoolExam && choice === "specific") {
      const { data, error } = await context.supabase.rpc(
        "cbt_get_school_publication_candidates",
        {
          p_exam_id: examId,
          p_search: "",
          p_after: null,
          p_limit: 200,
          p_only_ids: selectedIds,
        }
      )

      if (error) throw error

      const first = data as CandidatePage
      const found = new Set(
        first.rows.map((student) => student.id)
      )

      let next = first.nextCursor
      let hasMore = first.hasMore

      while (hasMore && next) {
        const pageResult = await context.supabase.rpc(
          "cbt_get_school_publication_candidates",
          {
            p_exam_id: examId,
            p_search: "",
            p_after: next,
            p_limit: 200,
            p_only_ids: selectedIds,
          }
        )

        if (pageResult.error) {
          throw pageResult.error
        }

        const page = pageResult.data as CandidatePage

        page.rows.forEach((student) => {
          found.add(student.id)
        })

        next = page.nextCursor
        hasMore = page.hasMore
      }

      if (found.size !== selectedIds.length) {
        return {
          success: false,
          error:
            "Some selected students are no longer enrolled in the chosen classes. Refresh your selection.",
        }
      }
    }

    // -----------------------------------------
    // 1. Publish through the existing action.
    // -----------------------------------------
    const published = await publishExamAction(
      examId,
      slug,
      mode
    )

    if (
      !published.success ||
      !published.publicationId ||
      published.revision == null
    ) {
      return {
        success: false,
        error:
          published.error ??
          "Publication could not be confirmed.",
      }
    }

    confirmedPublication = {
      publicationId: published.publicationId,
      revision: published.revision,
      isSchoolExam,
    }

    // -----------------------------------------
    // 2. Initialize assessment links only for
    // school examinations.
    // -----------------------------------------
    if (isSchoolExam) {
      const assessment =
        await initializeSchoolAssessmentLinksAction(
          examId,
          slug,
          published.publicationId
        )

      if (!assessment.success) {
        return {
          success: false,
          published: true,
          publicationId: published.publicationId,
          revision: published.revision,
          isSchoolExam: true,
          error:
            "Revision " +
            published.revision +
            " was published, but school assessment " +
            "links could not be initialized. " +
            assessment.error,
        }
      }
    }

    // -----------------------------------------
    // 3. Student assignment remains in the
    // existing client-side batch workflow.
    // -----------------------------------------
    return {
      success: true,
      publicationId: published.publicationId,
      revision: published.revision,
      isSchoolExam,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to publish.",

      // Once the publication is confirmed, a subsequent
      // error must not cause the user to publish again.
      ...(confirmedPublication
        ? {
            published: true,
            ...confirmedPublication,
          }
        : {}),
    }
  }
}


function getAssignmentError(error: unknown): string {
  if (error instanceof Error) return error.message

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message
    }

    if (typeof value.error === "string" && value.error.trim()) {
      return value.error
    }

    if (typeof value.details === "string" && value.details.trim()) {
      return value.details
    }
  }

  if (typeof error === "string" && error.trim()) return error

  return "An unexpected assignment error occurred."
}

function logAssignmentError(
  stage: string,
  error: unknown,
  context: {
    examId: string
    publicationId: string
    choice: AssignmentChoice
    cursor: string | null
  }
) {
  console.error("[CBT:AUTO_ASSIGN]", {
    stage,
    ...context,
    message: getAssignmentError(error),
    error,
  })
}

export async function assignSchoolPublicationBatchAction(args: {
  examId: string
  slug: string
  publicationId: string
  choice: AssignmentChoice
  selectedIds: string[]
  cursor: string | null
}): Promise<
  | {
      success: true
      batch: Omit<
        AssignmentProgress,
        "publicationId" | "revision"
      >
    }
  | {
      success: false
      error: string
    }
> {
  const {
    examId,
    slug,
    publicationId,
    choice,
    selectedIds,
    cursor,
  } = args

  if (
    !uuid(examId) ||
    !uuid(publicationId) ||
    (cursor !== null && !uuid(cursor)) ||
    !["all", "specific"].includes(choice) ||
    selectedIds.length > 500 ||
    selectedIds.some(id => !uuid(id)) ||
    new Set(selectedIds).size !== selectedIds.length ||
    (choice === "specific" && selectedIds.length === 0)
  ) {
    return {
      success: false,
      error: "Invalid automatic-assignment request.",
    }
  }

  let stage = "staff authorization"

  const logContext = {
    examId,
    publicationId,
    choice,
    cursor,
  }

  try {
    const context = await contextForExam(examId, slug)

    // Step 1: verify the published revision.
    stage = "publication lookup"

    const { data: publication, error: publicationError } =
      await context.supabase
        .from(tables.cbt_exam_publications)
        .select("id, revision")
        .eq("id", publicationId)
        .eq("exam_id", examId)
        .eq("organization_id", context.organizationId)
        .maybeSingle()

    if (publicationError) throw publicationError

    if (!publication) {
      throw new Error(
        "The published examination revision could not be found."
      )
    }

    // Step 2: verify this publication is sealed.
    stage = "publication seal"

    const { data: seal, error: sealError } =
      await context.supabase
        .from("cbt_exam_publication_seals")
        .select("publication_id")
        .eq("organization_id", context.organizationId)
        .eq("publication_id", publicationId)
        .maybeSingle()

    if (sealError) throw sealError

    if (!seal) {
      throw new Error(
        "This examination publication has not been sealed."
      )
    }

    // Step 3: read the actual access mode.
    stage = "access policy"

    const { data: policy, error: policyError } =
      await context.supabase
        .from("cbt_exam_access_policies")
        .select("mode")
        .eq("organization_id", context.organizationId)
        .eq("publication_id", publicationId)
        .maybeSingle()

    if (policyError) throw policyError

    if (
      !policy ||
      !["registered", "access_code"].includes(policy.mode)
    ) {
      throw new Error(
        "This publication does not currently support private candidate assignment."
      )
    }

    const accessMode = policy.mode as
      | "registered"
      | "access_code"

    // Step 4: load students from the selected exam classes.
    stage = "school student selection"

    const { data: selection, error: selectionError } =
      await context.supabase.rpc(
        "cbt_get_school_publication_candidates",
        {
          p_exam_id: examId,
          p_search: "",
          p_after: cursor,
          p_limit: 100,
          p_only_ids:
            choice === "specific" ? selectedIds : null,
        }
      )

    if (selectionError) throw selectionError

    if (!selection || typeof selection !== "object") {
      throw new Error(
        "The school student selector returned an invalid response."
      )
    }

    const page = selection as CandidatePage

    if (!page.isSchoolExam) {
      throw new Error(
        "This examination is not linked to a school academic context."
      )
    }

    if (!Array.isArray(page.rows)) {
      throw new Error(
        "The school student selector did not return a student list."
      )
    }

    const rows = page.rows

    // Registered access requires an active linked account.
    // Exam Number access does not require a student account.
    const ids =
      accessMode === "registered"
        ? rows
            .filter(row => row.loginReady === true)
            .map(row => row.id)
        : rows.map(row => row.id)

    if (
      ids.some(id => !uuid(id)) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error(
        "The selected student batch contains invalid or duplicate identifiers."
      )
    }

    const skippedNoAccount = rows.length - ids.length

    let assigned = 0
    let restored = 0
    let alreadyAssigned = 0
    let createdCandidates = 0

    // Step 5: create assignments.
    // The existing database RPCs remain authoritative.
    if (ids.length > 0) {
      if (accessMode === "access_code") {
        stage = "Exam Number assignment"

        const result =
          await assignPrivateCodeCandidatesAction(
            publicationId,
            slug,
            "school",
            ids
          )

        if (!result.success) {
          throw new Error(
            result.error ||
              "The Exam Number assignment service failed."
          )
        }

        assigned = result.data.assigned ?? 0
        restored = result.data.restored ?? 0
        alreadyAssigned =
          result.data.alreadyAssigned ?? 0
        createdCandidates =
          result.data.createdCandidates ?? 0
      } else {
        stage = "registered student assignment"

        const { data: result, error: assignmentError } =
          await context.supabase.rpc(
            "cbt_apply_candidate_assignments",
            {
              p_publication_id: publicationId,
              p_source: "school",
              p_ids: ids,
              p_status: "assigned",
            }
          )

        if (assignmentError) throw assignmentError

        if (!result || typeof result !== "object") {
          throw new Error(
            "The registered assignment service returned no result."
          )
        }

        const counts = result as {
          assigned?: number
          restored?: number
          alreadyAssigned?: number
          createdCandidates?: number
        }

        assigned = counts.assigned ?? 0
        restored = counts.restored ?? 0
        alreadyAssigned =
          counts.alreadyAssigned ?? 0
        createdCandidates =
          counts.createdCandidates ?? 0
      }
    }

    stage = "completion"

    revalidatePath(
      `/exams/${encodeURIComponent(slug)}/candidates`
    )

    return {
      success: true,
      batch: {
        assigned,
        restored,
        alreadyAssigned,
        createdCandidates,
        skippedNoAccount,
        processed: rows.length,
        completed: !page.hasMore,
        nextCursor: page.nextCursor,
      },
    }
  } catch (error) {
    logAssignmentError(stage, error, logContext)

    return {
      success: false,
      error:
        `${stage}: ${getAssignmentError(error)}`,
    }
  }
}


export type SchoolAssessmentInitializationResult =
  | {
      success: true
      status: "ready" | "setup_not_configured"
      linked: number
      expected: number
    }
  | {
      success: false
      error: string
    }

/**
 * Initialize assessment links for an already published
 * school examination revision.
 *
 * Safe to retry for the same exam and publication.
 * Never publishes a new examination revision.
 */
export async function initializeSchoolAssessmentLinksAction(
  examId: string,
  slug: string,
  publicationId: string
): Promise<SchoolAssessmentInitializationResult> {
  if (
    // !uuid(examId) ||
    // !uuid(publicationId) ||
    !slug.trim()
  ) {
    return {
      success: false,
      error: "Invalid examination publication.",
    }
  }

  try {
    const context = await contextForExam(examId, slug)

    const { data, error } = await context.supabase.rpc(
      "cbt_school_initialize_assessment_links",
      {
        p_exam_id: examId,
        p_publication_id: publicationId,
      }
    )

    if (error) {
      console.error(
        "[CBT:INITIALIZE_SCHOOL_ASSESSMENTS]",
        {
          examId,
          publicationId,
          error,
        }
      )

      return {
        success: false,
        error:
          error.message ||
          "Unable to initialize school assessment links.",
      }
    }

    if (
      !data ||
      data.ok !== true ||
      !["ready", "setup_not_configured"].includes(
        data.status
      )
    ) {
      return {
        success: false,
        error:
          "School assessment initialization could not be confirmed.",
      }
    }

    return {
      success: true,
      status: data.status,
      linked: Number(data.linked ?? 0),
      expected: Number(data.expected ?? 0),
    }
  } catch (error) {
    console.error(
      "[CBT:SCHOOL_ASSESSMENT_INITIALIZATION]",
      error
    )

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to initialize school assessments.",
    }
  }
}

