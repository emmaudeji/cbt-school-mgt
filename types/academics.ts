
export interface AcademicSession {
  id: string
  organization_id: string
  name: string
  starts_on: string | null
  ends_on: string | null
  is_current: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AcademicTerm {
  id: string
  organization_id: string
  session_id: string
  name: string
  position: number
  starts_on: string | null
  ends_on: string | null
  is_current: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AcademicSessionWithTerms extends AcademicSession {
  terms: AcademicTerm[]
}

export type CreateAcademicSession = Pick<
  AcademicSession,
  "organization_id" | "name"
> & Partial<
  Pick<AcademicSession, "starts_on" | "ends_on" | "is_current">
>

export type UpdateAcademicSession = Partial<
  Pick<
    AcademicSession,
    "name" | "starts_on" | "ends_on"
  >
>

export type CreateAcademicTerm = Pick<
  AcademicTerm,
  "organization_id" | "session_id" | "name" | "position"
> & Partial<
  Pick<AcademicTerm, "starts_on" | "ends_on">
>

export type UpdateAcademicTerm = Partial<
  Pick<
    AcademicTerm,
    "name" | "position" | "starts_on" | "ends_on"
  >
>

export type AcademicResult<T> = {
  data: T | null
  error: string | null
  successMessage: string | null
}
