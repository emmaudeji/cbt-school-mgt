
"use client"

import {
  useState,
  useTransition,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import {
  GraduationCap,
  Loader2,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { urls } from "@/constants"

import {
  EMPTY_REGISTRATION,
  type RegistrationField,
  type RegistrationRow,
} from "../services/registration-fields"

import {
  registerStudentFull,
} from "../services/student-registration"

import {
  updateStudentAdmission,
} from "../services/student-edit-actions"

import type {
  StudentRegistrationEditData,
} from "../services/student-edit-queries"

type Props = {
  editData?: StudentRegistrationEditData
}

type FieldProps = {
  label: string
  name: RegistrationField
  value: string
  onChange: (
    field: RegistrationField,
    value: string
  ) => void
  required?: boolean
  type?: string
  placeholder?: string
  disabled?: boolean
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  disabled,
}: FieldProps) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive">
            {" "}*
          </span>
        )}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(name, event.target.value)
        }
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50"
      />
    </label>
  )
}

const identityFields: {
  label: string
  name: RegistrationField
  required?: boolean
  placeholder?: string
}[] = [
  {
    label: "First Name",
    name: "first_name",
    required: true,
  },
  {
    label: "Surname",
    name: "last_name",
    required: true,
  },
  {
    label: "Other Names",
    name: "other_names",
  },
  {
    label: "Admission Number",
    name: "admission_number",
    placeholder: "ESI/2026/001",
  },
]

const guardianFields: {
  label: string
  name: RegistrationField
  type?: string
  placeholder?: string
}[] = [
  {
    label: "Guardian First Name",
    name: "guardian_first_name",
  },
  {
    label: "Guardian Surname",
    name: "guardian_last_name",
  },
  {
    label: "Relationship",
    name: "guardian_relationship",
    placeholder: "Mother, Father, Guardian...",
  },
  {
    label: "Phone Number",
    name: "guardian_phone",
    type: "tel",
  },
  {
    label: "Alternate Phone",
    name: "guardian_alternate_phone",
    type: "tel",
  },
  {
    label: "Email",
    name: "guardian_email",
    type: "email",
  },
  {
    label: "Occupation",
    name: "guardian_occupation",
  },
  {
    label: "Guardian Address",
    name: "guardian_address",
  },
]

export default function StudentRegistrationForm({
  editData,
}: Props) {
  const router = useRouter()

  const [pending, startTransition] =
    useTransition()

  const [form, setForm] =
    useState<RegistrationRow>({
      ...EMPTY_REGISTRATION,
      ...(editData?.form ?? {}),
    })

  const isEditing = Boolean(editData)

  function update(
    field: RegistrationField,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (pending) return

    startTransition(async () => {
      try {
        if (editData) {
          const result =
            await updateStudentAdmission(
              editData.studentId,
              form
            )

          if (!result.ok) {
            toast.error(result.message)
            return
          }

          toast.success(result.message)

          router.push(
            urls.studentDetails(
              editData.studentId
            )
          )

          router.refresh()
          return
        }

        const result =
          await registerStudentFull(form)

        if (result.error || !result.data) {
          toast.error(
            result.error ??
              "Unable to register student."
          )
          return
        }

        const student =
          result.data.students[0]

        if (!student) {
          toast.error(
            "Student registration did not return a record."
          )
          return
        }

        toast.success(
          "Student registered successfully."
        )

        router.push(
          urls.studentDetails(student.id)
        )

        router.refresh()
      } catch (error) {
        console.error(
          "[SCHOOL:STUDENT_FORM]",
          error
        )

        toast.error(
          isEditing
            ? "Unable to save student changes."
            : "Unable to register student."
        )
      }
    })
  }

  const fieldProps = (
    name: RegistrationField
  ) => ({
    value: form[name],
    onChange: update,
    disabled: pending,
  })

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
    >
      {/* Student identity */}
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0 shadow-none">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-primary" />

            <CardTitle className="text-base">
              Student Identity
            </CardTitle>
          </div>

          <p className="text-xs text-muted-foreground">
            Permanent information used throughout
            the school.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          {identityFields.map((field) => (
            <Field
              key={field.name}
              {...field}
              {...fieldProps(field.name)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Personal information */}
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0 shadow-none">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />

            <CardTitle className="text-base">
              Personal Information
            </CardTitle>
          </div>

          <p className="text-xs text-muted-foreground">
            Optional private information.
            Complete or update it as required.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <Field
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            {...fieldProps("date_of_birth")}
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Gender
            </span>

            <select
              value={form.gender}
              disabled={pending}
              onChange={(event) =>
                update(
                  "gender",
                  event.target.value
                )
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
            >
              <option value="">
                Not specified
              </option>
              <option value="male">
                Male
              </option>
              <option value="female">
                Female
              </option>
              <option value="other">
                Other
              </option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <Field
              label="Residential Address"
              name="residential_address"
              {...fieldProps(
                "residential_address"
              )}
            />
          </div>

          <Field
            label="Previous School"
            name="previous_school_name"
            {...fieldProps(
              "previous_school_name"
            )}
          />

          <Field
            label="Previous School Address"
            name="previous_school_address"
            {...fieldProps(
              "previous_school_address"
            )}
          />
        </CardContent>
      </Card>

      {/* Guardian information */}
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0 shadow-none">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-primary" />

            <CardTitle className="text-base">
              Parent / Guardian
            </CardTitle>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Optional primary and emergency contact
            information. Editing a guardian shared
            with another student requires separate
            guardian management.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          {guardianFields.map((field) => (
            <Field
              key={field.name}
              {...field}
              {...fieldProps(field.name)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse items-center justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />

          {isEditing
            ? "Existing enrollments, academic records and CBT identity are preserved."
            : "Registration does not assign a class."}
        </div>

        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          {editData && (
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={pending}
              className="shadow-none"
            >
              <Link
                href={urls.studentDetails(
                  editData.studentId
                )}
              >
                Cancel
              </Link>
            </Button>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full shadow-none sm:w-auto"
          >
            {pending && (
              <Loader2 className="size-4 animate-spin" />
            )}

            {pending
              ? isEditing
                ? "Saving changes..."
                : "Registering..."
              : isEditing
                ? "Save Changes"
                : "Register Student"}
          </Button>
        </div>
      </div>
    </form>
  )
}
