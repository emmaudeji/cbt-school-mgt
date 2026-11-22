
import { staffNavigation } from "./navigation.constants"
import type { DashboardNavGroup } from "./navigation.types"

import { urls } from "@/constants"
import { isAdmin, isStaff } from "@/services/auth/helper"

import type { AppRole } from "@/types"

type NavigationContext = {
  roles: AppRole[]
  organization: {
    type: string
  }
}

export function getStaffNavigation(
  context: NavigationContext
): DashboardNavGroup[] {
  const staff = isStaff(context.roles)
  const admin = isAdmin(context.roles)

  const visibility: Record<string, boolean> = {
    [urls.dashboard]: staff,
    [urls.questions]: staff,
    [urls.exams]: staff,
    [urls.examNew]: staff,
    [urls.candidates]: staff,
    [urls.results]: staff,

    [urls.school]: staff && context.organization.type === "school",
    [urls.schoolAcademicSetup]: staff && context.organization.type === "school",

    [urls.settings]: admin,
  }

  return staffNavigation
    .map((group) => ({
      ...group,
      items: group.items
      // .filter(
      //   (item) =>
      //     Boolean(item.href) &&
      //     visibility[item.href!] === true
      // ),
    }))
    .filter((group) => group.items.length > 0)
}
