export type AcademicSession = {
  id: string
  name: string
  is_current: boolean
  starts_on: string | null
  ends_on: string | null
}

export type AcademicTerm = {
  id: string
  session_id: string
  name: string
  position: number
  is_current: boolean
  starts_on: string | null
  ends_on: string | null
}

export type AcademicSetupData = {
  school: {
    id: string
    name: string
    slug: string
  }
  sessions: AcademicSession[]
  terms: AcademicTerm[]
}
