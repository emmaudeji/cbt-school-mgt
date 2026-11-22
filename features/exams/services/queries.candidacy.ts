 
import "server-only"

import { cache } from "react"
import { notFound } from "next/navigation"

import { tables } from "@/constants"
import { getStaffContext } from "@/services/auth"

import type {
  CandidateManagementData,
  ManagedCandidate,
  CandidateAssignment,
} from "@/types/candidate-management"

export const getExamCandidateManagement = cache(
  async (slug: string): Promise<CandidateManagementData> => {
    const context = await getStaffContext()

    if (!context) notFound()

    const { supabase, organizationId } = context

    // 1. Get examination
    const { data: exam, error: examError } = await supabase
      .from(tables.cbt_exams)
      .select("id, slug, title, status")
      .eq("organization_id", organizationId)
      .eq("slug", slug)
      .maybeSingle()

    if (examError) {
      console.error("[CBT:CANDIDATE_EXAM]", examError)
      throw new Error("Unable to load examination.")
    }

    if (!exam) notFound()

    // 2. Get latest sealed publication and its access policy
    const { data: publications, error: publicationError } =
      await supabase
        .from(tables.cbt_exam_publications)
        .select(`
          id,
          revision,
          available_from,
          available_until,
          cbt_exam_publication_seals!inner (
            publication_id
          ),
          access_policy:cbt_exam_access_policies (
            mode,
            entry_code
          )
        `)
        .eq("organization_id", organizationId)
        .eq("exam_id", exam.id)
        .order("revision", { ascending: false })
        .limit(1)

    if (publicationError) {
      console.error(
        "[CBT:CANDIDATE_PUBLICATION]",
        publicationError
      )

      throw new Error("Unable to load examination publication.")
    }

    const publicationRow = publications?.[0] ?? null

    // 3. No publication yet
    if (!publicationRow) {
      return {
        exam,
        publication: null,
        candidates: [],
        assignments: [],
        accessMode: null,
        publicLinkCode: null,
      }
    }

    const publication = {
      id: publicationRow.id,
      revision: publicationRow.revision,
      available_from: publicationRow.available_from,
      available_until: publicationRow.available_until,
    }

    const access_policy = publicationRow.access_policy as unknown as {mode: string, entry_code: string}

    const accessMode = access_policy.mode ?? null

    const publicLinkCode =
      accessMode === "open_link"
        ? access_policy?.entry_code ?? null
        : null

    // 4. Load assignments for the current publication.
    // Include candidate details because public candidates
    // do not have organization memberships.
    const assignmentsQuery = supabase
      .from(tables.cbt_exam_assignments)
      .select(`
        id,
        candidate_id,
        status,
        created_at,
        candidate:cbt_candidates!cbt_assignments_candidate_fk (
          id,
          first_name,
          last_name,
          candidate_code,
          source
        )
      `)
      .eq("organization_id", organizationId)
      .eq("publication_id", publication.id)
      .order("created_at", { ascending: false })

    // 5. Only registered examinations need the
    // organization membership-linked candidate directory.
    if (accessMode !== "registered") {
      const { data: assignments, error } =
        await assignmentsQuery

      if (error) {
        console.error(
          "[CBT:PUBLIC_CANDIDATE_ASSIGNMENTS]",
          error
        )

        throw new Error("Unable to load examination participants.")
      }

      return {
        exam,
        publication,
        accessMode,
        publicLinkCode,
        candidates: [],
        assignments: (assignments ?? []) as unknown as CandidateAssignment[],
      }
    }

    // 6. Registered examinations need both the directory
    // and their existing assignments.
    const [candidatesResult, assignmentsResult] =
      await Promise.all([
        supabase
          .from(tables.cbt_candidates)
          .select(`
            id,
            membership_id,
            candidate_code,
            first_name,
            last_name,
            status,
            source
          `)
          .eq("organization_id", organizationId)
          .not("membership_id", "is", null)
          .order("last_name")
          .order("first_name")
          .limit(1000),

        assignmentsQuery,
      ])

    if (candidatesResult.error || assignmentsResult.error) {
      console.error("[CBT:CANDIDATE_MANAGEMENT]", {
        candidates: candidatesResult.error,
        assignments: assignmentsResult.error,
      })

      throw new Error(
        "Unable to load candidates and assignments."
      )
    }

    return {
      exam,
      publication,
      accessMode,
      publicLinkCode,
      candidates:
        (candidatesResult.data ?? []) as ManagedCandidate[],
      assignments:
        (assignmentsResult.data ?? []) as unknown as CandidateAssignment[],
    }
  }
)
