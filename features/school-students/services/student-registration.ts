
"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { SCHOOL_SLUG, urls } from "@/constants"

import {
  validateRegistrations,
  type RegistrationRow,
} from "./registration-fields"

export type RegistrationReceipt = {
  count: number
  students: {
    id: string
    first_name: string
    last_name: string
  }[]
}

export type RegistrationResult = {
  data: RegistrationReceipt | null
  error: string | null
}

export async function registerStudents(
  rows: RegistrationRow[]
): Promise<RegistrationResult> {
  if (rows.length < 1 || rows.length > 300) {
    return {
      data: null,
      error: "Select between 1 and 300 students.",
    }
  }

  const checked = validateRegistrations(rows)

  if (checked.issues.length) {
    const issue = checked.issues[0]

    return {
      data: null,
      error: `Row ${issue.row}: ${issue.message}`,
    }
  }

  const db = await createClient()

  const { data: auth, error: authError } =
    await db.auth.getUser()

  if (authError || !auth.user) {
    return {
      data: null,
      error: "Please sign in to continue.",
    }
  }

  const { data, error } = await db.rpc(
    "register_school_students",
    {
      p_organization_slug: SCHOOL_SLUG,
      p_rows: checked.rows,
    }
  )

  if (error) {
    return {
      data: null,
      error:
        error.code === "23505"
          ? "An admission number already exists. Check the records and try again."
          : error.message,
    }
  }

  const receipt = data as RegistrationReceipt

  revalidatePath(urls.students)

  return {
    data: receipt,
    error: null,
  }
}

export async function registerStudentFull(
  row: RegistrationRow
): Promise<RegistrationResult> {
  return registerStudents([row])
}
