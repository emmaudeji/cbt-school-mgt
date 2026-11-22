
import "server-only"

import { getStaffContext } from "@/services/auth"

import {
  getAcademicSetupData,
} from "@/features/school-academic-setup/services/queries"

export type StudentAccountRow = {
  student_id: string
  first_name: string
  last_name: string
  admission_number: string | null
  class_name: string | null
  membership_id: string | null
  account_email: string | null
  account_status:
    | "invited"
    | "active"
    | "suspended"
    | null
  total_count: number
}

export type StudentAccountData = {
  rows: StudentAccountRow[]
  total: number
  page: number

  schoolName: string

  sessions: {
    id: string
    name: string
    is_current: boolean
  }[]

  classes: {
    id: string
    name: string
  }[]

  sessionId: string
  classId: string
  search: string

  error: string | null
}

type Filters = {
  session?: string
  class?: string
  search?: string
  page?: string
}

function safePage(value?: string): number {
  const parsed = Number(value ?? 1)

  return Number.isSafeInteger(parsed) &&
    parsed >= 1 &&
    parsed <= 100000
    ? parsed
    : 1
}

export async function getStudentAccountData(
  filters: Filters
): Promise<StudentAccountData | null> {
  const context = await getStaffContext()

  if (!context) {
    return null
  }

  const academic = await getAcademicSetupData()

  if (!academic) {
    return null
  }

  const organizationId = context.organizationId

  const sessions = academic.sessions.map(
    (session) => ({
      id: session.id,
      name: session.name,
      is_current: session.is_current,
    })
  )

  const sessionId = sessions.some(
    (session) => session.id === filters.session
  )
    ? filters.session!
    : "all"

  // Load classes only for the selected session.
  const classesResult =
    sessionId === "all"
      ? {
          data: [] as {
            id: string
            name: string
          }[],
          error: null,
        }
      : await context.supabase
          .from("school_classes")
          .select("id, name")
          .eq("organization_id", organizationId)
          .eq("session_id", sessionId)
          .order("name")

  if (classesResult.error) {
    console.error(
      "[STUDENT:ACCOUNT_CLASSES]",
      classesResult.error
    )

    return null
  }

  const classes = classesResult.data ?? []

  const classId = classes.some(
    (item) => item.id === filters.class
  )
    ? filters.class!
    : "all"

  const page = safePage(filters.page)

  const search = (filters.search ?? "")
    .trim()
    .slice(0, 100)

  // IMPORTANT:
  // p_organization_id is required by the SQL function.
  const { data, error } = await context.supabase.rpc(
    "school_list_student_accounts_for_org",
    {
      p_organization_id: organizationId,

      p_session_id:
        sessionId === "all"
          ? null
          : sessionId,

      p_class_id:
        classId === "all"
          ? null
          : classId,

      p_search: search,
      p_page: page,
    }
  )

  if (error) {
    console.error(
      "[STUDENT:ACCOUNT_LIST]",
      error
    )
  }

  const rows: StudentAccountRow[] =
    (data ?? []) as StudentAccountRow[]

  return {
    rows,
    total: Number(
      rows[0]?.total_count ?? 0
    ),
    page,

    schoolName: academic.school.name,

    sessions,
    classes,

    sessionId,
    classId,
    search,

    error: error
      ? "Unable to load student accounts. Check your school membership permissions."
      : null,
  }
}
