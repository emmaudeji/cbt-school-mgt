export interface SchoolStudent {
  id: string
  organization_id: string
  membership_id: string | null
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  status: StudentStatus
  created_at: string
  updated_at: string
}

export interface StudentDetails {
  student_id: string
  organization_id: string
  date_of_birth: string | null
  gender: StudentGender | null
  photo_path: string | null
  residential_address: string | null
  previous_school_name: string | null
  previous_school_address: string | null
}

export interface SchoolGuardian {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  other_names: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  residential_address: string | null
  occupation: string | null
}

export interface StudentGuardianLink {
  id: string
  organization_id: string
  student_id: string
  guardian_id: string
  relationship: string
  is_primary: boolean
  is_emergency_contact: boolean
  guardian: SchoolGuardian
}

export interface StudentProfile {
  student: SchoolStudent
  details: StudentDetails | null
  guardians: StudentGuardianLink[]
}

export type StudentInput = {
  first_name: string
  last_name: string
  other_names?: string | null
  admission_number?: string | null
}

export type StudentDetailsInput = Omit<
  StudentDetails,
  "organization_id" | "student_id"
>

export type GuardianInput = Omit<
  SchoolGuardian,
  "id" | "organization_id"
>

export type GuardianLinkInput = {
  student_id: string
  guardian_id: string
  relationship: string
  is_emergency_contact?: boolean
}

export type StudentStatus =
  | "active"
  | "inactive"
  | "graduated"
  | "transferred"

export type StudentGender = "male" | "female" | "other"

export interface SchoolStudent {
  id: string
  organization_id: string
  membership_id: string | null
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  status: StudentStatus
  created_at: string
  updated_at: string
}

export interface StudentDetails {
  student_id: string
  organization_id: string
  date_of_birth: string | null
  gender: StudentGender | null
  photo_path: string | null
  residential_address: string | null
  previous_school_name: string | null
  previous_school_address: string | null
}

export interface SchoolGuardian {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  other_names: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  residential_address: string | null
  occupation: string | null
}

export interface StudentGuardianLink {
  id: string
  organization_id: string
  student_id: string
  guardian_id: string
  relationship: string
  is_primary: boolean
  is_emergency_contact: boolean
  guardian: SchoolGuardian
}

export type StudentEnrollmentStatus =
  | "active"
  | "completed"
  | "transferred"
  | "withdrawn"

export interface StudentEnrollmentHistory {
  id: string
  organization_id: string
  student_id: string
  class_id: string
  enrolled_on: string
  left_on: string | null
  status: StudentEnrollmentStatus

  class: {
    id: string
    name: string
    session_id: string
    level: {
      name: string
    } | null
    stream: {
      name: string
    } | null
    arm: {
      name: string
    } | null
    session: {
      id: string
      name: string
      is_current: boolean
    }
  }
}

export type StudentReportCardStatus =
  | "draft"
  | "published"

export interface StudentReportSubject {
  id: string
  offering_id: string
  total_score: number | null
  grade: string | null
  remark: string | null

  offering: {
    id: string
    subject: {
      id: string
      name: string
      code: string | null
    }
  }
}

export interface StudentReportCard {
  id: string
  student_id: string
  term_id: string
  class_id: string
  status: StudentReportCardStatus
  teacher_comment: string | null
  principal_comment: string | null
  published_at: string | null
  created_at: string

  term: {
    id: string
    name: string
    position: number
    session: {
      id: string
      name: string
    }
  }

  class: {
    id: string
    name: string
  }

  subjects: StudentReportSubject[]
}

export interface StudentProfile {
  student: SchoolStudent
  details: StudentDetails | null
  guardians: StudentGuardianLink[]
  enrollments: StudentEnrollmentHistory[]
  reportCards: StudentReportCard[]

  summary: {
    totalEnrollments: number
    totalPublishedReports: number
    currentEnrollment: StudentEnrollmentHistory | null
    latestEnrollment: StudentEnrollmentHistory | null
  }
}

export type StudentServiceResult<T> = {
  data: T | null
  error: string | null
  successMessage: string | null
}
