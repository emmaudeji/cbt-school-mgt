
"use server"

import { randomInt } from "node:crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

import { schoolDomain, urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

type Credential = {
  studentId: string
  name: string
  admissionNumber: string | null
  login: string
  password: string
}

type AccountResult = {
  ok: boolean
  message: string
  credentials: Credential[]
  failures: string[]
}

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string | null
  membership_id: string | null
  status: string
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"

const PATH = urls.studentAccounts // "/school/student-accounts"

function password8() {
  return Array.from(
    { length: 8 },
    () => ALPHABET[randomInt(ALPHABET.length)]
  ).join("")
}

function loginPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

function failure(message: string): AccountResult {
  return {
    ok: false,
    message,
    credentials: [],
    failures: [],
  }
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error("Supabase Admin client not configured")
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function managedContext() {
  const context = await getStaffContext()
  if (!context) return null

  const { data: allowed, error } =
    await context.supabase.rpc(
      "school_can_manage_student_accounts",
      {
        p_organization_id: context.organizationId,
      }
    )

    // console.log(allowed, error)
  if (error || allowed !== true) return null

  return context
}

async function getStudent(
  context: NonNullable<
    Awaited<ReturnType<typeof managedContext>>
  >,
  studentId: string
): Promise<Student | null> {
  const { data, error } = await context.supabase
    .from("school_students")
    .select(
      "id, first_name, last_name, admission_number, membership_id, status"
    )
    .eq("organization_id", context.organizationId)
    .eq("id", studentId)
    .maybeSingle()

  return error ? null : data
}

async function getLinkedManagedUser(
  context: NonNullable<
    Awaited<ReturnType<typeof managedContext>>
  >,
  studentId: string
) {
  const student = await getStudent(context, studentId)

  if (!student?.membership_id) return null

  const { data: membership, error } =
    await context.supabase
      .from("organization_memberships")
      .select("id, user_id, status")
      .eq("organization_id", context.organizationId)
      .eq("id", student.membership_id)
      .maybeSingle()

  if (error || !membership?.user_id) return null

  const admin = adminClient()

  const { data: auth, error: authError } =
    await admin.auth.admin.getUserById(
      membership.user_id
    )

  if (authError || !auth.user) return null

  const metadata = auth.user.app_metadata ?? {}

  // School staff must never reset an unrelated
  // user's password or another school's account.
  if (
    metadata.school_managed_org_id !==
      context.organizationId ||
    metadata.school_student_id !== studentId
  ) {
    return null
  }

  return {
    student,
    membership,
    user: auth.user,
    admin,
  }
}

export async function createStudentAccounts(
  studentIds: string[]
): Promise<AccountResult> {
  const context = await managedContext()

  if (!context) {
    return failure("You do not have permission to manage accounts.")
  }
  

  if (
    !Array.isArray(studentIds) ||
    studentIds.length < 1 ||
    studentIds.length > 50
  ) {
    return failure("Select between 1 and 50 valid students.")
  }

  const domain = schoolDomain
    .trim()
    .toLowerCase()
    .replace(/^@/, "")

  if (
    !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)
  ) {
    return failure("The school login domain is invalid.")
  }

  const admin = adminClient()
  const credentials: Credential[] = []
  const failures: string[] = []

  // One operation per student allows partial success
  // without stopping every other account.
  for (const id of [...new Set(studentIds)]) {
    const student = await getStudent(context, id)

    if (
      !student ||
      student.status !== "active" ||
      student.membership_id
    ) {
      failures.push(
        `${id}: Student unavailable, inactive or already linked.`
      )
      continue
    }

    const name =
      `${student.first_name} ${student.last_name}`

    const base =
      `${loginPart(student.first_name)}.` +
      `${loginPart(student.last_name)}`

    if (
      !loginPart(student.first_name) ||
      !loginPart(student.last_name)
    ) {
      failures.push(
        `${name}: Name cannot form a valid login.`
      )
      continue
    }

    let accountCreated = false

    // Resolve identical names without listing
    // users or querying another school's records.
    for (let suffix = 1; suffix <= 20; suffix++) {
      const localPart =
        suffix === 1 ? base : `${base}${suffix}`

      const login = `${localPart}@${domain}`
      const password = password8()

      const { data: created, error: authError } =
        await admin.auth.admin.createUser({
          email: login,
          password,
          email_confirm: true,
          app_metadata: {
            school_managed_org_id: context.organizationId,
            school_student_id: student.id,
          },
          user_metadata: {
            role:"student",
            first_name: student.first_name,
            last_name: student.last_name,
            school_managed_org_id:
              context.organizationId,
            school_student_id: student.id,
          },
        })

        console.log({created, authError})

      if (authError) {
        const duplicate =
          authError.code === "email_exists" ||
          authError.code === "email_address_invalid" &&
            false ||
          /already (registered|exists|in use)/i.test(
            authError.message
          )

        if (duplicate) continue

        failures.push(
          `${name}: Account creation failed.`
        )
        break
      }

      if (!created.user) {
        failures.push(
          `${name}: Auth did not return a user.`
        )
        break
      }

      const { data: linked, error: linkError } =
        await context.supabase.rpc(
          "school_link_managed_student",
          {
            p_student_id: student.id,
            p_user_id: created.user.id,
          }
        )

      if (linkError || !linked?.ok) {
        // Avoid automatically deleting an Auth user
        // after an ambiguous database failure:
        // the link may have committed.
        console.error(
          "[SCHOOL:LINK_MANAGED_ACCOUNT]",
          {
            studentId: student.id,
            error: linkError,
          }
        )

        failures.push(
          `${name}: Auth user created, but membership linking requires administrator reconciliation.`
        )
        break
      }

      credentials.push({
        studentId: student.id,
        name,
        admissionNumber:
          student.admission_number,
        login,
        password,
      })

      accountCreated = true
      break
    }

    if (
      !accountCreated &&
      !failures.some(
        (entry) => entry.startsWith(`${name}:`)
      )
    ) {
      failures.push(
        `${name}: No available login found.`
      )
    }
  }

  revalidatePath(PATH)
  revalidatePath(urls.students) // "/school/students"

  return {
    ok: credentials.length > 0,
    message:
      `${credentials.length} account(s) created.` +
      (failures.length
        ? ` ${failures.length} could not be completed.`
        : ""),
    credentials,
    failures,
  }
}

export async function resetStudentPassword(
  studentId: string
): Promise<AccountResult> {
  const context = await managedContext()

  if (!context ) {
    return failure("Permission denied.")
  }

  const linked = await getLinkedManagedUser(
    context,
    studentId
  )

  if (!linked) {
    return failure(
      "This account is not managed by the selected school."
    )
  }

  const password = password8()

  const { error } =
    await linked.admin.auth.admin.updateUserById(
      linked.user.id,
      { password }
    )

  if (error) {
    console.error("[SCHOOL:RESET_STUDENT_PASSWORD]", error.code)
    return failure("Password reset failed.")
  }

  return {
    ok: true,
    message: "New password generated. Copy it now.",
    credentials: [{
      studentId,
      name:
        `${linked.student.first_name} ` +
        linked.student.last_name,
      admissionNumber:
        linked.student.admission_number,
      login: linked.user.email ?? "",
      password,
    }],
    failures: [],
  }
}

export async function changeStudentAccountStatus(
  studentId: string,
  status: "active" | "suspended"
): Promise<AccountResult> {
  const context = await managedContext()

  if (
    !context ||
    !["active", "suspended"].includes(status)
  ) {
    return failure("Invalid account operation.")
  }

  const linked = await getLinkedManagedUser(
    context,
    studentId
  )

  if (!linked) {
    return failure(
      "This account is not managed by the selected school."
    )
  }

  const { error } = await context.supabase.rpc(
    "school_set_student_account_status",
    {
      p_student_id: studentId,
      p_status: status,
    }
  )

  if (error) {
    console.error("[SCHOOL:ACCOUNT_STATUS]", error)
    return failure("Unable to change account status.")
  }

  revalidatePath(PATH)

  return {
    ok: true,
    message:
      status === "suspended"
        ? "School access revoked."
        : "School access restored.",
    credentials: [],
    failures: [],
  }
}
