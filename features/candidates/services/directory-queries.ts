
"use server"

import { getStaffContext } from "@/services/auth"

import type {
  DirectoryFilters,
  DirectoryPage,
} from "./directory-types"

export type ExamDirectoryCandidate = DirectoryPage["rows"][number] & {
  exam_assignment_status?: "assigned" | "revoked" | null
}

export type ExamDirectoryPage = Omit<DirectoryPage, "rows"> & {
  rows: ExamDirectoryCandidate[]
}

type DirectoryQuery = DirectoryFilters & {
  publicationId?: string
}

export async function getCandidateDirectory(
  filters: DirectoryQuery
): Promise<ExamDirectoryPage> {
  const context = await getStaffContext()

  if (!context) {
    throw new Error("Your session has expired.")
  }

  const page = Number.isInteger(filters.page)
    ? Math.max(1, filters.page)
    : 1

  const common = {
    p_organization_id: context.organizationId,
    p_search: (filters.search ?? "").slice(0, 120),
    p_status: filters.status,
    p_page: page,
    p_page_size: 25,
  }

  const { data, error } = filters.publicationId
    ? await context.supabase.rpc(
        "cbt_list_exam_candidate_directory",
        {
          ...common,
          p_publication_id: filters.publicationId,
        }
      )
    : await context.supabase.rpc(
        "cbt_list_candidate_directory",
        common
      )

  if (error) {
    console.error("[CandidateDirectory]", error.code)
    throw new Error(
      "Unable to load candidates. Check your examination permissions."
    )
  }

  return data as ExamDirectoryPage
}
