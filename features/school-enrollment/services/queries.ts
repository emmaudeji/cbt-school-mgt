
import "server-only"

import { redirect } from "next/navigation"

import { getStaffContext } from "@/services/auth"
import { urls } from "@/constants"

import {
  getAcademicSetupData,
} from "@/features/school-academic-setup/services/queries"

export type EnrollmentClass = {
  id: string
  name: string
  session_id: string
}

export type ClassRosterStudent = {
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

export type EnrollmentCandidate = {
  student_id: string
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  total_count: number
}

export type EnrollmentSession = {
  id: string
  name: string
  is_current: boolean
}

export type EnrollmentWorkspaceData = {
  schoolName: string
  schoolSlug: string
  sessions: EnrollmentSession[]
  classes: EnrollmentClass[]
  sourceClasses: EnrollmentClass[]

  roster: ClassRosterStudent[]
  candidates: EnrollmentCandidate[]

  rosterTotal: number
  candidatesTotal: number

  sessionId: string
  classId: string

  sourceSessionId: string
  sourceClassId: string

  rosterSearch: string
  candidateSearch: string

  page: number
  candidatePage: number

  error: string | null
}

export type EnrollmentFilters = {
  session?: string
  class?: string

  sourceSession?: string
  sourceClass?: string

  rosterSearch?: string
  candidateSearch?: string
  search?: string

  page?: string
  candidatePage?: string
}

function safePage(value?: string): number {
  const page = Number(value ?? 1)

  return Number.isSafeInteger(page) &&
    page >= 1 &&
    page <= 100000
    ? page
    : 1
}

export async function getEnrollmentWorkspaceData(
  filters: EnrollmentFilters
): Promise<EnrollmentWorkspaceData | null> {
  const context = await getStaffContext()

  if (!context) {
    redirect(urls.login)
  }

  const academic = await getAcademicSetupData()

  if (!academic) {
    return null
  }

  const orgId = context.organizationId

  const sessions: EnrollmentSession[] =
    academic.sessions.map(
      ({ id, name, is_current }) => ({
        id,
        name,
        is_current,
      })
    )

  // Destination academic session.
  const selectedSession =
    sessions.find(
      (item) => item.id === filters.session
    ) ??
    sessions.find(
      (item) => item.is_current
    ) ??
    sessions[0]

  const sessionId = selectedSession?.id ?? ""

  // Source session is independent of destination.
  // "all" includes newly registered students.
  const sourceSessionId =
    sessions.some(
      (item) => item.id === filters.sourceSession
    )
      ? filters.sourceSession!
      : "all"

  // Load destination classes and source classes
  // ONLY for their selected sessions.
  const [
    destinationClassesResult,
    sourceClassesResult,
  ] = await Promise.all([
    sessionId
      ? context.supabase
          .from("school_classes")
          .select("id, name, session_id")
          .eq("organization_id", orgId)
          .eq("session_id", sessionId)
          .order("name")
      : Promise.resolve({
          data: [] as EnrollmentClass[],
          error: null,
        }),

    sourceSessionId !== "all"
      ? context.supabase
          .from("school_classes")
          .select("id, name, session_id")
          .eq("organization_id", orgId)
          .eq("session_id", sourceSessionId)
          .order("name")
      : Promise.resolve({
          data: [] as EnrollmentClass[],
          error: null,
        }),
  ])

  if (
    destinationClassesResult.error ||
    sourceClassesResult.error
  ) {
    console.error(
      "[SCHOOL:ENROLLMENT_CLASSES]",
      {
        destination:
          destinationClassesResult.error,
        source: sourceClassesResult.error,
      }
    )

    return null
  }

  const classes: EnrollmentClass[] =
    destinationClassesResult.data ?? []

  const sourceClasses: EnrollmentClass[] =
    sourceClassesResult.data ?? []

  // Destination class.
  const selectedClass =
    classes.find(
      (item) => item.id === filters.class
    ) ??
    classes[0]

  const classId = selectedClass?.id ?? ""

  // Source class must belong to source session.
  const sourceClassId =
    sourceClasses.some(
      (item) => item.id === filters.sourceClass
    )
      ? filters.sourceClass!
      : "all"

  const rosterSearch = (
    filters.rosterSearch ?? ""
  )
    .trim()
    .slice(0, 100)

  const candidateSearch = (
    filters.candidateSearch ??
    filters.search ??
    ""
  )
    .trim()
    .slice(0, 100)

  const page = safePage(filters.page)
  const candidatePage = safePage(
    filters.candidatePage
  )

  let roster: ClassRosterStudent[] = []
  let candidates: EnrollmentCandidate[] = []

  let rosterTotal = 0
  let candidatesTotal = 0

  let error: string | null = null

  if (sessionId && classId) {
    const [
      rosterResult,
      candidateResult,
    ] = await Promise.all([
      context.supabase.rpc(
        "get_school_class_roster",
        {
          p_class_id: classId,
          p_search: rosterSearch,
          p_status: "active",
          p_page: page,
          p_page_size: 20,
        }
      ),

      context.supabase.rpc(
        "school_enrollment_candidates_by_source",
        {
          p_organization_slug:
            academic.school.slug,

          p_session_id: sessionId,

          p_source_session_id:
            sourceSessionId === "all"
              ? null
              : sourceSessionId,

          p_source_class_id:
            sourceClassId === "all"
              ? null
              : sourceClassId,

          p_search: candidateSearch,
          p_page: candidatePage,
        }
      ),
    ])

    if (rosterResult.error) {
      console.error(
        "[SCHOOL:CLASS_ROSTER]",
        rosterResult.error
      )

      error =
        "Unable to load the class register."
    } else {
      roster = rosterResult.data ?? []

      rosterTotal = Number(
        roster[0]?.total_count ?? 0
      )
    }

    if (candidateResult.error) {
      console.error(
        "[SCHOOL:ENROLLMENT_CANDIDATES]",
        candidateResult.error
      )

      error = [
        error,
        "Unable to load available students.",
      ]
        .filter(Boolean)
        .join(" ")
    } else {
      candidates =
        candidateResult.data ?? []

      candidatesTotal = Number(
        candidates[0]?.total_count ?? 0
      )
    }
  }

  return {
    schoolName: academic.school.name,
    schoolSlug: academic.school.slug,

    sessions,
    classes,
    sourceClasses,

    roster,
    candidates,

    rosterTotal,
    candidatesTotal,

    sessionId,
    classId,

    sourceSessionId,
    sourceClassId,

    rosterSearch,
    candidateSearch,

    page,
    candidatePage,

    error,
  }
}
