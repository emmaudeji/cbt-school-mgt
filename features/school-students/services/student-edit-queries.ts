
import "server-only"

import { getStaffContext } from "@/services/auth"

import {
  EMPTY_REGISTRATION,
  type RegistrationRow,
} from "./registration-fields"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type StudentRegistrationEditData = {
  studentId: string
  studentName: string
  form: RegistrationRow
}

function value(input: string | null | undefined) {
  return input ?? ""
}

export async function getStudentRegistrationEditData(
  studentId: string
): Promise<StudentRegistrationEditData | null> {
 
  const context = await getStaffContext()
 
  if (!context) return null
  

  const db = context.supabase
  const orgId = context.organizationId

  const { data: student, error: studentError } =
    await db
      .from("school_students")
      .select(
        "id, first_name, last_name, other_names, admission_number"
      )
      .eq("id", studentId)
      .eq("organization_id", orgId)
      .maybeSingle()

  if (studentError || !student) return null

  const [detailsResult, linksResult] =
    await Promise.all([
      db
        .from("school_student_details")
        .select(
          "date_of_birth, gender, residential_address, previous_school_name, previous_school_address"
        )
        .eq("organization_id", orgId)
        .eq("student_id", studentId)
        .maybeSingle(),

      db
        .from("school_student_guardians")
        .select(
          "guardian_id, relationship"
        )
        .eq("organization_id", orgId)
        .eq("student_id", studentId)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle(),
    ])

  if (detailsResult.error || linksResult.error) {
    console.error("[STUDENT:EDIT_LOAD]", {
      details: detailsResult.error,
      guardian: linksResult.error,
    })
    return null
  }

  let guardian: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    alternate_phone: string | null
    email: string | null
    occupation: string | null
    address: string | null
  } | null = null

  if (linksResult.data?.guardian_id) {
    const result = await db
      .from("school_guardians")
      .select(
        "first_name, last_name, phone, alternate_phone, email, occupation, address"
      )
      .eq("organization_id", orgId)
      .eq("id", linksResult.data.guardian_id)
      .maybeSingle()

    if (result.error) {
      console.error(
        "[STUDENT:EDIT_GUARDIAN]",
        result.error
      )
      return null
    }

    guardian = result.data
  }

  const details = detailsResult.data

  const form: RegistrationRow = {
    ...EMPTY_REGISTRATION,

    first_name: value(student.first_name),
    last_name: value(student.last_name),
    other_names: value(student.other_names),

    admission_number: value(
      student.admission_number
    ),

    date_of_birth: value(
      details?.date_of_birth
    ),

    gender: value(details?.gender),

    residential_address: value(
      details?.residential_address
    ),

    previous_school_name: value(
      details?.previous_school_name
    ),

    previous_school_address: value(
      details?.previous_school_address
    ),

    guardian_first_name: value(
      guardian?.first_name
    ),

    guardian_last_name: value(
      guardian?.last_name
    ),

    guardian_relationship: value(
      linksResult.data?.relationship
    ),

    guardian_phone: value(
      guardian?.phone
    ),

    guardian_alternate_phone: value(
      guardian?.alternate_phone
    ),

    guardian_email: value(
      guardian?.email
    ),

    guardian_occupation: value(
      guardian?.occupation
    ),

    guardian_address: value(
      guardian?.address
    ),
  }

  return {
    studentId: student.id,
    studentName: [
      student.last_name,
      student.first_name,
      student.other_names,
    ].filter(Boolean).join(" "),
    form,
  }
}
