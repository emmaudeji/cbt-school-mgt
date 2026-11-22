
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Loader2, UserRoundPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { InputField } from "@/components/shared/InputField"
import { urls } from "@/constants"
import { createStudent } from "../services/student-actions.ts.js"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Form = {
  first_name: string
  last_name: string
  other_names: string
  admission_number: string
}

const EMPTY_FORM: Form = {
  first_name: "",
  last_name: "",
  other_names: "",
  admission_number: "",
}

export default function StudentRegistrationDrawer({
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<Form>(EMPTY_FORM)

  function update(field: keyof Form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function close() {
    if (pending) return

    setForm(EMPTY_FORM)
    onOpenChange(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Enter the student's first and last names.")
      return
    }

    startTransition(async () => {
      try {
        const result = await createStudent(form)

        if (result.error || !result.data) {
          toast.error(
            result.error ?? "Unable to register student."
          )
          return
        }

        toast.success(
          result.successMessage ??
            "Student registered successfully."
        )

        setForm(EMPTY_FORM)
        onOpenChange(false)

        // Continue to the student's permanent profile.
        router.push(urls.studentDetails(result.data.id))
      } catch {
        toast.error("Unable to register student.")
      }
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close()
        } else {
          onOpenChange(true)
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRoundPlus className="size-5" />
          </div>

          <SheetTitle>Register Student</SheetTitle>

          <SheetDescription>
            Create a permanent student record. Class
            placement and guardian details can be added later.
          </SheetDescription>
        </SheetHeader>

        <form
          id="register-student-form"
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div>
              <h3 className="text-sm font-semibold">
                Personal Information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Only fields marked with an asterisk are required.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                name="first_name"
                label="First Name"
                value={form.first_name}
                onChange={(event) =>
                  update("first_name", event.target.value)
                }
                placeholder="First name"
                autoComplete="given-name"
                maxLength={100}
                disabled={pending}
                required
              />

              <InputField
                name="last_name"
                label="Last Name"
                value={form.last_name}
                onChange={(event) =>
                  update("last_name", event.target.value)
                }
                placeholder="Surname"
                autoComplete="family-name"
                maxLength={100}
                disabled={pending}
                required
              />
            </div>

            <InputField
              name="other_names"
              label="Other Names"
              value={form.other_names}
              onChange={(event) =>
                update("other_names", event.target.value)
              }
              placeholder="Middle or other names"
              maxLength={150}
              disabled={pending}
            />

            <InputField
              name="admission_number"
              label="Admission Number"
              description="Optional. Must be unique within the school."
              value={form.admission_number}
              onChange={(event) =>
                update("admission_number", event.target.value)
              }
              placeholder="e.g. ESI/2026/001"
              maxLength={80}
              disabled={pending}
            />

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                What happens next?
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                After registration, you can complete the
                {"student's "}private profile and add guardians.
                Class enrollment will be managed separately
                for each academic session.
              </p>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={pending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={pending}
            >
              {pending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {pending ? "Registering..." : "Register Student"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
