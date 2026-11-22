
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { urls } from "@/constants"
import { getOrgContext } from "@/services/auth"
import { isStaff } from "@/services/auth/helper"
import { OrgProvider } from "@/store/org-store"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default async function StaffLayout({
  children,
}: {
  children: ReactNode
}) {
  const context = await getOrgContext()

  if (!context) redirect(urls.login)

  if (!isStaff(context.roles)) {
    redirect(urls.myExams)
  }

  return (
    <OrgProvider initialContext={context}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </OrgProvider>
  )
}
