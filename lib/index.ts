
import type {
  AppAppearance,
  OrganizationSettings,
} from "@/types"

export const DEFAULT_APPEARANCE: AppAppearance = {
  primary: "#1D4ED8",
  accent: "#F59E0B",
  mode: "light",
}

function validColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value)
  )
}

export function getAppearance(
  settings?: OrganizationSettings | null
): AppAppearance {
  const appearance = settings?.appearance

  return {
    primary: validColor(appearance?.primary)
      ? appearance.primary
      : DEFAULT_APPEARANCE.primary,

    accent: validColor(appearance?.accent)
      ? appearance.accent
      : DEFAULT_APPEARANCE.accent,

    mode:
      appearance?.mode === "dark"
        ? "dark"
        : "light",
  }
}


export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/g, "") || "item"
// utils/school-permissions.ts

export const SCHOOL_MANAGEMENT_ROLES = [
  "owner",
  "admin",
  "school_admin",
] as const

export function canManageSchool(
  roles: readonly string[]
): boolean {
  return roles.some((role) =>
    SCHOOL_MANAGEMENT_ROLES.some(
      (allowed) => allowed === role
    )
  )
}