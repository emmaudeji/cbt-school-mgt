
"use server"

import { revalidatePath } from "next/cache"

import { getStaffContext } from "@/services/auth"

import type {
  EnrollmentActionState,
  EndEnrollmentState,
} from "./action-states"

const ENROLLMENT_PATH = "/school/enrollment"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function enrollExistingStudents(
  _previous: EnrollmentActionState,
  formData: FormData
): Promise<EnrollmentActionState> {
  const fail = (
    message: string
  ): EnrollmentActionState => ({
    ok: false,
    message,
    created: 0,
    skipped: 0,
  })

  const context = await getStaffContext()

  if (!context) {
    return fail("Please sign in to continue.")
  }

  const sessionId = String(
    formData.get("sessionId") ?? ""
  )

  const classId = String(
    formData.get("classId") ?? ""
  )

  let studentIds: string[]

  try {
    const parsed = JSON.parse(
      String(formData.get("studentIds") ?? "[]")
    )

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.length > 300 ||
      !parsed.every(
        (id) =>
          typeof id === "string" &&
          UUID_PATTERN.test(id)
      )
    ) {
      return fail("Choose valid students.")
    }

    studentIds = [...new Set(parsed)]
  } catch {
    return fail("Invalid student selection.")
  }

  if (
    !UUID_PATTERN.test(sessionId) ||
    !UUID_PATTERN.test(classId)
  ) {
    return fail(
      "Choose a valid academic session and class."
    )
  }

  const { data: school, error: schoolError } =
    await context.supabase
      .from("organizations")
      .select("slug, type, status")
      .eq("id", context.organizationId)
      .maybeSingle()

  if (
    schoolError ||
    !school ||
    school.type !== "school" ||
    school.status !== "active"
  ) {
    return fail("Your school is unavailable.")
  }

  const { data, error } =
    await context.supabase.rpc(
      "enroll_school_students",
      {
        p_organization_slug: school.slug,
        p_session_id: sessionId,
        p_class_id: classId,
        p_student_ids: studentIds,
      }
    )

  if (error) {
    console.error(
      "[SCHOOL:ENROLL_STUDENTS]",
      error
    )

    return fail(
      error.code === "42501"
        ? "You do not have permission to enroll students."
        : "Enrollment could not be completed. Check the selected students and academic session."
    )
  }

  const created = Number(
    data?.created_count ?? 0
  )

  const skipped = Number(
    data?.skipped_count ?? 0
  )

  revalidatePath(ENROLLMENT_PATH)

  return {
    ok: true,
    message:
      created > 0
        ? `${created} student(s) enrolled successfully.`
        : "No new placements were needed.",
    created,
    skipped,
  }
}

export async function endStudentPlacement(
  _previous: EndEnrollmentState,
  formData: FormData
): Promise<EndEnrollmentState> {
  const fail = (message: string): EndEnrollmentState => ({
    ok: false,
    message,
  })

  const context = await getStaffContext()

  if (!context) {
    return fail("Please sign in to continue.")
  }

  const enrollmentId = String(
    formData.get("enrollmentId") ?? ""
  )

  const leftOn = String(
    formData.get("leftOn") ?? ""
  )

  if (!UUID_PATTERN.test(enrollmentId)) {
    return fail("Invalid student placement.")
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(leftOn) ||
    !Number.isFinite(Date.parse(`${leftOn}T00:00:00Z`)) ||
    new Date(`${leftOn}T00:00:00Z`)
      .toISOString()
      .slice(0, 10) !== leftOn
  ) {
    return fail("Choose a valid placement end date.")
  }

  // Check that this placement belongs to the staff
  // member's school before invoking the RPC.
  const { data: enrollment, error: lookupError } =
    await context.supabase
      .from("school_enrollments")
      .select("id, status, enrolled_on, session_id")
      .eq("id", enrollmentId)
      .eq(
        "organization_id",
        context.organizationId
      )
      .maybeSingle()

  if (
    lookupError ||
    !enrollment ||
    enrollment.status !== "active"
  ) {
    return fail(
      "This active placement was not found."
    )
  }

  const { data: session, error: sessionError } =
    await context.supabase
      .from("school_academic_sessions")
      .select("starts_on, ends_on")
      .eq(
        "organization_id",
        context.organizationId
      )
      .eq("id", enrollment.session_id)
      .maybeSingle()

  if (sessionError || !session) {
    return fail("Academic session unavailable.")
  }

  if (
    leftOn < enrollment.enrolled_on ||
    (session.starts_on &&
      leftOn < session.starts_on) ||
    (session.ends_on &&
      leftOn > session.ends_on)
  ) {
    return fail(
      "The end date must be on or after enrollment and within the academic session."
    )
  }

  const { error } = await context.supabase.rpc(
    "end_school_enrollment",
    {
      p_enrollment_id: enrollmentId,
      p_status: "withdrawn",
      p_left_on: leftOn,
    }
  )

  if (error) {
    console.error(
      "[SCHOOL:END_PLACEMENT]",
      error
    )

    return fail(
      error.code === "42501"
        ? "You do not have permission to change placements."
        : "Unable to end this placement. Check the effective date and try again."
    )
  }

  revalidatePath(ENROLLMENT_PATH)

  return {
    ok: true,
    message:
      "The placement has been ended. The student's academic history is preserved.",
  }
}
