
"use server"

import { revalidatePath } from "next/cache"

import { getStaffContext } from "@/services/auth"

import type {
  RegistrationRow,
} from "./registration-fields"

type UpdateStudentResult = {
  ok: boolean
  message: string
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function updateStudentAdmission(
  studentId: string,
  form: RegistrationRow
): Promise<UpdateStudentResult> {
  const context = await getStaffContext()

  if (!context) {
    return {
      ok: false,
      message: "Please sign in to continue.",
    }
  }

  if (!UUID.test(studentId)) {
    return {
      ok: false,
      message: "Invalid student record.",
    }
  }

  const fields = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      typeof value === "string"
        ? value.trim()
        : "",
    ])
  ) as Record<string, string>

  if (
    !fields.first_name ||
    !fields.last_name
  ) {
    return {
      ok: false,
      message:
        "First name and surname are required.",
    }
  }

  if (
    fields.guardian_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      fields.guardian_email
    )
  ) {
    return {
      ok: false,
      message:
        "Enter a valid guardian email address.",
    }
  }

  const { data, error } =
    await context.supabase.rpc(
      "school_update_student_admission",
      {
        p_student_id: studentId,
        p_fields: fields,
      }
    )

  if (error) {
    console.error(
      "[SCHOOL:UPDATE_STUDENT]",
      error
    )

    const message =
      error.code === "23505"
        ? "This admission number is already assigned to another student."
        : error.code === "42501"
          ? "You do not have permission to edit this student."
          : error.message

    return {
      ok: false,
      message,
    }
  }

  if (!data?.ok) {
    return {
      ok: false,
      message:
        "Student admission details were not updated.",
    }
  }

  revalidatePath("/school/students")
  revalidatePath(
    `/school/students/${studentId}`
  )
  revalidatePath(
    "/school/students/register"
  )

  return {
    ok: true,
    message:
      "Student admission details updated successfully.",
  }
}
