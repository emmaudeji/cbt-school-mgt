
import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { urls } from "@/constants"

import type {
  StudentEnrollmentHistory,
} from "@/types/students"

type Props = {
  enrollments: StudentEnrollmentHistory[]
}

function formatDate(value: string | null) {
  if (!value) return "Ongoing"

  const [year, month, day] = value.split("-").map(Number)

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export default function StudentAcademicHistory({
  enrollments,
}: Props) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4 sm:px-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-primary" />
          <CardTitle className="text-base">
            Academic Journey
          </CardTitle>
        </div>

        <Badge variant="secondary">
          {enrollments.length} placements
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {enrollments.length === 0 ? (
          <div className="space-y-2 py-8 text-center">
            <BookOpen className="mx-auto size-9 text-muted-foreground" />

            <p className="text-sm font-medium">
              No class history yet
            </p>

            <p className="text-xs text-muted-foreground">
              Class placements will appear here once
              the student is enrolled.
            </p>
          </div>
        ) : (
          <ol className="relative ml-2 space-y-5 border-l border-border">
            {enrollments.map((enrollment) => {
              const cls = enrollment.class
              const session = cls?.session

              return (
                <li
                  key={enrollment.id}
                  className="relative ml-5 space-y-3"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[27px] top-1.5 size-3 rounded-full border-[3px] border-background bg-primary"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {session?.name ?? "Unknown Session"}
                    </h3>

                    <Badge
                      variant={
                        enrollment.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {enrollment.status}
                    </Badge>

                    {session?.is_current && (
                      <Badge variant="outline">
                        Current Session
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={urls.classDetails(enrollment.class_id)}
                          className="inline-flex items-center gap-1 font-medium hover:text-primary"
                        >
                          {cls?.name ?? "Class"}
                          <ArrowUpRight className="size-3.5" />
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            cls?.level?.name,
                            cls?.stream?.name,
                            cls?.arm?.name,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Class placement"}
                        </p>
                      </div>

                      {session && (
                        <Link
                          href={urls.sessionClasses(session.id)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Session Classes
                        </Link>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">
                          Enrolled
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDate(enrollment.enrolled_on)}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">
                          Left
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDate(enrollment.left_on)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
