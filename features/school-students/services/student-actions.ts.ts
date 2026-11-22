
"use server"

import { revalidatePath } from "next/cache"

import { SCHOOL_SLUG, tables, urls } from "@/constants"
import { createClient } from "@/utils/supabase/server"

// import type {

// } from "@/types/students"

import { logActivity } from "@/services/logging.service"
import { insertData, updateData } from "@/services"
import {   
  SchoolStudent,
  StudentInput,
  StudentDetails,
  StudentDetailsInput,
  SchoolGuardian,
  GuardianInput,
  GuardianLinkInput,
  StudentGuardianLink,
  StudentServiceResult, } from "@/types/students"

type Result<T> = StudentServiceResult<T>

function success<T>(
  data: T,
  message: string
): Result<T> {
  return {
    data,
    error: null,
    successMessage: message,
  }
}

function failure<T>(message: string): Result<T> {
  return {
    data: null,
    error: message,
    successMessage: null,
  }
}

function messageOf(error: unknown): string {
  if (typeof error === "string") return error

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(error.message)
  }

  return "An unexpected error occurred."
}

function nullable(value?: string | null): string | null {
  return value?.trim() || null
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function schoolId(): Promise<string> {
  const db = await createClient()

  const { data: auth } = await db.auth.getUser()

  if (!auth.user) {
    throw new Error("Please sign in to continue.")
  }

  const { data, error } = await db
    .from(tables.organizations)
    .select("id")
    .eq("slug", SCHOOL_SLUG)
    .eq("type", "school")
    .eq("status", "active")
    .single()

  if (error || !data) {
    throw new Error(
      error?.message ?? "School not found."
    )
  }

  return data.id
}

async function audit(
  action: "create" | "update",
  description: string,
  entityType: string,
  entityId: string
) {
  try {
    await logActivity({
      action,
      description,
      entityType,
      entityId,
    })
  } catch (error) {
    console.error("[STUDENT ACTIVITY LOG]", error)
  }
}

function refreshStudent(studentId?: string) {
  revalidatePath(urls.students)

  if (studentId) {
    revalidatePath(urls.studentDetails(studentId))
  }
}

// ------------------------------------------------------------
// REGISTER STUDENT
// ------------------------------------------------------------

export async function createStudent(
  input: StudentInput
): Promise<Result<SchoolStudent>> {
  try {
    const organizationId = await schoolId()

    const firstName = input.first_name.trim()
    const lastName = input.last_name.trim()

    if (!firstName || !lastName) {
      return failure(
        "Student first name and last name are required."
      )
    }

    const result = await insertData<SchoolStudent>(
      tables.school_students,
      {
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        other_names: nullable(input.other_names),
        admission_number: nullable(input.admission_number),
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to register student."
        )
      )
    }

    const student = result.data

    await audit(
      "create",
      `Registered student ${firstName} ${lastName}`,
      "school_student",
      student.id
    )

    refreshStudent(student.id)

    return success(
      student,
      "Student registered successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// UPDATE STUDENT IDENTITY
// ------------------------------------------------------------

export async function updateStudent(
  studentId: string,
  input: StudentInput
): Promise<Result<SchoolStudent>> {
  try {
    if (!isUuid(studentId)) {
      return failure("Invalid student ID.")
    }

    const organizationId = await schoolId()

    const firstName = input.first_name.trim()
    const lastName = input.last_name.trim()

    if (!firstName || !lastName) {
      return failure(
        "Student first name and last name are required."
      )
    }

    const result = await updateData<SchoolStudent>(
      tables.school_students,
      {
        id: studentId,
        organization_id: organizationId,
      },
      {
        first_name: firstName,
        last_name: lastName,
        other_names: nullable(input.other_names),
        admission_number: nullable(input.admission_number),
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(result.error ?? "Unable to update student.")
      )
    }

    await audit(
      "update",
      `Updated student ${firstName} ${lastName}`,
      "school_student",
      studentId
    )

    refreshStudent(studentId)

    return success(
      result.data,
      "Student updated successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// SAVE PRIVATE STUDENT DETAILS
// ------------------------------------------------------------
// Create details on first save; update on later saves.
// No direct service-role bypass. RLS applies throughout.

export async function saveStudentDetails(
  studentId: string,
  input: StudentDetailsInput
): Promise<Result<StudentDetails>> {
  try {
    if (!isUuid(studentId)) {
      return failure("Invalid student ID.")
    }

    const organizationId = await schoolId()
    const db = await createClient()

    const { data: student, error: studentError } =
      await db
        .from(tables.school_students)
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", studentId)
        .maybeSingle()

    if (studentError || !student) {
      return failure(
        studentError?.message ?? "Student not found."
      )
    }

    const values = {
      date_of_birth: nullable(input.date_of_birth),
      gender: input.gender ?? null,
      photo_path: nullable(input.photo_path),
      residential_address: nullable(
        input.residential_address
      ),
      previous_school_name: nullable(
        input.previous_school_name
      ),
      previous_school_address: nullable(
        input.previous_school_address
      ),
    }

    const { data: existing, error: lookupError } =
      await db
        .from(tables.school_student_details)
        .select("student_id")
        .eq("organization_id", organizationId)
        .eq("student_id", studentId)
        .maybeSingle()

    if (lookupError) {
      return failure(lookupError.message)
    }

    const result = existing
      ? await updateData<StudentDetails>(
          tables.school_student_details,
          {
            organization_id: organizationId,
            student_id: studentId,
          },
          values
        )
      : await insertData<StudentDetails>(
          tables.school_student_details,
          {
            organization_id: organizationId,
            student_id: studentId,
            ...values,
          }
        )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to save student details."
        )
      )
    }

    await audit(
      existing ? "update" : "create",
      "Saved private student profile details",
      "school_student",
      studentId
    )

    refreshStudent(studentId)

    return success(
      result.data,
      "Student details saved successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// CREATE GUARDIAN
// ------------------------------------------------------------

export async function createGuardian(
  input: GuardianInput
): Promise<Result<SchoolGuardian>> {
  try {
    const organizationId = await schoolId()

    const firstName = input.first_name.trim()
    const lastName = input.last_name.trim()

    if (!firstName || !lastName) {
      return failure(
        "Guardian first name and last name are required."
      )
    }

    const result = await insertData<SchoolGuardian>(
      tables.school_guardians,
      {
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        other_names: nullable(input.other_names),
        phone: nullable(input.phone),
        alternate_phone: nullable(input.alternate_phone),
        email: nullable(input.email)?.toLowerCase() ?? null,
        residential_address: nullable(
          input.residential_address
        ),
        occupation: nullable(input.occupation),
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to create guardian."
        )
      )
    }

    await audit(
      "create",
      `Created guardian ${firstName} ${lastName}`,
      "school_guardian",
      result.data.id
    )

    return success(
      result.data,
      "Guardian created successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// UPDATE GUARDIAN
// ------------------------------------------------------------

export async function updateGuardian(
  guardianId: string,
  input: GuardianInput
): Promise<Result<SchoolGuardian>> {
  try {
    if (!isUuid(guardianId)) {
      return failure("Invalid guardian ID.")
    }

    const organizationId = await schoolId()

    const firstName = input.first_name.trim()
    const lastName = input.last_name.trim()

    if (!firstName || !lastName) {
      return failure(
        "Guardian first name and last name are required."
      )
    }

    const result = await updateData<SchoolGuardian>(
      tables.school_guardians,
      {
        id: guardianId,
        organization_id: organizationId,
      },
      {
        first_name: firstName,
        last_name: lastName,
        other_names: nullable(input.other_names),
        phone: nullable(input.phone),
        alternate_phone: nullable(input.alternate_phone),
        email: nullable(input.email)?.toLowerCase() ?? null,
        residential_address: nullable(
          input.residential_address
        ),
        occupation: nullable(input.occupation),
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to update guardian."
        )
      )
    }

    await audit(
      "update",
      `Updated guardian ${firstName} ${lastName}`,
      "school_guardian",
      guardianId
    )

    return success(
      result.data,
      "Guardian updated successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// LINK AN EXISTING GUARDIAN TO A STUDENT
// ------------------------------------------------------------
// Use the same guardian for multiple siblings.
// New links start as non-primary; primary assignment
// is handled separately and transactionally.

export async function linkStudentGuardian(
  input: GuardianLinkInput
): Promise<Result<StudentGuardianLink>> {
  try {
    const {
      student_id,
      guardian_id,
      relationship,
    } = input

    if (
      !isUuid(student_id) ||
      !isUuid(guardian_id)
    ) {
      return failure("Invalid student or guardian ID.")
    }

    if (!relationship.trim()) {
      return failure("Guardian relationship is required.")
    }

    const organizationId = await schoolId()

    const result = await insertData<StudentGuardianLink>(
      tables.school_student_guardians,
      {
        organization_id: organizationId,
        student_id,
        guardian_id,
        relationship: relationship.trim(),
        is_primary: false,
        is_emergency_contact:
          input.is_emergency_contact ?? false,
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to link guardian."
        )
      )
    }

    await audit(
      "create",
      "Linked guardian to student",
      "school_student_guardian",
      result.data.id
    )

    refreshStudent(student_id)

    return success(
      result.data,
      "Guardian linked successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}

// ------------------------------------------------------------
// UPDATE STUDENT-GUARDIAN RELATIONSHIP
// ------------------------------------------------------------

export async function updateStudentGuardian(
  linkId: string,
  input: {
    relationship: string
    is_emergency_contact: boolean
  }
): Promise<Result<StudentGuardianLink>> {
  try {
    if (!isUuid(linkId)) {
      return failure("Invalid guardian relationship ID.")
    }

    if (!input.relationship.trim()) {
      return failure("Guardian relationship is required.")
    }

    const organizationId = await schoolId()

    const result = await updateData<StudentGuardianLink>(
      tables.school_student_guardians,
      {
        id: linkId,
        organization_id: organizationId,
      },
      {
        relationship: input.relationship.trim(),
        is_emergency_contact:
          input.is_emergency_contact,
      }
    )

    if (result.error || !result.data) {
      return failure(
        messageOf(
          result.error ?? "Unable to update relationship."
        )
      )
    }

    await audit(
      "update",
      "Updated student guardian relationship",
      "school_student_guardian",
      linkId
    )

    refreshStudent(result.data.student_id)

    return success(
      result.data,
      "Guardian relationship updated."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}



export async function setPrimaryStudentGuardian(
  linkId: string
): Promise<Result<{ student_id: string }>> {
  try {
    if (!isUuid(linkId)) {
      return failure("Invalid guardian relationship ID.")
    }

    const db = await createClient()

    const { data: studentId, error } = await db.rpc(
      "set_primary_school_guardian",
      {
        p_link_id: linkId,
      }
    )

    if (error || !studentId) {
      return failure(
        error?.message ?? "Unable to set primary guardian."
      )
    }

    await audit(
      "update",
      "Changed student's primary guardian",
      "school_student_guardian",
      linkId
    )

    refreshStudent(studentId)

    return success(
      { student_id: studentId },
      "Primary guardian updated successfully."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}


export type GuardianSearchItem = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
}

export async function findGuardians(
  search: string
): Promise<Result<GuardianSearchItem[]>> {
  try {
    const query = search
      .trim()
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .slice(0, 80)

    if (query.length < 2) {
      return failure(
        "Enter at least two characters to search."
      )
    }

    const organizationId = await schoolId()
    const db = await createClient()

    const pattern = `%${query}%`

    const { data, error } = await db
      .from(tables.school_guardians)
      .select("id, first_name, last_name, phone")
      .eq("organization_id", organizationId)
      .or(
        [
          `first_name.ilike.${pattern}`,
          `last_name.ilike.${pattern}`,
          `phone.ilike.${pattern}`,
        ].join(",")
      )
      .order("last_name")
      .limit(10)

    if (error) return failure(error.message)

    return success(
      data ?? [],
      "Guardian search completed."
    )
  } catch (error) {
    return failure(messageOf(error))
  }
}
