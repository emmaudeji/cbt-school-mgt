
"use client"

import { useState, useTransition } from "react"
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
import {
  EMPTY_REGISTRATION,
  type RegistrationField,
  type RegistrationRow,
} from "../services/registration-fields"
import { registerStudentFull } from "../services/student-registration"
import { urls } from "@/constants"

type FieldProps = {
  label: string
  name: RegistrationField
  value: string
  onChange: (field: RegistrationField, value: string) => void
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
          <span className="text-destructive"> *</span>
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

export default function StudentRegistrationForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<RegistrationRow>(
    { ...EMPTY_REGISTRATION }
  )

  function update(
    field: RegistrationField,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    startTransition(async () => {
      const result = await registerStudentFull(form)

      if (result.error || !result.data) {
        toast.error(
          result.error ?? "Unable to register student."
        )
        return
      }

      const student = result.data.students[0]

      toast.success("Student registered successfully.")
      router.push(urls.studentDetails(student.id))
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-primary" />
            <CardTitle className="text-base">
              Student Identity
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Permanent information used throughout the school.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <Field
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={update}
            required
            disabled={pending}
          />
          <Field
            label="Surname"
            name="last_name"
            value={form.last_name}
            onChange={update}
            required
            disabled={pending}
          />
          <Field
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Admission Number"
            name="admission_number"
            value={form.admission_number}
            onChange={update}
            placeholder="ESI/2026/001"
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <CardTitle className="text-base">
              Personal Information
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional private information. Complete it now or later.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <Field
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={update}
            disabled={pending}
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Gender</span>
            <select
              value={form.gender}
              disabled={pending}
              onChange={(event) =>
                update("gender", event.target.value)
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <Field
              label="Residential Address"
              name="residential_address"
              value={form.residential_address}
              onChange={update}
              disabled={pending}
            />
          </div>

          <Field
            label="Previous School"
            name="previous_school_name"
            value={form.previous_school_name}
            onChange={update}
            disabled={pending}
          />

          <Field
            label="Previous School Address"
            name="previous_school_address"
            value={form.previous_school_address}
            onChange={update}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-primary" />
            <CardTitle className="text-base">
              Parent / Guardian
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional. The guardian will become the student's
            primary and emergency contact.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <Field
            label="Guardian First Name"
            name="guardian_first_name"
            value={form.guardian_first_name}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Guardian Surname"
            name="guardian_last_name"
            value={form.guardian_last_name}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Relationship"
            name="guardian_relationship"
            value={form.guardian_relationship}
            onChange={update}
            placeholder="Mother, Father, Guardian..."
            disabled={pending}
          />
          <Field
            label="Phone Number"
            name="guardian_phone"
            type="tel"
            value={form.guardian_phone}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Alternate Phone"
            name="guardian_alternate_phone"
            type="tel"
            value={form.guardian_alternate_phone}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Email"
            name="guardian_email"
            type="email"
            value={form.guardian_email}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Occupation"
            name="guardian_occupation"
            value={form.guardian_occupation}
            onChange={update}
            disabled={pending}
          />
          <Field
            label="Guardian Address"
            name="guardian_address"
            value={form.guardian_address}
            onChange={update}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-center justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          Registration does not assign a class.
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {pending ? "Registering..." : "Register Student"}
        </Button>
      </div>
    </form>
  )
}
