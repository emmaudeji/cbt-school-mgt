
"use server"

import { revalidatePath } from "next/cache"

import { getStaffContext } from "@/services/auth"
import { tables, urls } from "@/constants"
import { CreateClassState, SaveClassSubjectsState, SetupActionState } from "./action-states"

 
export async function createAcademicPeriod(
  _previous: SetupActionState,
  formData: FormData
): Promise<SetupActionState> {
  const context = await getStaffContext()

  if (!context) {
    return {
      ok: false,
      message: "Please sign in to continue.",
      id: null,
    }
  }

  const organizationId = context.organizationId
  const kind = String(formData.get("kind") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const sessionId = String(
    formData.get("sessionId") ?? ""
  )

  const { data: school, error: schoolError } =
    await context.supabase
      .from("organizations")
      .select("id, type, status")
      .eq("id", organizationId)
      .maybeSingle()

  if (
    schoolError ||
    !school ||
    school.type !== "school" ||
    school.status !== "active"
  ) {
    return {
      ok: false,
      message: "School is unavailable.",
      id: null,
    }
  }

  if (kind === "session") {
    const match = /^(\d{4})\/(\d{4})$/.exec(name)

    if (
      !match ||
      Number(match[2]) !== Number(match[1]) + 1
    ) {
      return {
        ok: false,
        message:
          "Use a valid academic session, such as 2026/2027.",
        id: null,
      }
    }

    const { data: existing } =
      await context.supabase
        .from("school_academic_sessions")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", name)
        .maybeSingle()

    if (existing) {
      return {
        ok: true,
        message: "This session already exists.",
        id: existing.id,
      }
    }

    const { data, error } =
      await context.supabase
        .from("school_academic_sessions")
        .insert({
          organization_id: organizationId,
          name,
          is_current: false,
        })
        .select("id")
        .single()

    if (error) {
      console.error(
        "[SCHOOL:CREATE_SESSION]",
        error
      )

      return {
        ok: false,
        message:
          error.code === "23505"
            ? "This session already exists. Refresh and select it."
            : "Could not create the session. Check your permissions.",
        id: null,
      }
    }

    revalidatePath(urls.schoolAcademicSetup)

    return {
      ok: true,
      message: "Academic session created.",
      id: data.id,
    }
  }

  if (kind === "term") {
    const positions: Record<string, number> = {
      "First Term": 1,
      "Second Term": 2,
      "Third Term": 3,
    }

    const position = positions[name]

    if (!position || !sessionId) {
      return {
        ok: false,
        message: "Choose a session and a valid term.",
        id: null,
      }
    }

    const { data: session, error: sessionError } =
      await context.supabase
        .from("school_academic_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("organization_id", organizationId)
        .maybeSingle()

    if (sessionError || !session) {
      return {
        ok: false,
        message:
          "The selected academic session was not found.",
        id: null,
      }
    }

    const { data: existing } =
      await context.supabase
        .from("school_terms")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("session_id", sessionId)
        .eq("name", name)
        .maybeSingle()

    if (existing) {
      return {
        ok: true,
        message: "This term already exists.",
        id: existing.id,
      }
    }

    const { data, error } =
      await context.supabase
        .from("school_terms")
        .insert({
          organization_id: organizationId,
          session_id: sessionId,
          name,
          position,
          is_current: false,
        })
        .select("id")
        .single()

    if (error) {
      console.log(
        "[SCHOOL:CREATE_TERM]",
        error
      )

      return {
        ok: false,
        message:
          error.code === "23505"
            ? "This term already exists. Refresh and select it."
            : "Could not create the term. Check your permissions.",
        id: null,
      }
    }

    revalidatePath(urls.schoolAcademicSetup)

    return {
      ok: true,
      message: "School term created.",
      id: data.id,
    }
  }

  return {
    ok: false,
    message: "Invalid setup operation.",
    id: null,
  }
}


 
export async function saveClassSubjects(
  _previous: SaveClassSubjectsState,
  formData: FormData
): Promise<SaveClassSubjectsState> {
  const context = await getStaffContext()

  if (!context) {
    return {
      ok: false,
      message: "Please sign in to continue.",
      created: 0,
    }
  }

  const sessionId = String(
    formData.get("sessionId") ?? ""
  )
  const termId = String(
    formData.get("termId") ?? ""
  )
  const classId = String(
    formData.get("classId") ?? ""
  )

  let subjectIds: string[] = []

  try {
    const parsed = JSON.parse(
      String(formData.get("subjectIds") ?? "[]")
    )

    if (
      !Array.isArray(parsed) ||
      parsed.length > 200 ||
      !parsed.every(
        (id) => typeof id === "string"
      )
    ) {
      throw new Error("Invalid subjects")
    }

    subjectIds = [...new Set(parsed)]
  } catch {
    return {
      ok: false,
      message: "Invalid subject selection.",
      created: 0,
    }
  }

  if (
    !sessionId ||
    !termId ||
    !classId ||
    subjectIds.length === 0
  ) {
    return {
      ok: false,
      message: "Select at least one new subject.",
      created: 0,
    }
  }

  const { data, error } =
    await context.supabase.rpc(
      "school_setup_add_subject_offerings",
      {
        p_session_id: sessionId,
        p_term_id: termId,
        p_class_id: classId,
        p_subject_ids: subjectIds,
      }
    )

  if (error) {
    console.error(
      "[SCHOOL:SAVE_CLASS_SUBJECTS]",
      error
    )

    return {
      ok: false,
      message:
        error.code === "42501"
          ? "You do not have permission to update school subjects."
          : "Unable to save class subjects.",
      created: 0,
    }
  }

  if (!data?.ok) {
    return {
      ok: false,
      message: "The subjects could not be saved.",
      created: 0,
    }
  }

  revalidatePath(urls.schoolAcademicSetup)

  return {
    ok: true,
    message:
      Number(data.created) > 0
        ? `${data.created} subject(s) added successfully.`
        : "All selected subjects are already assigned.",
    created: Number(data.created ?? 0),
  }
}



export async function createAcademicClass(
  _previous: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  const fail = (message: string): CreateClassState => ({
    ok: false,
    message,
    id: null,
  })

  const context = await getStaffContext()

  if (!context) return fail("Please sign in.")

  const orgId = context.organizationId
  const sessionId = String(formData.get("sessionId") ?? "")
  const levelId = String(formData.get("levelId") ?? "")
  const armId = String(formData.get("armId") ?? "")

  if (!sessionId || !levelId) {
    return fail("Choose the session and class level.")
  }

  const [session, level, arm] = await Promise.all([
    context.supabase
      .from("school_academic_sessions")
      .select("id")
      .eq("organization_id", orgId)
      .eq("id", sessionId)
      .maybeSingle(),

    context.supabase
      .from("school_class_levels")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("id", levelId)
      .maybeSingle(),

    armId
      ? context.supabase
          .from("school_arms")
          .select("id, name")
          .eq("organization_id", orgId)
          .eq("id", armId)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ])

  if (
    session.error ||
    level.error ||
    arm.error ||
    !session.data ||
    !level.data ||
    (armId && !arm.data)
  ) {
    return fail("Invalid school class configuration.")
  }

  const name = [
    level.data.name,
    arm.data?.name,
  ].filter(Boolean).join(" ")

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  if (!slug) {
    return fail("Invalid class name.")
  }

  const { data: existing, error: lookupError } =
    await context.supabase
      .from(tables.school_classes)
      .select("id")
      .eq("organization_id", orgId)
      .eq("session_id", sessionId)
      .eq("slug", slug)
      .maybeSingle()

  if (lookupError) {
    console.log("[SCHOOL:CLASS_LOOKUP]", lookupError)
    return fail("Unable to check existing classes.")
  }

  if (existing) {
    return {
      ok: true,
      message: "Class already exists.",
      id: existing.id,
    }
  }

  const { data, error } = await context.supabase
    .from("school_classes")
    .insert({
      organization_id: orgId,
      session_id: sessionId,
      level_id: levelId,
      arm_id: armId || null,
      stream_id: null,
      name,
      slug,
    })
    .select("id")
    .single()

  if (error) {
    console.log("[SCHOOL:CREATE_CLASS]", error)

    return fail(
      error.code === "23505"
        ? "This class already exists. Refresh and select it."
        : "Unable to create class. Check your school permissions."
    )
  }

  revalidatePath(urls.schoolAcademicSetup)

  return {
    ok: true,
    message: `${name} created successfully.`,
    id: data.id,
  }
}


import type {
  ApplyAssessmentState,
} from "./action-states"

export async function applyAssessmentTemplate(
  _previous: ApplyAssessmentState,
  formData: FormData
): Promise<ApplyAssessmentState> {
  const fail = (
    message: string
  ): ApplyAssessmentState => ({
    ok: false,
    message,
    created: 0,
    preserved: 0,
  })

  const context = await getStaffContext()

  if (!context) {
    return fail("Please sign in to continue.")
  }

  const sessionId = String(
    formData.get("sessionId") ?? ""
  )

  const termId = String(
    formData.get("termId") ?? ""
  )

  const sourceOfferingId = String(
    formData.get("sourceOfferingId") ?? ""
  )

  let offeringIds: string[]

  try {
    const parsed = JSON.parse(
      String(formData.get("offeringIds") ?? "[]")
    )

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.length > 500 ||
      !parsed.every(
        (id) => typeof id === "string" && id.length > 0
      )
    ) {
      return fail("Select valid subject offerings.")
    }

    offeringIds = [...new Set(parsed)]
  } catch {
    return fail("Invalid subject selection.")
  }

  if (!sessionId || !termId) {
    return fail("Select an academic session and term.")
  }

  const { data, error } = await context.supabase.rpc(
    "school_setup_apply_assessment_template",
    {
      p_session_id: sessionId,
      p_term_id: termId,
      p_offering_ids: offeringIds,
      p_source_offering_id:
        sourceOfferingId || null,
    }
  )

  if (error) {
    console.error(
      "[SCHOOL:APPLY_ASSESSMENTS]",
      error
    )

    return fail(
      error.code === "42501"
        ? "You do not have permission to configure assessments."
        : "Could not apply assessment setup. Check the selected subjects."
    )
  }

  if (!data?.ok) {
    return fail("Assessment setup was not completed.")
  }

  revalidatePath(urls.schoolAcademicSetup)

  const created = Number(data.created ?? 0)
  const preserved = Number(data.preserved ?? 0)

  return {
    ok: true,
    message:
      created > 0
        ? `${created} assessment component(s) created successfully.`
        : "All selected assessment components already exist.",
    created,
    preserved,
  }
}
