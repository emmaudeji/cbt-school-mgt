
import "server-only"

import { getStaffContext } from "@/services/auth"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type DbError = { message: string } | null

async function readAll<T>(
  fetchPage: (
    from: number,
    to: number
  ) => PromiseLike<{
    data: T[] | null
    error: DbError
  }>,
  label: string
): Promise<T[]> {
  const batch = 500
  const limit = 5000
  const rows: T[] = []

  for (let offset = 0; offset < limit; offset += batch) {
    const { data, error } = await fetchPage(
      offset,
      offset + batch - 1
    )

    if (error) {
      throw new Error(`${label}: ${error.message}`)
    }

    const page = data ?? []
    rows.push(...page)

    if (page.length < batch) return rows
  }

  throw new Error(
    `${label}: Too many records for this profile view.`
  )
}

async function readByIds<T>(
  ids: string[],
  fetchBatch: (
    ids: string[],
    from: number,
    to: number
  ) => PromiseLike<{
    data: T[] | null
    error: DbError
  }>,
  label: string
): Promise<T[]> {
  const unique = [...new Set(ids)]
  const output: T[] = []

  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100)

    output.push(
      ...(await readAll(
        (from, to) => fetchBatch(chunk, from, to),
        label
      ))
    )
  }

  return output
}

export type ProfileStudent = {
  id: string
  membership_id: string | null
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  status: string
  created_at: string
}

export type ProfileDetails = {
  date_of_birth: string | null
  gender: string | null
  residential_address: string | null
  previous_school_name: string | null
  previous_school_address: string | null
}

export type ProfileGuardian = {
  id: string
  name: string
  phone: string | null
  alternatePhone: string | null
  email: string | null
  relationship: string | null
  primary: boolean
  emergency: boolean
}

export type ProfileSession = {
  id: string
  name: string
  is_current: boolean
}

export type ProfileTerm = {
  id: string
  sessionId: string
  name: string
  position: number
  is_current: boolean
}

export type ProfileEnrollment = {
  id: string
  sessionId: string
  sessionName: string
  classId: string
  className: string
  enrolledOn: string
  leftOn: string | null
  status: string
}

export type ProfileAssessment = {
  id: string
  sessionId: string
  termId: string
  classId: string
  subjectName: string
  componentName: string
  score: number
  maximumScore: number
  weightPercent: number
  note: string | null
  updatedAt: string
}

export type ProfileCbtResult = {
  id: string
  attemptId: string
  examTitle: string
  revision: number
  attemptNumber: number
  earnedPoints: number
  totalPoints: number
  percentage: number
  finalizedAt: string
}

export type ProfileReportSubject = {
  id: string
  subjectName: string
  totalScore: number | null
  grade: string | null
  remark: string | null
}

export type ProfileReportCard = {
  id: string
  sessionId: string
  termId: string
  termName: string
  className: string
  status: string
  publishedAt: string | null
  teacherComment: string | null
  principalComment: string | null
  subjects: ProfileReportSubject[]
}

export type StudentProfileData = {
  schoolName: string
  student: ProfileStudent
  details: ProfileDetails | null
  guardians: ProfileGuardian[]
  sessions: ProfileSession[]
  terms: ProfileTerm[]
  enrollments: ProfileEnrollment[]
  assessments: ProfileAssessment[]
  cbtResults: ProfileCbtResult[]
  reportCards: ProfileReportCard[]
  cbtLinked: boolean
  sectionErrors: string[]
}

