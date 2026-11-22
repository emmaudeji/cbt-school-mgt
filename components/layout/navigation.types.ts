import type { LucideIcon } from "lucide-react"

export interface DashboardNavItem {
  title: string
  href?: string
  icon: LucideIcon
  children?: DashboardNavChild[]
  exact?: boolean
  badge?: string | number
}

export interface DashboardNavChild {
  title: string
  href: string
  exact?: boolean
  badge?: string | number
}

export interface DashboardNavGroup {
  label: string
  items: DashboardNavItem[]
}

export function isNavActive(
  pathname: string,
  href: string,
  exact = false
): boolean {
  if (exact || href === "/") return pathname === href

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isNavItemActive(
  pathname: string,
  item: DashboardNavItem
): boolean {
  return (
    (item.href
      ? isNavActive(pathname, item.href, item.exact)
      : false) ||
    (item.children?.some((child) =>
      isNavActive(pathname, child.href, child.exact)
    ) ?? false)
  )
}