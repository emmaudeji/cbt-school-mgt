"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"

type State = { message: string; ok: boolean }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolve(slug: string) {
  const context = await getStaffContext()
  if (!context) throw new Error("Please sign in to manage examination links")
  const exam = await getExamBySlug(slug)
  if (exam.organization_id !== context.organizationId) throw new Error("Incorrect organization")
  return { context, exam }
}

export async function linkSchoolAssessment(_old: State, form: FormData): Promise<State> {
  console.log("======================")
  const slug = String(form.get("slug") ?? "")
  const publicationId = String(form.get("publicationId") ?? "")
  const componentId = String(form.get("componentId") ?? "")
  if (!slug || !publicationId || !componentId) {
    return { ok: false, message: "Select a published revision and assessment component." }
  }
  try {
    const { context, exam } = await resolve(slug)
    const { error } = await context.supabase.rpc("cbt_school_link_assessment", {
      p_exam_id: exam.id,
      p_publication_id: publicationId,
      p_component_id: componentId,
    })
    if (error) {
      console.error("[CBT:SCHOOL_LINK_CREATE]", error)
      return { ok: false, message: error.message }
    }
    revalidatePath(`/exams/${encodeURIComponent(slug)}/assessment-integration`)
    return { ok: true, message: "Assessment link saved. No scores were imported." }
  } catch (error) {
    console.error("[CBT:SCHOOL_LINK_CREATE]", error)
    return { ok: false, message: "Could not save the link. Check your staff access and try again." }
  }
}

export async function setSchoolAssessmentLinkActive(_old: State, form: FormData): Promise<State> {
  const slug = String(form.get("slug") ?? "")
  const linkId = String(form.get("linkId") ?? "")
  const active = form.get("active") === "true"
  if (!slug || !uuid.test(linkId)) return { ok: false, message: "Invalid link." }
  try {
    const { context, exam } = await resolve(slug)
    const { error } = await context.supabase.rpc("cbt_school_set_assessment_link_active", {
      p_exam_id: exam.id,
      p_link_id: linkId,
      p_active: active,
    })
    if (error) {
      console.error("[CBT:SCHOOL_LINK_STATUS]", error)
      return { ok: false, message: error.message }
    }
    revalidatePath(`/exams/${encodeURIComponent(slug)}/assessment-integration`)
    return { ok: true, message: active ? "Link activated." : "Link deactivated. Historical import records are preserved." }
  } catch (error) {
    console.error("[CBT:SCHOOL_LINK_STATUS]", error)
    return { ok: false, message: "Unable to change link status." }
  }
}

export async function getSchoolAssessmentIntegrationOverview(
  slug: string
) {
  try {
    const context = await getStaffContext()

    if (!context) {
      console.error(
        "[CBT:SCHOOL_ASSESSMENT_OVERVIEW] No staff context"
      )
      return null
    }

    const exam = await getExamBySlug(slug)

    if (exam.organization_id !== context.organizationId) {
      console.error(
        "[CBT:SCHOOL_ASSESSMENT_OVERVIEW] Organization mismatch"
      )
      return null
    }

    const { data, error } = await context.supabase.rpc(
      "cbt_school_assessment_integration_overview",
      { p_exam_id: exam.id }
    )

    if (error) {
      console.error(
        "[CBT:SCHOOL_ASSESSMENT_OVERVIEW]",
        error
      )
      return null
    }

    if (!data?.ok) {
      console.error(
        "[CBT:SCHOOL_ASSESSMENT_OVERVIEW] Invalid response",
        data
      )
      return null
    }

    return { exam, data }
  } catch (error) {
    console.error(
      "[CBT:SCHOOL_ASSESSMENT_OVERVIEW] Unexpected error",
      error
    )
    return null
  }
}
