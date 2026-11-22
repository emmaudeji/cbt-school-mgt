
import type { AppRole } from "@/types"
import { urls } from "@/constants"

const STAFF_ROLES: AppRole[] = [
  "owner",
  "admin",
  "examiner",
]

const ADMIN_ROLES: AppRole[] = [
  "owner",
  "admin",
]

export function hasRole(
  roles: AppRole[],
  allowed: AppRole[]
): boolean {
  return roles.some((role) => allowed.includes(role))
}

export function isAdmin(roles: AppRole[]): boolean {
  return hasRole(roles, ADMIN_ROLES)
}

export function isStaff(roles: AppRole[]): boolean {
  return hasRole(roles, STAFF_ROLES)
}

export function getDashboardRoute(
  roles: AppRole[]
): string | null {
  if (isStaff(roles)) return urls.dashboard

  if (roles.includes("candidate")) {
    return urls.myExams
  }

  return null
}
