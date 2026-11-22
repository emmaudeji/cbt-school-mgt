
import { redirect } from "next/navigation"

import {
  getStudentDashboard,
} from "@/features/student-portal/services/dashboard-queries"

import {
  StudentDashboard,
} from "@/features/student-portal/components/StudentDashboard"

import { logoutStudent } from
  "@/features/student-portal/services/auth-actions"

import { Button } from "@/components/ui/button"

import {
  ShieldAlert,
  LogOut,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const result = await getStudentDashboard()

  if (result.status === "unauthenticated") {
    redirect("/student/login")
  }

  if (result.status === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-5 rounded-xl border p-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="size-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">
              Student Dashboard Unavailable
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              Your account could not be verified
              as an active school student.

              Your account may be suspended,
              not linked to a student record,
              or temporarily unavailable.
              Contact your school administrator.
            </p>
          </div>

          <form action={logoutStudent}>
            <Button
              type="submit"
              variant="outline"
              className="w-full shadow-none"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <StudentDashboard student={result.data} />
  )
}
