
import "server-only"

import { redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { urls } from "@/constants"

import { getAcademicSetupData } from
  "@/features/school-academic-setup/services/queries"

export type DirectorySession = {
  id: string
  name: string
  is_current: boolean
  starts_on?: string | null
  ends_on?: string | null
}

export type DirectoryClass = {
  id: string
  name: string
  session_id: string
}

export type DirectoryTerm = {
  id: string
  name: string
  position: number
  is_current: boolean
}

export type DirectoryStudent = {
  enrollment_id: string
  student_id: string
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  student_status: string
  enrollment_status: string
  enrolled_on: string
  left_on: string | null
  total_count: number
}

export type StudentDirectoryData = {
  schoolName: string
  sessions: DirectorySession[]
  classes: DirectoryClass[]
  terms: DirectoryTerm[]
  students: DirectoryStudent[]
  sessionId: string
  classId: string
  termId: string
  search: string
  page: number
  total: number
  error: string | null
}

export type DirectoryFilters = {
  session?: string
  class?: string
  term?: string
  search?: string
  page?: string
}

function safePage(value?: string) {
  const page = Number(value ?? 1)
  return Number.isSafeInteger(page) &&
    page >= 1 &&
    page <= 100000
    ? page
    : 1
}

export async function getStudentDirectoryData(
  filters: DirectoryFilters
): Promise<StudentDirectoryData | null> {
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const academic = await getAcademicSetupData()
  if (!academic) return null

  const orgId = context.organizationId

  const sessions = academic.sessions.map(
    (session) => ({
      id: session.id,
      name: session.name,
      is_current: session.is_current,
    })
  )

  const selectedSession =
    sessions.find(s => s.id === filters.session) ??
    sessions.find(s => s.is_current) ??
    sessions[0]

  const sessionId = selectedSession?.id ?? ""

  // Only fetch classes from the expanded session.
  const classResult = sessionId
    ? await context.supabase
        .from("school_classes")
        .select("id, name, session_id")
        .eq("organization_id", orgId)
        .eq("session_id", sessionId)
        .order("name")
    : {
        data: [] as DirectoryClass[],
        error: null,
      }

  if (classResult.error) {
    console.error(
      "[SCHOOL:DIRECTORY_CLASSES]",
      classResult.error
    )
    return null
  }

  const classes = classResult.data ?? []

  const selectedClass =
    classes.find(c => c.id === filters.class) ??
    classes[0]

  const classId = selectedClass?.id ?? ""

  const terms = academic.terms
    .filter(t => t.session_id === sessionId)
    .sort((a, b) => a.position - b.position)
    .map(t => ({
      id: t.id,
      name: t.name,
      position: t.position,
      is_current: t.is_current,
    }))

  const selectedTerm =
    terms.find(t => t.id === filters.term) ??
    terms.find(t => t.is_current) ??
    terms[0]

  const termId = selectedTerm?.id ?? ""

  const search = (filters.search ?? "")
    .trim()
    .slice(0, 100)

  const page = safePage(filters.page)

  let students: DirectoryStudent[] = []
  let total = 0
  let error: string | null = null

  if (classId) {
    const result = await context.supabase.rpc(
      "get_school_class_roster",
      {
        p_class_id: classId,
        p_search: search,
        p_status: "active",
        p_page: page,
        p_page_size: 100,
      }
    )

    if (result.error) {
      console.error(
        "[SCHOOL:DIRECTORY_ROSTER]",
        result.error
      )
      error = "Unable to load the class register."
    } else {
      students = result.data ?? []
      total = Number(
        students[0]?.total_count ?? 0
      )
    }
  }

  return {
    schoolName: academic.school.name,
    sessions,
    classes,
    terms,
    students,
    sessionId,
    classId,
    termId,
    search,
    page,
    total,
    error,
  }
}
