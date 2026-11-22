
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type {
  StudentDetailsInput,
  StudentProfile,
} from "@/types/students"

import type { StudentEditMode } from "./StudentProfileWorkspace"
import { saveStudentDetails, updateStudent } from "../services/student-actions.ts"

type Props = {
  mode: StudentEditMode
  profile: StudentProfile
  onClose: () => void
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}

export default function StudentEditDrawer({
  mode,
  profile,
  onClose,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const { student, details } = profile

  const [identity, setIdentity] = useState({
    first_name: student.first_name,
    last_name: student.last_name,
    other_names: student.other_names ?? "",
    admission_number: student.admission_number ?? "",
  })

  const [personal, setPersonal] =
    useState<StudentDetailsInput>({
      date_of_birth: details?.date_of_birth ?? null,
      gender: details?.gender ?? null,
      photo_path: details?.photo_path ?? null,
      residential_address:
        details?.residential_address ?? null,
      previous_school_name:
        details?.previous_school_name ?? null,
      previous_school_address:
        details?.previous_school_address ?? null,
    })

  function updateIdentity(
    field: keyof typeof identity,
    value: string
  ) {
    setIdentity((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updatePersonal<K extends keyof StudentDetailsInput>(
    field: K,
    value: StudentDetailsInput[K]
  ) {
    setPersonal((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mode || pending) return

    startTransition(async () => {
      try {
        const result =
          mode === "identity"
            ? await updateStudent(student.id, identity)
            : await saveStudentDetails(student.id, personal)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success(
          result.successMessage ?? "Student updated."
        )

        onClose()
        router.refresh()
      } catch {
        toast.error("Unable to save student information.")
      }
    })
  }

  return (
    <Sheet
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle>
            {mode === "identity"
              ? "Edit Student Identity"
              : "Edit Personal Information"}
          </SheetTitle>

          <SheetDescription>
            {mode === "identity"
              ? "Update the student's permanent identity and admission information."
              : "Complete or correct the student's private personal information."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {mode === "identity" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="First Name"
                    value={identity.first_name}
                    onChange={(value) =>
                      updateIdentity("first_name", value)
                    }
                    required
                  />

                  <Field
                    label="Surname"
                    value={identity.last_name}
                    onChange={(value) =>
                      updateIdentity("last_name", value)
                    }
                    required
                  />
                </div>

                <Field
                  label="Other Names"
                  value={identity.other_names}
                  onChange={(value) =>
                    updateIdentity("other_names", value)
                  }
                />

                <Field
                  label="Admission Number"
                  value={identity.admission_number}
                  onChange={(value) =>
                    updateIdentity("admission_number", value)
                  }
                />

                <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Admission numbers must be unique within
                  the school. Changing a student's identity
                  does not affect their enrollment history.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Date of Birth"
                    type="date"
                    value={personal.date_of_birth ?? ""}
                    onChange={(value) =>
                      updatePersonal(
                        "date_of_birth",
                        value || null
                      )
                    }
                  />

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">
                      Gender
                    </span>

                    <select
                      value={personal.gender ?? ""}
                      onChange={(event) =>
                        updatePersonal(
                          "gender",
                          (event.target.value ||
                            null) as StudentDetailsInput["gender"]
                        )
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    Residential Address
                  </span>

                  <textarea
                    value={personal.residential_address ?? ""}
                    onChange={(event) =>
                      updatePersonal(
                        "residential_address",
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>

                <Field
                  label="Previous School"
                  value={personal.previous_school_name ?? ""}
                  onChange={(value) =>
                    updatePersonal(
                      "previous_school_name",
                      value
                    )
                  }
                />

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    Previous School Address
                  </span>

                  <textarea
                    value={
                      personal.previous_school_address ?? ""
                    }
                    onChange={(event) =>
                      updatePersonal(
                        "previous_school_address",
                        event.target.value
                      )
                    }
                    rows={2}
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>

                <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Student photographs will be managed
                  through private Supabase Storage when
                  the upload workflow is implemented.
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {pending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
