
import "server-only"

import { redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { urls } from "@/constants"

export type SetupClass = {
  id: string
  name: string
  slug: string
  level_id: string
  arm_id: string | null
  stream_id: string | null
}

export type SetupSubject = {
  id: string
  name: string
  code: string | null
}

export type SetupOffering = {
  id: string
  class_id: string
  subject_id: string
}

export type ClassLevel = {
  id: string
  name: string
  position: number
}

export type ClassArm = {
  id: string
  name: string
}

// Add these properties to ClassSubjectData:
export type ClassSubjectData = {
  classes: SetupClass[]
  subjects: SetupSubject[]
  offerings: SetupOffering[]
  levels: ClassLevel[]
  arms: ClassArm[]
}


export async function getClassSubjectSetupData(
  sessionId: string,
  termId: string
): Promise<ClassSubjectData | null> {
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const organizationId = context.organizationId

  // Validate the academic period.
  const [sessionResult, termResult] =
    await Promise.all([
      context.supabase
        .from("school_academic_sessions")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", sessionId)
        .maybeSingle(),

      context.supabase
        .from("school_terms")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("session_id", sessionId)
        .eq("id", termId)
        .maybeSingle(),
    ])

  if (
    sessionResult.error ||
    termResult.error ||
    !sessionResult.data ||
    !termResult.data
  ) {
    return null
  }

  const [classesResult, subjectsResult, offeringsResult, levelsResult, armsResult] =
    await Promise.all([
      context.supabase
        .from("school_classes")
        .select(
          "id, name, slug, level_id, arm_id, stream_id"
        )
        .eq("organization_id", organizationId)
        .eq("session_id", sessionId)
        .order("name"),

      context.supabase
        .from("school_subjects")
        .select("id, name, code")
        .eq("organization_id", organizationId)
        .order("name"),

      context.supabase
        .from("school_subject_offerings")
        .select("id, class_id, subject_id")
        .eq("organization_id", organizationId)
        .eq("session_id", sessionId)
        .eq("term_id", termId),
    
    context.supabase
    .from("school_class_levels")
    .select("id, name, position")
    .eq("organization_id", organizationId)
    .order("position"),

    context.supabase
    .from("school_arms")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name"),

    ])

  if (
    classesResult.error ||
    subjectsResult.error ||
    offeringsResult.error
  ) {
    console.error("[SCHOOL:CLASS_SUBJECT_SETUP]", {
      classes: classesResult.error?.message,
      subjects: subjectsResult.error?.message,
      offerings: offeringsResult.error?.message,
    })

    return null
  }

  return {
    classes: classesResult.data ?? [],
    subjects: subjectsResult.data ?? [],
    offerings: offeringsResult.data ?? [],
    levels: levelsResult.data ?? [],
    arms: armsResult.data ?? [],
  }
}
