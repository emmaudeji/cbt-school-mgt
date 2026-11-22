
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  IdCard,
  LogOut,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { logoutStudent } from "../services/auth-actions"

import type {
  StudentDashboardData,
} from "../services/dashboard-queries"

type Props = {
  student: StudentDashboardData
}

export function StudentDashboard({
  student,
}: Props) {
  const fullName = [
    student.first_name,
    student.other_names,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base">
                {student.school_name}
              </h1>

              <p className="text-xs text-muted-foreground">
                Student Portal
              </p>
            </div>
          </div>

          <form action={logoutStudent}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="shadow-none"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">
                Sign Out
              </span>
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        {/* Welcome */}
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Welcome to your dashboard
              </p>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {fullName}
              </h2>

              <p className="text-sm text-muted-foreground">
                Everything you need for your
                school activities in one place.
              </p>
            </div>

            <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="size-3" />
              Active Student
            </Badge>
          </div>
        </section>

        {/* Overview */}
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">
              My Information
            </h3>

            <p className="text-sm text-muted-foreground">
              Your current school records.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IdCard className="size-5" />
              </div>

              <p className="text-xs text-muted-foreground">
                Admission Number
              </p>

              <p className="mt-1 break-all text-base font-semibold">
                {student.admission_number ||
                  "Not assigned"}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <School className="size-5" />
              </div>

              <p className="text-xs text-muted-foreground">
                Current Class
              </p>

              <p className="mt-1 text-base font-semibold">
                {student.class_name ||
                  "Not currently placed"}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </div>

              <p className="text-xs text-muted-foreground">
                Academic Session
              </p>

              <p className="mt-1 text-base font-semibold">
                {student.session_name ||
                  "No current placement"}
              </p>
            </div>
          </div>
        </section>

        {/* Exam integration placeholder */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">
            My Examinations
          </h3>

          <div className="rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">
                  Assigned Examinations
                </h4>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Your school examinations will appear
                  here when CBT assignments are
                  connected to the student portal.
                </p>
              </div>

              <Badge variant="secondary">
                Coming Next
              </Badge>
            </div>
          </div>
        </section>

        {/* Account information */}
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="size-5 text-primary" />

            <h3 className="font-semibold">
              My Account
            </h3>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                School Login
              </dt>

              <dd className="mt-1 break-all text-sm font-medium">
                {student.school_login}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Account Status
              </dt>

              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-emerald-600" />
                Active
              </dd>
            </div>
          </dl>

          <p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">
            For password assistance or corrections
            to your school details, contact your
            school administrator.
          </p>
        </section>
      </main>

      <footer className="border-t py-5">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          {student.school_name} · Student Portal
        </div>
      </footer>
    </div>
  )
}
