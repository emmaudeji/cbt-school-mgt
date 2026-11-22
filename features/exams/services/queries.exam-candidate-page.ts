import "server-only"

import { notFound } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { tables } from "@/constants"
import type { CandidateManagementData } from "@/types/candidate-management"
import {
  EMPTY_ROSTER,
  type CandidateListQuery,
  type ExamCandidateRosterPage,
  type ExamCandidateFilter,
} from "./exam-candidate-roster"

const FILTERS: ExamCandidateFilter[] = [
  "all", "not_started", "in_progress", "submitted", "closed", "revoked",
]

/**
 * Single page loader for the new examination Candidates screen.
 * Unlike the legacy management query, this does not load every assignment
 * or the first 1,000 directory candidates into the browser.
 */
export async function getExamCandidatesPage(slug: string, options: CandidateListQuery = {}) {
  const context = await getStaffContext()
  if (!context) notFound()

  const { supabase, organizationId } = context
  const examResult = await supabase
      .from(tables.cbt_exams)
      .select("id, slug, title, status")
      .eq("organization_id", organizationId)
      .eq("slug", slug)
      .maybeSingle()

  if (examResult.error) throw new Error("Unable to load examination.")
  if (!examResult.data) notFound()
  const exam = examResult.data

  const { data: publicationRows, error: publicationError } = await supabase
    .from(tables.cbt_exam_publications)
    .select(`
      id,
      revision,
      available_from,
      available_until,
      cbt_exam_publication_seals!inner (publication_id),
      access_policy:cbt_exam_access_policies (mode, entry_code)
    `)
    .eq("organization_id", organizationId)
    .eq("exam_id", exam.id)
    .order("revision", { ascending: false })
    .limit(1)

  if (publicationError) throw new Error("Unable to load examination publication.")

  const publicationRow = publicationRows?.[0]
  if (!publicationRow) {
    const data: CandidateManagementData = {
      exam,
      publication: null,
      accessMode: null,
      publicLinkCode: null,
      candidates: [],
      assignments: [],
    }
    return { data, roster: EMPTY_ROSTER }
  }

  // Supabase's relation typing varies according to relationship cardinality.
  const policyResult = publicationRow.access_policy as unknown
  const policy = (Array.isArray(policyResult) ? policyResult[0] : policyResult) as
    | { mode?: string; entry_code?: string | null }
    | undefined

  const mode = policy?.mode ?? null
  const data: CandidateManagementData = {
    exam,
    publication: {
      id: publicationRow.id,
      revision: publicationRow.revision,
      available_from: publicationRow.available_from,
      available_until: publicationRow.available_until,
    },
    accessMode: mode as CandidateManagementData["accessMode"],
    publicLinkCode: mode === "open_link" ? policy?.entry_code ?? null : null,
    candidates: [],
    assignments: [],
  }

  const filter = FILTERS.includes(options.filter ?? "all") ? options.filter ?? "all" : "all"
  const page = Math.max(1, Math.min(100000, Math.floor(options.page ?? 1) || 1))
  const search = (options.search ?? "").trim().slice(0, 120)

  const { data: raw, error } = await supabase.rpc("cbt_get_exam_candidate_roster", {
    p_publication_id: publicationRow.id,
    p_page: page,
    p_page_size: 20,
    p_search: search,
    p_filter: filter,
  })

  if (error) {
    console.log("[CBT:EXAM_CANDIDATE_ROSTER]", error)
    throw new Error("Unable to load the examination candidate list.")
  }

  return { data, roster: raw as unknown as ExamCandidateRosterPage }
}
