
import "server-only"

import { cache } from "react"
import { notFound } from "next/navigation"

import { tables } from "@/constants"
import { getStaffContext } from "@/services/auth"

import type { CandidateManagementData } from "@/types/candidate-management"

export type ExamAssignmentContext = Pick<
  CandidateManagementData,
  "exam" | "publication" | "accessMode"
>

export const getExamAssignmentContext = cache(
  async (slug: string): Promise<ExamAssignmentContext> => {
    const context = await getStaffContext()

    if (!context) notFound()

    const { supabase, organizationId } = context

    const { data: exam, error: examError } = await supabase
      .from(tables.cbt_exams)
      .select("id, slug, title, status")
      .eq("organization_id", organizationId)
      .eq("slug", slug)
      .maybeSingle()

    if (examError) {
      console.error("[CBT:ASSIGNMENT_EXAM]", examError)
      throw new Error("Unable to load examination.")
    }

    if (!exam) notFound()

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
            mode
          )
        `)
        .eq("organization_id", organizationId)
        .eq("exam_id", exam.id)
        .order("revision", { ascending: false })
        .limit(1)

    if (publicationError) {
      console.error(
        "[CBT:ASSIGNMENT_PUBLICATION]",
        publicationError
      )

      throw new Error("Unable to load examination publication.")
    }

    const row = publications?.[0]

    if (!row) {
      return {
        exam,
        publication: null,
        accessMode: null,
      }
    }

    const policyValue = row.access_policy

    const policy = (
      Array.isArray(policyValue)
        ? policyValue[0]
        : policyValue
    ) as { mode: string } | null | undefined

    if (!policy?.mode) {
      throw new Error(
        "The published examination has no access policy."
      )
    }

    return {
      exam,
      publication: {
        id: row.id,
        revision: row.revision,
        available_from: row.available_from,
        available_until: row.available_until,
      },
      accessMode:
        policy.mode as CandidateManagementData["accessMode"],
    }
  }
)
