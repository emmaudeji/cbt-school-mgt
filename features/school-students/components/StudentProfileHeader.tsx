
import Link from "next/link"
import {
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Pencil,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { urls } from "@/constants"
import type { StudentProfile } from "@/types/students"

type Props = {
  profile: StudentProfile
  canManage: boolean
  onEdit: () => void
}

export default function StudentProfileHeader({
  profile,
  canManage,
  onEdit,
}: Props) {
  const { student, summary } = profile

  const fullName = [
    student.first_name,
    student.other_names,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  const initials = `${student.first_name[0] ?? ""}${
    student.last_name[0] ?? ""
  }`.toUpperCase()

  const currentClass = summary.currentEnrollment?.class

  return (
    <Card className="overflow-hidden gap-0 py-0">
      <div className="h-1 bg-primary" />

      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary sm:size-20"
          >
            {initials || <UserRound className="size-8" />}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">
                {fullName}
              </h1>

              <Badge
                variant={
                  student.status === "active"
                    ? "default"
                    : "secondary"
                }
                className="capitalize"
              >
                {student.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Admission No:{" "}
              <span className="font-medium text-foreground">
                {student.admission_number ?? "Not assigned"}
              </span>
            </p>

            <p className="text-xs text-muted-foreground">
              Permanent student record
            </p>
          </div>

          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
              Edit Identity
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Current Class
            </p>

            {currentClass ? (
              <Link
                href={urls.classDetails(currentClass.id)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <span className="truncate">
                  {currentClass.name}
                </span>
                <ChevronRight className="size-3.5 shrink-0" />
              </Link>
            ) : (
              <p className="text-sm font-medium">
                Not enrolled
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Class Placements
            </p>

            <p className="text-lg font-semibold tabular-nums">
              {summary.totalEnrollments}
            </p>
          </div>

          <div className="col-span-2 space-y-1 sm:col-span-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <GraduationCap className="size-3.5" />
              Published Reports
            </p>

            <p className="text-lg font-semibold tabular-nums">
              {summary.totalPublishedReports}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