export async function getStudentProfileData(
  studentId: string
): Promise<StudentProfileData | null> {
  if (!UUID.test(studentId)) return null

  const context = await getStaffContext()
  if (!context) return null

  const orgId = context.organizationId
  const db = context.supabase

  // Student identity is always resolved inside
  // the authenticated staff member's school.
  const { data: student, error: studentError } =
    await db
      .from("school_students")
      .select(
        "id, membership_id, admission_number, first_name, last_name, other_names, status, created_at"
      )
      .eq("organization_id", orgId)
      .eq("id", studentId)
      .maybeSingle()

  if (studentError || !student) return null

  const sectionErrors: string[] = []

  const [
    schoolResult,
    detailsResult,
    guardianLinksResult,
    sessionsResult,
    termsResult,
  ] = await Promise.all([
    db
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle(),

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
        "guardian_id, relationship, is_primary, is_emergency_contact"
      )
      .eq("organization_id", orgId)
      .eq("student_id", studentId),

    db
      .from("school_academic_sessions")
      .select("id, name, is_current")
      .eq("organization_id", orgId)
      .order("name", { ascending: false }),

    db
      .from("school_terms")
      .select(
        "id, session_id, name, position, is_current"
      )
      .eq("organization_id", orgId)
      .order("position"),
  ])

  if (detailsResult.error) {
    sectionErrors.push("Admission details could not be loaded.")
  }

  if (guardianLinksResult.error) {
    sectionErrors.push("Guardian links could not be loaded.")
  }

  if (sessionsResult.error || termsResult.error) {
    sectionErrors.push("Academic periods could not be loaded.")
  }

  const sessions: ProfileSession[] =
    sessionsResult.data ?? []

  const terms: ProfileTerm[] = (
    termsResult.data ?? []
  ).map((term) => ({
    id: term.id,
    sessionId: term.session_id,
    name: term.name,
    position: term.position,
    is_current: term.is_current,
  }))

  const sessionMap = new Map(
    sessions.map((s) => [s.id, s.name])
  )

  // Fetch complete enrollment history.
  let enrollmentRows: {
    id: string
    session_id: string
    class_id: string
    enrolled_on: string
    left_on: string | null
    status: string
  }[] = []

  try {
    enrollmentRows = await readAll(
      (from, to) =>
        db
          .from("school_enrollments")
          .select(
            "id, session_id, class_id, enrolled_on, left_on, status"
          )
          .eq("organization_id", orgId)
          .eq("student_id", studentId)
          .order("enrolled_on", {
            ascending: false,
          })
          .order("id")
          .range(from, to),
      "Enrollment history"
    )
  } catch (error) {
    console.error("[STUDENT:ENROLLMENTS]", error)
    sectionErrors.push("Enrollment history could not be loaded.")
  }

  // Guardian contact details.
  const guardianLinks =
    guardianLinksResult.data ?? []

  let guardians: ProfileGuardian[] = []

  try {
    const guardianRows = await readByIds(
      guardianLinks.map((g) => g.guardian_id),
      (ids, from, to) =>
        db
          .from("school_guardians")
          .select(
            "id, first_name, last_name, other_names, phone, alternate_phone, email"
          )
          .eq("organization_id", orgId)
          .in("id", ids)
          .range(from, to),
      "Guardians"
    )

    const guardianMap = new Map(
      guardianRows.map((g) => [g.id, g])
    )

    guardians = guardianLinks.flatMap((link) => {
      const g = guardianMap.get(link.guardian_id)
      if (!g) return []

      return [{
        id: g.id,
        name: [
          g.last_name,
          g.first_name,
          g.other_names,
        ].filter(Boolean).join(" "),
        phone: g.phone,
        alternatePhone: g.alternate_phone,
        email: g.email,
        relationship: link.relationship,
        primary: link.is_primary,
        emergency: link.is_emergency_contact,
      }]
    })
  } catch (error) {
    console.error("[STUDENT:GUARDIANS]", error)
    sectionErrors.push("Guardian contacts could not be loaded.")
  }

  // Class names for historical enrollments.
  const classNames = new Map<string, string>()

  async function loadClassNames(ids: string[]) {
    const missing = [...new Set(ids)].filter(
      (id) => !classNames.has(id)
    )

    if (!missing.length) return

    const rows = await readByIds(
      missing,
      (chunk, from, to) =>
        db
          .from("school_classes")
          .select("id, name")
          .eq("organization_id", orgId)
          .in("id", chunk)
          .range(from, to),
      "Classes"
    )

    for (const row of rows) {
      classNames.set(row.id, row.name)
    }
  }

  try {
    await loadClassNames(
      enrollmentRows.map((e) => e.class_id)
    )
  } catch (error) {
    console.error("[STUDENT:CLASS_NAMES]", error)
    sectionErrors.push("Some class names could not be loaded.")
  }

  const enrollments: ProfileEnrollment[] =
    enrollmentRows.map((e) => ({
      id: e.id,
      sessionId: e.session_id,
      sessionName:
        sessionMap.get(e.session_id) ?? "Academic session",
      classId: e.class_id,
      className:
        classNames.get(e.class_id) ?? "Unknown class",
      enrolledOn: e.enrolled_on,
      leftOn: e.left_on,
      status: e.status,
    }))

  // Read assessment scores and report cards.
  let assessments: ProfileAssessment[] = []
  let reportCards: ProfileReportCard[] = []

  try {
    const [scoreRows, reportRows] = await Promise.all([
      readAll(
        (from, to) =>
          db
            .from("school_assessment_scores")
            .select(
              "id, component_id, score, note, updated_at"
            )
            .eq("organization_id", orgId)
            .eq("student_id", studentId)
            .order("updated_at", {
              ascending: false,
            })
            .range(from, to),
        "Assessment scores"
      ),

      readAll(
        (from, to) =>
          db
            .from("school_report_cards")
            .select(
              "id, term_id, class_id, status, teacher_comment, principal_comment, published_at"
            )
            .eq("organization_id", orgId)
            .eq("student_id", studentId)
            .range(from, to),
        "Report cards"
      ),
    ])

    const componentRows = await readByIds(
      scoreRows.map((r) => r.component_id),
      (ids, from, to) =>
        db
          .from("school_assessment_components")
          .select(
            "id, offering_id, name, maximum_score, weight_percent"
          )
          .eq("organization_id", orgId)
          .in("id", ids)
          .range(from, to),
      "Assessment components"
    )

    const reportSubjectRows = await readByIds(
      reportRows.map((r) => r.id),
      (ids, from, to) =>
        db
          .from("school_report_card_subjects")
          .select(
            "id, report_card_id, offering_id, total_score, grade, remark"
          )
          .eq("organization_id", orgId)
          .in("report_card_id", ids)
          .range(from, to),
      "Report card subjects"
    )

    const offeringRows = await readByIds(
      [
        ...componentRows.map((c) => c.offering_id),
        ...reportSubjectRows.map((r) => r.offering_id),
      ],
      (ids, from, to) =>
        db
          .from("school_subject_offerings")
          .select(
            "id, subject_id, session_id, term_id, class_id"
          )
          .eq("organization_id", orgId)
          .in("id", ids)
          .range(from, to),
      "Subject offerings"
    )

    const subjectRows = await readByIds(
      offeringRows.map((o) => o.subject_id),
      (ids, from, to) =>
        db
          .from("school_subjects")
          .select("id, name")
          .eq("organization_id", orgId)
          .in("id", ids)
          .range(from, to),
      "Subjects"
    )

    await loadClassNames(
      reportRows.map((r) => r.class_id)
    )

    const componentMap = new Map(
      componentRows.map((c) => [c.id, c])
    )

    const offeringMap = new Map(
      offeringRows.map((o) => [o.id, o])
    )

    const subjectMap = new Map(
      subjectRows.map((s) => [s.id, s.name])
    )

    const termMap = new Map(
      terms.map((t) => [t.id, t])
    )

    assessments = scoreRows.flatMap((r) => {
      const component = componentMap.get(
        r.component_id
      )

      const offering = component
        ? offeringMap.get(component.offering_id)
        : null

      if (!component || !offering) return []

      return [{
        id: r.id,
        sessionId: offering.session_id,
        termId: offering.term_id,
        classId: offering.class_id,
        subjectName:
          subjectMap.get(offering.subject_id) ??
          "Unknown subject",
        componentName: component.name,
        score: Number(r.score),
        maximumScore:
          Number(component.maximum_score),
        weightPercent:
          Number(component.weight_percent),
        note: r.note,
        updatedAt: r.updated_at,
      }]
    })

    reportCards = reportRows.map((r) => {
      const term = termMap.get(r.term_id)

      const subjects = reportSubjectRows
        .filter((s) => s.report_card_id === r.id)
        .map((s) => {
          const offering = offeringMap.get(
            s.offering_id
          )

          return {
            id: s.id,
            subjectName: offering
              ? subjectMap.get(offering.subject_id) ??
                "Unknown subject"
              : "Unknown subject",
            totalScore:
              s.total_score === null
                ? null
                : Number(s.total_score),
            grade: s.grade,
            remark: s.remark,
          }
        })

      return {
        id: r.id,
        sessionId: term?.sessionId ?? "",
        termId: r.term_id,
        termName: term?.name ?? "Unknown term",
        className:
          classNames.get(r.class_id) ?? "Unknown class",
        status: r.status,
        publishedAt: r.published_at,
        teacherComment: r.teacher_comment,
        principalComment: r.principal_comment,
        subjects,
      }
    })
  } catch (error) {
    console.error("[STUDENT:SCHOOL_RESULTS]", error)
    sectionErrors.push(
      "Some assessment scores or report cards could not be loaded."
    )
  }

  // CBT identity is linked through membership.
  // Never match results using a student's name.
  let cbtResults: ProfileCbtResult[] = []

  if (student.membership_id) {
    try {
      const candidateRows = await readAll(
        (from, to) =>
          db
            .from("cbt_candidates")
            .select("id")
            .eq("organization_id", orgId)
            .eq(
              "membership_id",
              student.membership_id!
            )
            .range(from, to),
        "CBT candidate identities"
      )

      const candidateIds = candidateRows.map(
        (c) => c.id
      )

      const attemptRows = await readAll(
        (from, to) => {
          let query = db
            .from("cbt_exam_attempts")
            .select(
              "id, publication_id, attempt_number, status"
            )
            .eq("organization_id", orgId)

          if (candidateIds.length) {
            query = query.or(
              `candidate_membership_id.eq.${student.membership_id},candidate_id.in.(${candidateIds.join(",")})`
            )
          } else {
            query = query.eq(
              "candidate_membership_id",
              student.membership_id!
            )
          }

          return query
            .order("created_at", {
              ascending: false,
            })
            .range(from, to)
        },
        "CBT attempts"
      )

      const resultRows = await readByIds(
        attemptRows.map((a) => a.id),
        (ids, from, to) =>
          db
            .from("cbt_results")
            .select(
              "id, attempt_id, earned_points, total_points, percentage, finalized_at"
            )
            .eq("organization_id", orgId)
            .in("attempt_id", ids)
            .range(from, to),
        "Finalized CBT results"
      )

      const publicationRows = await readByIds(
        attemptRows.map((a) => a.publication_id),
        (ids, from, to) =>
          db
            .from("cbt_exam_publications")
            .select("id, exam_id, revision")
            .eq("organization_id", orgId)
            .in("id", ids)
            .range(from, to),
        "CBT publications"
      )

      const examRows = await readByIds(
        publicationRows.map((p) => p.exam_id),
        (ids, from, to) =>
          db
            .from("cbt_exams")
            .select("id, title")
            .eq("organization_id", orgId)
            .in("id", ids)
            .range(from, to),
        "CBT exams"
      )

      const attemptMap = new Map(
        attemptRows.map((a) => [a.id, a])
      )

      const publicationMap = new Map(
        publicationRows.map((p) => [p.id, p])
      )

      const examMap = new Map(
        examRows.map((e) => [e.id, e.title])
      )

      cbtResults = resultRows
        .filter((r) => r.finalized_at)
        .map((r) => {
          const attempt = attemptMap.get(
            r.attempt_id
          )

          const publication = attempt
            ? publicationMap.get(attempt.publication_id)
            : null

          return {
            id: r.id,
            attemptId: r.attempt_id,
            examTitle: publication
              ? examMap.get(publication.exam_id) ??
                "CBT Examination"
              : "CBT Examination",
            revision: publication?.revision ?? 1,
            attemptNumber:
              attempt?.attempt_number ?? 1,
            earnedPoints:
              Number(r.earned_points),
            totalPoints:
              Number(r.total_points),
            percentage:
              Number(r.percentage),
            finalizedAt: r.finalized_at,
          }
        })
        .sort(
          (a, b) =>
            b.finalizedAt.localeCompare(a.finalizedAt)
        )
    } catch (error) {
      console.error("[STUDENT:CBT_RESULTS]", error)
      sectionErrors.push(
        "Linked CBT results could not be loaded. Check exam-result permissions."
      )
    }
  }

  return {
    schoolName:
      schoolResult.data?.name ?? "School",
    student,
    details: detailsResult.data ?? null,
    guardians,
    sessions,
    terms,
    enrollments,
    assessments,
    cbtResults,
    reportCards,
    cbtLinked: Boolean(student.membership_id),
    sectionErrors,
  }
}
