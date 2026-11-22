
export type EnrollmentSession = {
  id: string
  name: string
  is_current: boolean
}

export type EnrollmentClass = {
  id: string
  name: string
  session_id: string
}

export type EnrollmentCandidate = {
  student_id: string
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  total_count: number
}

export type EnrollmentReceipt = {
  created_count: number
  skipped_count: number
  created: {
    student_id: string
    enrollment_id: string
  }[]
  already_enrolled: string[]
  class_id: string
  session_id: string
}

export type EnrollmentOptions = {
  sessions: EnrollmentSession[]
  classes: EnrollmentClass[]
}

export type ServiceResult<T> = {
  data: T | null
  error: string | null
}
