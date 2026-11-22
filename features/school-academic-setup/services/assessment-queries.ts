
import "server-only"

import { redirect } from "next/navigation"

import { getStaffContext } from "@/services/auth"
import { urls } from "@/constants"

export type AssessmentOffering = {
  id: string
  class_id: string
  subject_id: string
}

export type AssessmentComponent = {
  id: string
  offering_id: string
  name: string
  position: number
  maximum_score: number
  weight_percent: number
}

export type AssessmentSetupData = {
  classes: {
    id: string
    name: string
  }[]
  subjects: {
    id: string
    name: string
  }[]
  offerings: AssessmentOffering[]
  components: AssessmentComponent[]
}

export async function getAssessmentSetupData(
  sessionId: string,
  termId: string
): Promise<AssessmentSetupData | null> {
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const orgId = context.organizationId

  const [session, term] = await Promise.all([
    context.supabase
      .from("school_academic_sessions")
      .select("id")
      .eq("organization_id", orgId)
      .eq("id", sessionId)
      .maybeSingle(),

    context.supabase
      .from("school_terms")
      .select("id")
      .eq("organization_id", orgId)
      .eq("session_id", sessionId)
      .eq("id", termId)
      .maybeSingle(),
  ])

  if (
    session.error ||
    term.error ||
    !session.data ||
    !term.data
  ) {
    return null
  }

  const [classes, subjects, offerings] =
    await Promise.all([
      context.supabase
        .from("school_classes")
        .select("id, name")
        .eq("organization_id", orgId)
        .eq("session_id", sessionId)
        .order("name"),

      context.supabase
        .from("school_subjects")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name"),

      context.supabase
        .from("school_subject_offerings")
        .select("id, class_id, subject_id")
        .eq("organization_id", orgId)
        .eq("session_id", sessionId)
        .eq("term_id", termId),
    ])

  if (
    classes.error ||
    subjects.error ||
    offerings.error
  ) {
    console.error("[SCHOOL:ASSESSMENT_SETUP]", {
      classes: classes.error,
      subjects: subjects.error,
      offerings: offerings.error,
    })
    return null
  }

  const offeringIds =
    (offerings.data ?? []).map((item) => item.id)

  let components: AssessmentComponent[] = []

  if (offeringIds.length) {
    // Batch reads to avoid large URL filters.
    const batchSize = 150

    for (
      let index = 0;
      index < offeringIds.length;
      index += batchSize
    ) {
      const ids = offeringIds.slice(
        index,
        index + batchSize
      )

      const result = await context.supabase
        .from("school_assessment_components")
        .select(
          "id, offering_id, name, position, maximum_score, weight_percent"
        )
        .eq("organization_id", orgId)
        .in("offering_id", ids)
        .order("position")

      if (result.error) {
        console.error(
          "[SCHOOL:ASSESSMENT_COMPONENTS]",
          result.error
        )
        return null
      }

      components.push(...(result.data ?? []))
    }
  }

  return {
    classes: classes.data ?? [],
    subjects: subjects.data ?? [],
    offerings: offerings.data ?? [],
    components,
  }
}
