
import "server-only"

import { createClient } from "@/utils/supabase/server"
import {
  ORGANIZATION_ID,
  SCHOOL_SLUG,
  tables,
} from "@/constants"
import { SchoolGuardian,
  SchoolStudent,
  StudentDetails,
  StudentGuardianLink,
  StudentEnrollmentHistory,
  StudentReportCard,
  StudentProfile,
  StudentServiceResult,
 } from "@/types/students"

// import type {

// } from "@/types/students"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function fail<T>(error: string): StudentServiceResult<T> {
  return {
    data: null,
    error,
    successMessage: null,
  }
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentServiceResult<StudentProfile>> {
  if (!UUID_PATTERN.test(studentId)) {
    return fail("Invalid student ID.")
  }

  const db = await createClient()

  // 1. Authenticate the request.
  const { data: auth, error: authError } =
    await db.auth.getUser()

  if (authError || !auth.user) {
    return fail("Please sign in to continue.")
  }

  // 2. Verify the configured school.
  const { data: organization, error: orgError } =
    await db
      .from(tables.organizations)
      .select("id")
      .eq("id", ORGANIZATION_ID)
      .eq("slug", SCHOOL_SLUG)
      .eq("type", "school")
      .eq("status", "active")
      .maybeSingle()

  if (orgError) return fail(orgError.message)

  if (!organization) {
    return fail("School information unavailable.")
  }

  const organizationId = organization.id

  // 3. Retrieve permanent student identity.
  const { data: student, error: studentError } =
    await db
      .from(tables.school_students)
      .select(`
        id,
        organization_id,
        membership_id,
        admission_number,
        first_name,
        last_name,
        other_names,
        status,
        created_at,
        updated_at
      `)
      .eq("organization_id", organizationId)
      .eq("id", studentId)
      .maybeSingle()

  if (studentError) {
    return fail(studentError.message)
  }

  if (!student) {
    return fail("Student not found.")
  }

  // 4. Retrieve independent profile sections in parallel.
  // RLS applies to every query.
  const [
    detailsResult,
    guardiansResult,
    enrollmentsResult,
    reportsResult,
  ] = await Promise.all([
    // Private personal details.
    db
      .from(tables.school_student_details)
      .select(`
        student_id,
        organization_id,
        date_of_birth,
        gender,
        photo_path,
        residential_address,
        previous_school_name,
        previous_school_address
      `)
      .eq("organization_id", organizationId)
      .eq("student_id", studentId)
      .maybeSingle(),

    // Linked guardians and their contact information.
    db
      .from(tables.school_student_guardians)
      .select(`
        id,
        organization_id,
        student_id,
        guardian_id,
        relationship,
        is_primary,
        is_emergency_contact,
        guardian:school_guardians (
          id,
          organization_id,
          first_name,
          last_name,
          other_names,
          phone,
          alternate_phone,
          email,
          residential_address,
          occupation
        )
      `)
      .eq("organization_id", organizationId)
      .eq("student_id", studentId)
      .order("is_primary", { ascending: false }),

    // Complete class placement history.
    db
      .from(tables.school_enrollments)
      .select(`
        id,
        organization_id,
        student_id,
        class_id,
        enrolled_on,
        left_on,
        status,
        class:school_classes (
          id,
          name,
          session_id,
          level:school_class_levels (
            name
          ),
          stream:school_streams (
            name
          ),
          arm:school_arms (
            name
          ),
          session:school_academic_sessions (
            id,
            name,
            is_current
          )
        )
      `)
      .eq("organization_id", organizationId)
      .eq("student_id", studentId)
      .order("enrolled_on", { ascending: false })
      .order("created_at", { ascending: false }),

    // Report cards and their subject results.
    // The existing RLS policies restrict students
    // to their own published reports.
    db
      .from(tables.school_report_cards)
      .select(`
        id,
        student_id,
        term_id,
        class_id,
        status,
        teacher_comment,
        principal_comment,
        published_at,
        created_at,
        term:school_terms (
          id,
          name,
          position,
          session:school_academic_sessions (
            id,
            name
          )
        ),
        class:school_classes (
          id,
          name
        ),
        subjects:school_report_card_subjects (
          id,
          offering_id,
          total_score,
          grade,
          remark,
          offering:school_subject_offerings (
            id,
            subject:school_subjects (
              id,
              name,
              code
            )
          )
        )
      `)
      .eq("organization_id", organizationId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ])

  // 5. Do not silently treat query failures as
  // missing or empty academic information.
  const queryError =
    detailsResult.error ??
    guardiansResult.error ??
    enrollmentsResult.error ??
    reportsResult.error

  if (queryError) {
    return fail(queryError.message)
  }

  const details = (detailsResult.data ??
    null) as StudentDetails | null

  const guardians = (
    guardiansResult.data ?? []
  ) as unknown as StudentGuardianLink[]

  const enrollments = (
    enrollmentsResult.data ?? []
  ) as unknown as StudentEnrollmentHistory[]

  const reportCards = (
    reportsResult.data ?? []
  ) as unknown as StudentReportCard[]

  // 6. Derive page summary without another query.
  const currentEnrollment =
    enrollments.find(
      (enrollment) =>
        enrollment.status === "active" &&
        enrollment.class.session.is_current
    ) ?? null

  const latestEnrollment = enrollments[0] ?? null

  const totalPublishedReports = reportCards.filter(
    (report) => report.status === "published"
  ).length

  // 7. Return one page-ready profile.
  return {
    data: {
      student: student as SchoolStudent,
      details,
      guardians,
      enrollments,
      reportCards,

      summary: {
        totalEnrollments: enrollments.length,
        totalPublishedReports,
        currentEnrollment,
        latestEnrollment,
      },
    },
    error: null,
    successMessage: null,
  }
}



// import type { SchoolGuardian } from "@/types/students"
// import { StudentServiceResult } from "@/types/students"
// import { StudentProfile } from "@/types/students"

export async function searchGuardians(
  search: string
): Promise<SchoolGuardian[]> {
  const query = search.trim()

  if (query.length < 2) return []

  const db = await createClient()

  const { data, error } = await db
    .from(tables.school_guardians)
    .select(`
      id,
      organization_id,
      first_name,
      last_name,
      other_names,
      phone,
      alternate_phone,
      email,
      residential_address,
      occupation
    `)
    .ilike("last_name", `%${query}%`)
    .order("last_name")
    .limit(15)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as SchoolGuardian[]
}



export type StudentStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "graduated"
  | "transferred"

export type StudentDirectoryItem = Pick<
  SchoolStudent,
  | "id"
  | "first_name"
  | "last_name"
  | "other_names"
  | "admission_number"
  | "status"
>

export type StudentDirectoryPage = {
  students: StudentDirectoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type StudentDirectoryFilters = {
  q?: string
  status?: string
  page?: number
}

const PAGE_SIZE = 15

export async function getStudentDirectory({
  q = "",
  status = "all",
  page = 1,
}: StudentDirectoryFilters = {}): Promise<StudentDirectoryPage> {
  const db = await createClient()

  // Remove PostgREST filter syntax from the search input.
  const search = q
    .trim()
    .replace(/[%,().*\\]/g, "")
    .slice(0, 80)

  const validStatuses: StudentStatusFilter[] = [
    "all",
    "active",
    "inactive",
    "graduated",
    "transferred",
  ]

  const selectedStatus: StudentStatusFilter =
    validStatuses.includes(status as StudentStatusFilter)
      ? (status as StudentStatusFilter)
      : "all"

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1

  function baseQuery() {
    let query = db
      .from(tables.school_students)
      .select(
        "id, first_name, last_name, other_names, admission_number, status",
        { count: "exact" }
      )
      .eq("organization_id", ORGANIZATION_ID)

    if (selectedStatus !== "all") {
      query = query.eq("status", selectedStatus)
    }

    if (search) {
      query = query.or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `other_names.ilike.%${search}%`,
          `admission_number.ilike.%${search}%`,
        ].join(",")
      )
    }

    return query
  }

  // Fetch the count separately so an out-of-range page
  // can be corrected before fetching its records.
  const { count, error: countError } = await baseQuery()
    .limit(0)

  if (countError) {
    throw new Error(countError.message)
  }

  const total = count ?? 0
  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  )
  const currentPage = Math.min(
    requestedPage,
    totalPages
  )

  const from = (currentPage - 1) * PAGE_SIZE

  const { data, error } = await baseQuery()
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  if (error) {
    throw new Error(error.message)
  }

  return {
    students: (data ?? []) as StudentDirectoryItem[],
    total,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages,
  }
}
