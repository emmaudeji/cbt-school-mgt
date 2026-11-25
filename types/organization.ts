
export type OrganizationType =
  | "school"
  | "business"
  | "exam_center"
  | "training"
  | "other"

export type OrganizationStatus =
  | "active"
  | "suspended"

export type ThemeMode = "light" | "dark"

export interface AppAppearance {
  primary: string
  accent: string
  mode: ThemeMode
}

export interface OrganizationSettings {
  appearance?: Partial<AppAppearance>
  [key: string]: unknown
}

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
  status: OrganizationStatus
  timezone: string
  settings: OrganizationSettings
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  type: OrganizationType
}

export interface SchoolBranding {
  organizationId: string
  name: string
  shortName: string | null
  motto: string | null
  logoPath: string | null
  appearance: AppAppearance
}

