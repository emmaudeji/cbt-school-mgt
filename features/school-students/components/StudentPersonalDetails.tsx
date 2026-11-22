
import { Pencil, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { StudentProfile } from "@/types/students"

type Props = {
  profile: StudentProfile
  canManage: boolean
  onEdit: () => void
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium">
        {value || "Not provided"}
      </dd>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return null

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export default function StudentPersonalDetails({
  profile,
  canManage,
  onEdit,
}: Props) {
  const { student, details } = profile

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4 sm:px-5">
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-primary" />
          <CardTitle className="text-base">
            Personal Information
          </CardTitle>
        </div>

        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Info
            label="First Name"
            value={student.first_name}
          />
          <Info
            label="Surname"
            value={student.last_name}
          />
          <Info
            label="Other Names"
            value={student.other_names}
          />
          <Info
            label="Gender"
            value={
              details?.gender
                ? details.gender[0].toUpperCase() +
                  details.gender.slice(1)
                : null
            }
          />
          <Info
            label="Date of Birth"
            value={formatDate(details?.date_of_birth)}
          />
          <Info
            label="Account"
            value={
              student.membership_id
                ? "Linked"
                : "Not linked"
            }
          />

          <div className="sm:col-span-2">
            <Info
              label="Residential Address"
              value={details?.residential_address}
            />
          </div>

          <Info
            label="Previous School"
            value={details?.previous_school_name}
          />

          <div className="sm:col-span-2">
            <Info
              label="Previous School Address"
              value={details?.previous_school_address}
            />
          </div>
        </dl>

        {!details && (
          <p className="mt-5 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            No additional personal information is
            available to your account.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
