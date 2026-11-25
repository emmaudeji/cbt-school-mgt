import "server-only"

import { getStaffContext } from "@/services/auth"

export type SchoolAssessmentSetupComponent = {
  id: string
  offering_id: string
  name: string
  maximum_score: number
  weight_percent: number
  position: number
}

export type SchoolAssessmentSetupResult = {
  components: SchoolAssessmentSetupComponent[]
  error: string | null
}

/**
 * Load assessment components belonging to the staff member's
 * current school organization.
 *
 * These components will be matched against the subject
 * offering IDs selected in NewExamForm.
 *
 * This is read-only. It does not create assessment links.
 */
export async function getSchoolAssessmentSetupOptions():
  Promise<SchoolAssessmentSetupResult> {
  const context = await getStaffContext()

  if (!context) {
    return {
      components: [],
      error: "Your session has expired. Please sign in again.",
    }
  }

  const { supabase, organizationId } = context

  const { data, error } = await supabase
    .from("school_assessment_components")
    .select(`
      id,
      offering_id,
      name,
      maximum_score,
      weight_percent,
      position
    `)
    .eq("organization_id", organizationId)
    .order("position", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error(
      "[CBT:ASSESSMENT_SETUP_OPTIONS]",
      error
    )

    return {
      components: [],
      error: "Unable to load school assessment components.",
    }
  }

  return {
    components: (data ?? []) as SchoolAssessmentSetupComponent[],
    error: null,
  }
}