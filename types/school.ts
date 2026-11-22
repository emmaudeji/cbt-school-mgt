
export type SchoolStatus = "active" | "inactive"

export interface SchoolProp {
  id: string
  organization_id: string
  name: string

  code: string | null
  short_name: string | null
  motto: string | null
  logo_path: string | null
  school_level: string | null
  institution_type: string | null
  status: SchoolStatus
  opened_on: string | null

  address: string | null
  address_line_2: string | null
  city: string | null
  district: string | null
  state: string | null
  country: string | null
  postal_code: string | null

  phone: string | null
  email: string | null
  website: string | null

  created_by: string | null
  created_at: string
  updated_at: string
}

// Matches the school_details database table.
// The school name belongs to organizations.
export type SchoolDetails = Omit<SchoolProp, "name">

// Lightweight school data for headers,
// navigation and dashboard layouts.
export type SchoolSummary = Pick<
  SchoolProp,
  | "id"
  | "name"
  | "short_name"
  | "motto"
  | "logo_path"
  | "city"
  | "state"
>

