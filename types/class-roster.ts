
export type RosterStatus =
  | "all"
  | "active"
  | "completed"
  | "transferred"
  | "withdrawn"

export type ClassRosterItem = {
  enrollment_id: string
  student_id: string
  admission_number: string | null
  first_name: string
  last_name: string
  other_names: string | null
  student_status: string
  enrollment_status: Exclude<RosterStatus, "all">
  enrolled_on: string
  left_on: string | null
}

export type RosterClass = {
  id: string
  organization_id: string
  session_id: string
  name: string
  slug: string
  level: { name: string } | null
  stream: { name: string } | null
  arm: { name: string } | null
  session: {
    id: string
    name: string
    is_current: boolean
  }
}

export type ClassRosterData = {
  class: RosterClass
  students: ClassRosterItem[]
  total: number
  page: number
  pageSize: number
  status: RosterStatus
  search: string
  destinationClasses: {
    id: string
    name: string
  }[]
}

export type RosterResult<T> = {
  data: T | null
  error: string | null
}

export type TransferReceipt = {
  student_id: string
  session_id: string
  source_class_id: string
  destination_class_id: string
  previous_enrollment_id: string
  new_enrollment_id: string
}

export type EndPlacementReceipt = {
  student_id: string
  class_id: string
  session_id: string
  enrollment_id: string
  status: "withdrawn" | "completed"
}
