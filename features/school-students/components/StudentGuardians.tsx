
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react"

import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type {
  StudentGuardianLink,
} from "@/types/students"
import { createGuardian, findGuardians, GuardianSearchItem, linkStudentGuardian, setPrimaryStudentGuardian } from "../services/student-actions.ts"

type Props = {
  studentId: string
  guardians: StudentGuardianLink[]
  canManage: boolean
}

type GuardianForm = {
  first_name: string
  last_name: string
  phone: string
  email: string
  relationship: string
}

const EMPTY_FORM: GuardianForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  relationship: "Parent",
}

export default function StudentGuardians({
  studentId,
  guardians,
  canManage,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] =
    useState<"existing" | "new">("existing")

  const [pending, startTransition] = useTransition()

  const [search, setSearch] = useState("")
  const [matches, setMatches] = useState<
    GuardianSearchItem[]
  >([])

  const [searched, setSearched] = useState(false)
  const [relationship, setRelationship] = useState("Parent")
  const [form, setForm] = useState(EMPTY_FORM)

  const linkedIds = new Set(
    guardians.map((link) => link.guardian_id)
  )

  const availableMatches = matches.filter(
    (guardian) => !linkedIds.has(guardian.id)
  )

  function finish(message: string) {
    toast.success(message)
    setOpen(false)
    setForm(EMPTY_FORM)
    setMatches([])
    setSearch("")
    setSearched(false)
    router.refresh()
  }

  function searchExisting() {
    if (pending) return

    startTransition(async () => {
      const result = await findGuardians(search)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setMatches(result.data ?? [])
      setSearched(true)
    })
  }

  function linkExisting(guardianId: string) {
    startTransition(async () => {
      const result = await linkStudentGuardian({
        student_id: studentId,
        guardian_id: guardianId,
        relationship: relationship.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      finish("Guardian linked to student.")
    })
  }

  function createAndLink() {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.relationship.trim()
    ) {
      toast.error(
        "Guardian names and relationship are required."
      )
      return
    }

    startTransition(async () => {
      const created = await createGuardian({
        first_name: form.first_name,
        last_name: form.last_name,
        other_names: null,
        phone: form.phone || null,
        alternate_phone: null,
        email: form.email || null,
        residential_address: null,
        occupation: null,
      })

      if (created.error || !created.data) {
        toast.error(
          created.error ?? "Unable to create guardian."
        )
        return
      }

      const linked = await linkStudentGuardian({
        student_id: studentId,
        guardian_id: created.data.id,
        relationship: form.relationship,
      })

      if (linked.error) {
        toast.error(
          `Guardian created but not linked: ${linked.error}`
        )
        return
      }

      finish("Guardian added successfully.")
    })
  }

  function makePrimary(linkId: string) {
    startTransition(async () => {
      const result = await setPrimaryStudentGuardian(
        linkId
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Primary guardian updated.")
      router.refresh()
    })
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4 sm:px-5">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-primary" />

            <CardTitle className="text-base">
              Guardians & Contacts
            </CardTitle>
          </div>

          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
            >
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3 p-4 sm:p-5">
          {guardians.length === 0 ? (
            <div className="py-8 text-center">
              <UsersRound className="mx-auto size-9 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                No accessible guardians
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Linked guardian contact information
                will appear here.
              </p>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Guardian
                </Button>
              )}
            </div>
          ) : (
            guardians.map((link) => {
              const guardian = link.guardian

              if (!guardian) return null

              return (
                <div
                  key={link.id}
                  className="space-y-3 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {guardian.first_name}{" "}
                        {guardian.last_name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.relationship}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {link.is_primary && (
                        <Badge variant="default">
                          Primary
                        </Badge>
                      )}

                      {link.is_emergency_contact && (
                        <Badge variant="secondary">
                          Emergency
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    {guardian.phone && (
                      <a
                        href={`tel:${guardian.phone}`}
                        className="block break-all text-primary hover:underline"
                      >
                        {guardian.phone}
                      </a>
                    )}

                    {guardian.email && (
                      <a
                        href={`mailto:${guardian.email}`}
                        className="block break-all text-muted-foreground hover:underline"
                      >
                        {guardian.email}
                      </a>
                    )}

                    {guardian.residential_address && (
                      <p className="text-xs text-muted-foreground">
                        {guardian.residential_address}
                      </p>
                    )}
                  </div>

                  {canManage && !link.is_primary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => makePrimary(link.id)}
                    >
                      <ShieldCheck className="size-4" />
                      Set as Primary
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Sheet
          open={open}
          onOpenChange={(next) => {
            if (!pending) setOpen(next)
          }}
        >
          <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
            <SheetHeader className="border-b px-5 py-5 text-left">
              <SheetTitle>Add Guardian</SheetTitle>
              <SheetDescription>
                Link an existing guardian or register
                a new contact.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2">
                {(["existing", "new"] as const).map(
                  (value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={
                        tab === value
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setTab(value)}
                    >
                      {value === "existing"
                        ? "Existing Guardian"
                        : "New Guardian"}
                    </Button>
                  )
                )}
              </div>

              {tab === "existing" ? (
                <div className="space-y-4">
                  <Field
                    label="Relationship"
                    value={relationship}
                    onChange={setRelationship}
                    required
                  />

                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      searchExisting()
                    }}
                    className="flex gap-2"
                  >
                    <input
                      aria-label="Search guardians"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setSearched(false)
                      }}
                      placeholder="Name or phone"
                      className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                    />

                    <Button
                      type="submit"
                      disabled={pending || search.trim().length < 2}
                    >
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      Search
                    </Button>
                  </form>

                  {searched && availableMatches.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No unlinked matching guardians found.
                    </p>
                  )}

                  {availableMatches.map((guardian) => (
                    <div
                      key={guardian.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {guardian.first_name}{" "}
                          {guardian.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {guardian.phone ?? "No phone"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        disabled={
                          pending ||
                          !relationship.trim()
                        }
                        onClick={() =>
                          linkExisting(guardian.id)
                        }
                      >
                        <Check className="size-4" />
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    createAndLink()
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="First Name"
                      value={form.first_name}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          first_name: value,
                        }))
                      }
                      required
                    />
                    <Field
                      label="Surname"
                      value={form.last_name}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          last_name: value,
                        }))
                      }
                      required
                    />
                  </div>

                  <Field
                    label="Relationship"
                    value={form.relationship}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        relationship: value,
                      }))
                    }
                    required
                  />

                  <Field
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: value,
                      }))
                    }
                    type="tel"
                  />

                  <Field
                    label="Email"
                    value={form.email}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        email: value,
                      }))
                    }
                    type="email"
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={pending}
                  >
                    {pending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Create & Link Guardian
                  </Button>
                </form>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
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
        {required && " *"}
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
