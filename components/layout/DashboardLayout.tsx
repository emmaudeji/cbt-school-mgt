
"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { DashboardSidebar } from "./DashboardSidebar"
import { getStaffNavigation } from "./get-staff-navigation"
import { useOrgStore } from "@/store/org-store"

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({
  children,
  className,
}: DashboardLayoutProps) {
  const roles = useOrgStore((state) => state.roles)
  const organizationType = useOrgStore(
    (state) => state.organization.type
  )

  const navigation = getStaffNavigation({
    roles,
    organization: { type: organizationType },
  })

  return (
    <section className="min-h-dvh bg-background text-foreground">
      <DashboardSidebar navigation={navigation} />

      <article
        className={cn(
          "min-h-dvh min-w-0 sm:ml-[76px] xl:ml-[264px]",
          className
        )}
      >
        {children}
      </article>
    </section>
  )
}
