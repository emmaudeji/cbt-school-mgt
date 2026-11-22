
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"

import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Plus,
  Search,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

import { InputField } from "@/components/shared/InputField"
import CustomSelect from "@/components/shared/CustomSelect"

import { urls } from "@/constants"


import type {
  StudentDirectoryPage,
  StudentStatusFilter,
} from "../services/student-queries"
import { LinkButton } from "@/components/shared/LinkButton"

type Props = {
  directory: StudentDirectoryPage
  search: string
  status: StudentStatusFilter
}

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Graduated", value: "graduated" },
  { label: "Transferred", value: "transferred" },
]

function displayName(student: StudentDirectoryPage["students"][number]) {
  return [
    student.first_name,
    student.other_names,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ")
}

function StatusBadge({
  status,
}: {
  status: StudentDirectoryPage["students"][number]["status"]
}) {
  return (
    <Badge
      variant={
        status === "active" ? "default" : "secondary"
      }
      className="capitalize"
    >
      {status}
    </Badge>
  )
}

export default function StudentDirectoryByAdmissions({
  directory,
  search,
  status,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(search)
  // const [drawerOpen, setDrawerOpen] = useState(false)

  function navigate(
    changes: Record<string, string | null>
  ) {
    const params = new URLSearchParams(
      searchParams.toString()
    )

    Object.entries(changes).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const nextQuery = params.toString()

    router.replace(
      nextQuery ? `${pathname}?${nextQuery}` : pathname,
      { scroll: false }
    )
  }

  // Keep the input aligned with browser navigation. This sync is
  // required when the route query changes from back/forward
  // navigation or other external updates, so the local input state
  // reflects the current URL state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setQuery(search)
  }, [search])

  // Debounce search so typing does not generate
  // a server request for every keystroke.
  useEffect(() => {
    if (query.trim() === search.trim()) return

    const timeout = setTimeout(() => {
      navigate({
        q: query.trim() || null,
        page: null,
      })
    }, 350)

    return () => clearTimeout(timeout)
    // Deliberately driven by the local query and server search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, search])

  const firstRecord =
    directory.total === 0
      ? 0
      : (directory.page - 1) * directory.pageSize + 1

  const lastRecord = Math.min(
    directory.page * directory.pageSize,
    directory.total
  )

  return (
    <div className="space-y-5">
      

      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Students
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage student records and personal profiles.
          </p>
        </div>


        <LinkButton
          href={urls.studentRegistration}
          type="button"
          className="rounded-full"
        >
          <Plus className="size-4" />
          Register Student
        </LinkButton>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UsersRound className="size-5" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Students matching your filters
          </p>

          <p className="text-xl font-bold tabular-nums">
            {directory.total.toLocaleString()}
          </p>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {/* Search and filters */}
        <CardHeader className="space-y-3 border-b border-border p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
            <InputField
              name="student_search"
              icon={Search}
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search student or admission number..."
              autoComplete="off"
              className="w-72 rounded-full"
            />

            <CustomSelect
              name="student_status"
              value={status}
              options={statusOptions}
              onChange={(value) =>
                navigate({
                  status: value,
                  page: null,
                })
              }
              className="rounded-full"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {directory.students.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-6 text-muted-foreground" />
              </div>

              <p className="font-semibold">
                {search || status !== "all"
                  ? "No matching students"
                  : "No students registered yet"}
              </p>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {search || status !== "all"
                  ? "Try another name, admission number or status."
                  : "Register your first student to begin building the school directory."}
              </p>

              {search || status !== "all" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuery("")
                    navigate({
                      q: null,
                      status: null,
                      page: null,
                    })
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <LinkButton
                  type="button"
                  className="mt-4"
                  href={urls.studentRegistration}
                >
                  <Plus className="size-4" />
                  Register Student
                </LinkButton>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">
                        Student
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Admission Number
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Profile
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {directory.students.map((student) => (
                      <tr
                        key={student.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={urls.studentDetails(student.id)}
                            className="flex items-center gap-3 font-medium hover:text-primary"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </span>

                            <span className="min-w-0 truncate">
                              {displayName(student)}
                            </span>
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {student.admission_number ?? "Not assigned"}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={student.status} />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={urls.studentDetails(student.id)}
                            >
                              View
                              <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile student cards */}
              <div className="divide-y divide-border md:hidden">
                {directory.students.map((student) => (
                  <Link
                    key={student.id}
                    href={urls.studentDetails(student.id)}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-semibold">
                        {displayName(student)}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {student.admission_number ?? "No admission number"}
                      </p>

                      <StatusBadge status={student.status} />
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRecord}–{lastRecord} of{" "}
                  {directory.total.toLocaleString()}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={directory.page <= 1}
                    onClick={() =>
                      navigate({
                        page: String(directory.page - 1),
                      })
                    }
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>

                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {directory.page} / {directory.totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      directory.page >= directory.totalPages
                    }
                    onClick={() =>
                      navigate({
                        page: String(directory.page + 1),
                      })
                    }
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
