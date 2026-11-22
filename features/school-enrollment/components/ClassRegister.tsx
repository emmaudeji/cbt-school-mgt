
"use client"

import {
  useActionState,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"

import {
  AlertTriangle,
  GraduationCap,
  Loader2,
  UserMinus,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type {
  ClassRosterStudent,
} from "../services/queries"

import {
  endStudentPlacement,
} from "../services/actions"

import {
  initialEndEnrollmentState,
} from "../services/action-states"

type Props = {
  students: ClassRosterStudent[]
  total: number
  className: string
}

function EndPlacementButton({
  student,
}: {
  student: ClassRosterStudent
}) {
  const router = useRouter()

  const [open, setOpen] = useState(false)

  const [state, action, pending] =
    useActionState(
      endStudentPlacement,
      initialEndEnrollmentState
    )

  useEffect(() => {
    if (state.ok) {
      setOpen(false)
      router.refresh()
    }
  }, [state, router])

  const fullName = [
    student.last_name,
    student.first_name,
    student.other_names,
  ].filter(Boolean).join(" ")

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <UserMinus className="size-4" />
        Remove
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`end-title-${student.enrollment_id}`}
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 shrink-0 text-amber-600" />

                <h3
                  id={`end-title-${student.enrollment_id}`}
                  className="font-semibold"
                >
                  End Class Placement
                </h3>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="shadow-none"
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="mt-3 text-sm font-semibold">
              {fullName}
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The student will be removed from
              the active register. Their registration,
              previous placements, results and
              report cards will remain in the school
              records.
            </p>

            <form
              action={action}
              className="mt-4 space-y-4"
            >
              <input
                type="hidden"
                name="enrollmentId"
                value={student.enrollment_id}
              />

              <div className="space-y-2">
                <Label htmlFor={`left-on-${student.enrollment_id}`}>
                  Effective end date
                </Label>

                <Input
                  id={`left-on-${student.enrollment_id}`}
                  type="date"
                  name="leftOn"
                  min={student.enrolled_on}
                  defaultValue={student.enrolled_on}
                  required
                  className="shadow-none"
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Choose a date within the academic
                  session, on or after the student's
                  enrollment date.
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs leading-5">
                  If the student is moving to another
                  class in the same session, use
                  a class transfer instead.
                </p>
              </div>

              {state.message && !state.ok && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/5 p-3 text-xs text-destructive"
                >
                  {state.message}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="shadow-none"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={pending}
                  className="shadow-none"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserMinus className="size-4" />
                  )}

                  {pending
                    ? "Ending placement..."
                    : "Confirm Removal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function ClassRegister({
  students,
  total,
  className,
}: Props) {
  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-none">
      <CardHeader className="border-b bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <GraduationCap className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base">
                Class Register
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                {className}
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
            {total} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {students.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 size-8 text-primary" />

            <p className="text-sm font-semibold">
              No students found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Enroll students into this class
              to build its register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Student
                  </th>
                  <th className="px-4 py-3 font-medium">
                    School ID
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Enrolled On
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {students.map((student) => (
                  <tr
                    key={student.enrollment_id}
                    className="hover:bg-primary/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {student.last_name}{" "}
                        {student.first_name}
                      </p>

                      {student.other_names && (
                        <p className="text-xs text-muted-foreground">
                          {student.other_names}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {student.admission_number ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {student.enrolled_on}
                    </td>

                    <td className="px-4 py-3">
                      {student.enrollment_status === "active" ? (
                        <EndPlacementButton
                          student={student}
                        />
                      ) : (
                        <Badge variant="secondary">
                          {student.enrollment_status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
