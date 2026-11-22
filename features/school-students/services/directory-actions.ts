
"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"

import type { DirectoryActionState } from "./directory-state"

type Mode = "promote" | "transfer" | "remove"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PATH = "/school/students"

function fail(message: string): DirectoryActionState {
  return { ok: false, message, count: 0 }
}

export async function getDirectoryDestinationClasses(
  sessionId: string
): Promise<{
  classes: { id: string; name: string }[]
  error?: string
}> {
  const context = await getStaffContext()

  if (!context || !UUID.test(sessionId)) {
    return { classes: [], error: "Invalid session." }
  }

  const { data: session } = await context.supabase
    .from("school_academic_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("organization_id", context.organizationId)
    .maybeSingle()

  if (!session) {
    return { classes: [], error: "Session unavailable." }
  }

  const { data, error } = await context.supabase
    .from("school_classes")
    .select("id, name")
    .eq("organization_id", context.organizationId)
    .eq("session_id", sessionId)
    .order("name")

  if (error) {
    return {
      classes: [],
      error: "Unable to load destination classes.",
    }
  }

  return { classes: data ?? [] }
}

export async function submitDirectoryAction(
  _previous: DirectoryActionState,
  formData: FormData
): Promise<DirectoryActionState> {
  const context = await getStaffContext()

  if (!context) return fail("Please sign in.")

  const mode = String(formData.get("mode") ?? "") as Mode
  const scope = String(formData.get("scope") ?? "")
  const sourceClassId = String(
    formData.get("sourceClassId") ?? ""
  )
  const sourceSessionId = String(
    formData.get("sourceSessionId") ?? ""
  )
  const targetSessionId = String(
    formData.get("targetSessionId") ?? ""
  )
  const targetClassId = String(
    formData.get("targetClassId") ?? ""
  )
  const effectiveOn = String(
    formData.get("effectiveOn") ?? ""
  )

  if (
    !["promote", "transfer", "remove"].includes(mode) ||
    !UUID.test(sourceClassId) ||
    !UUID.test(sourceSessionId)
  ) {
    return fail("Invalid class operation.")
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveOn) ||
    !Number.isFinite(
      Date.parse(`${effectiveOn}T00:00:00Z`)
    ) ||
    new Date(`${effectiveOn}T00:00:00Z`)
      .toISOString()
      .slice(0, 10) !== effectiveOn
  ) {
    return fail("Choose a valid effective date.")
  }

  const { data: sourceClass } = await context.supabase
    .from("school_classes")
    .select("id, session_id")
    .eq("id", sourceClassId)
    .eq("session_id", sourceSessionId)
    .eq("organization_id", context.organizationId)
    .maybeSingle()

  if (!sourceClass) {
    return fail("Source class unavailable.")
  }

  let enrollmentIds: string[] = []

  if (scope === "class") {
    // Limit bulk operations to the database RPC limit.
    // Fetch an extra record to detect oversized classes.
    const result = await context.supabase
      .from("school_enrollments")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("session_id", sourceSessionId)
      .eq("class_id", sourceClassId)
      .eq("status", "active")
      .order("id")
      .range(0, 300)

    if (result.error) {
      return fail("Unable to read the class register.")
    }

    if ((result.data?.length ?? 0) > 300) {
      return fail(
        "This class exceeds 300 students. Select smaller batches."
      )
    }

    enrollmentIds = (result.data ?? []).map(e => e.id)
  } else {
    try {
      const parsed = JSON.parse(
        String(formData.get("enrollmentIds") ?? "[]")
      )

      if (
        !Array.isArray(parsed) ||
        parsed.length > 300 ||
        !parsed.every(
          id => typeof id === "string" && UUID.test(id)
        )
      ) {
        return fail("Invalid student selection.")
      }

      enrollmentIds = [...new Set(parsed)]
    } catch {
      return fail("Invalid student selection.")
    }
  }

  if (!enrollmentIds.length) {
    return fail("Select at least one student.")
  }

  // Read the selected active placements and verify
  // that all belong to the current source class.
  const { data: enrollments, error: lookupError } =
    await context.supabase
      .from("school_enrollments")
      .select("id, student_id")
      .eq("organization_id", context.organizationId)
      .eq("session_id", sourceSessionId)
      .eq("class_id", sourceClassId)
      .eq("status", "active")
      .in("id", enrollmentIds)

  if (
    lookupError ||
    !enrollments ||
    enrollments.length !== enrollmentIds.length
  ) {
    return fail(
      "Some placements have changed. Refresh and try again."
    )
  }

  if (mode !== "remove") {
    if (
      !UUID.test(targetSessionId) ||
      !UUID.test(targetClassId)
    ) {
      return fail("Choose a destination session and class.")
    }

    if (
      mode === "transfer" &&
      targetSessionId !== sourceSessionId
    ) {
      return fail(
        "Transfers must stay within one academic session."
      )
    }

    if (
      mode === "promote" &&
      targetSessionId === sourceSessionId
    ) {
      return fail(
        "Promotion requires a different academic session."
      )
    }

    if (
      mode === "transfer" &&
      targetClassId === sourceClassId
    ) {
      return fail("Choose a different class.")
    }

    const { data: destination } =
      await context.supabase
        .from("school_classes")
        .select("id")
        .eq("id", targetClassId)
        .eq("session_id", targetSessionId)
        .eq(
          "organization_id",
          context.organizationId
        )
        .maybeSingle()

    if (!destination) {
      return fail("Destination class unavailable.")
    }
  }

  let error: { code?: string; message: string } | null =
    null

  let count = 0

  if (mode === "transfer") {
    const result = await context.supabase.rpc(
      "bulk_transfer_school_enrollments",
      {
        p_source_class_id: sourceClassId,
        p_destination_class_id: targetClassId,
        p_enrollment_ids: enrollmentIds,
        p_effective_on: effectiveOn,
      }
    )

    error = result.error
    count = Number(
      result.data?.transferred_count ?? 0
    )
  }

  if (mode === "remove") {
    const result = await context.supabase.rpc(
      "school_directory_bulk_end_enrollments",
      {
        p_class_id: sourceClassId,
        p_enrollment_ids: enrollmentIds,
        p_effective_on: effectiveOn,
      }
    )

    error = result.error
    count = Number(
      result.data?.ended_count ?? 0
    )
  }

  if (mode === "promote") {
    const { data: school } = await context.supabase
      .from("organizations")
      .select("slug, type, status")
      .eq("id", context.organizationId)
      .maybeSingle()

    if (
      !school ||
      school.type !== "school" ||
      school.status !== "active"
    ) {
      return fail("School unavailable.")
    }

    const result = await context.supabase.rpc(
      "enroll_school_students",
      {
        p_organization_slug: school.slug,
        p_session_id: targetSessionId,
        p_class_id: targetClassId,
        p_student_ids:
          enrollments.map(e => e.student_id),
        p_enrolled_on: effectiveOn,
      }
    )

    error = result.error
    count = Number(
      result.data?.created_count ?? 0
    )
  }

  if (error) {
    console.error("[SCHOOL:DIRECTORY_ACTION]", {
      mode,
      error,
    })

    return fail(
      error.code === "42501"
        ? "You do not have permission to manage placements."
        : "The operation could not be completed. Check the date, destination and students."
    )
  }

  revalidatePath(PATH)
  revalidatePath("/school/enrollment")

  const verb = {
    promote: "promoted",
    transfer: "transferred",
    remove: "removed from the active class register",
  }[mode]

  return {
    ok: true,
    count,
    message: `${count} student(s) ${verb} successfully.`,
  }
}
