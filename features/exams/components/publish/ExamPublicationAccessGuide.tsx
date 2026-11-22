
"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Info,
  KeyRound,
  Link2,
  UserRoundCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useOrgStore } from "@/store/org-store"

import type { ExamAccessMode } from "../../services/queries"

type Props = {
  examSlug: string
  value: ExamAccessMode | null
  onChange: (mode: ExamAccessMode) => void
  currentAccessMode?: ExamAccessMode | null
  published: boolean
  disabled?: boolean
}

export const examAccessLabels: Record<ExamAccessMode, string> = {
  access_code: "Exam Number",
  open_link: "Public Exam Link",
  registered: "Account Sign-in",
}

export function ExamPublicationAccessGuide({
  examSlug,
  value,
  onChange,
  currentAccessMode = null,
  published,
  disabled = false,
}: Props) {
  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const person = isSchool ? "student" : "candidate"
  const people = isSchool ? "students" : "candidates"

  const candidatesHref =
    `/exams/${encodeURIComponent(examSlug)}/candidates`

  const methods = [
    {
      id: "access_code" as const,
      title: "Exam Number",
      icon: KeyRound,
      description:
        `Each ${person} uses a unique six-character Exam Number to enter the examination.`,
      nextStep:
        `After publishing, assign ${people} and download their Exam Numbers.`,
      color: "text-sky-700 dark:text-sky-300",
      background: "bg-sky-500/10",
    },
    {
      id: "open_link" as const,
      title: "Public Exam Link",
      icon: Link2,
      description:
        `Participants open a shared examination link and enter their names.`,
      nextStep:
        "After publishing, copy the examination link and share it with participants.",
      color: "text-emerald-700 dark:text-emerald-300",
      background: "bg-emerald-500/10",
    },
    {
      id: "registered" as const,
      title: "Account Sign-in",
      icon: UserRoundCheck,
      description:
        `Only eligible ${people} using their registered accounts can enter.`,
      nextStep:
        `After publishing, confirm which registered ${people} are eligible.`,
      color: "text-violet-700 dark:text-violet-300",
      background: "bg-violet-500/10",
    },
  ]

  const selectedMethod = methods.find(
    method => method.id === value
  )

  const changingMethod =
    published &&
    currentAccessMode !== null &&
    value !== null &&
    currentAccessMode !== value

  return (
    <section
      className="space-y-4"
      aria-labelledby="exam-access-heading"
    >
      <div className="space-y-1">
        <h2
          id="exam-access-heading"
          className="text-base font-bold tracking-tight text-foreground"
        >
          How will {people} access this examination?
        </h2>

        <p className="text-sm leading-6 text-foreground/85">
          Choose one access method for the examination you
          are about to publish.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Examination access method"
        className="grid gap-3 md:grid-cols-3"
      >
        {methods.map(method => {
          const Icon = method.icon
          const selected = value === method.id

          const current =
            published &&
            currentAccessMode === method.id

          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(method.id)}
              className={[
                "flex h-full flex-col rounded-xl border p-4",
                "text-left transition-colors shadow-none",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary",
                "focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-primary/20 bg-background hover:border-primary/50 hover:bg-primary/[0.025]",
              ].join(" ")}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${method.background}`}
                >
                  <Icon className={`size-5 ${method.color}`} />
                </div>

                <div className="flex items-center gap-1.5">
                  {current && (
                    <Badge
                      variant="outline"
                      className="border-primary/25 bg-background text-[10px] font-semibold text-foreground"
                    >
                      Current
                    </Badge>
                  )}

                  {selected ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-5 rounded-full border-2 border-foreground/35"
                    />
                  )}
                </div>
              </div>

              <h3 className="mt-4 text-sm font-bold text-foreground">
                {method.title}
              </h3>

              <p className="mt-2 flex-1 text-sm leading-6 text-foreground/85">
                {method.description}
              </p>

              <div
                className={`mt-4 rounded-md px-2.5 py-1.5 text-xs font-bold ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/5 text-foreground/75"
                }`}
              >
                {selected ? "Selected" : "Choose this method"}
              </div>
            </button>
          )
        })}
      </div>

      {selectedMethod ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold text-foreground">
              Selected: {selectedMethod.title}
            </p>

            <p className="text-sm leading-6 text-foreground/90">
              {selectedMethod.nextStep}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-300" />

          <p className="text-sm font-semibold text-foreground">
            Select an access method to continue publishing.
          </p>
        </div>
      )}

      {changingMethod && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-300" />

          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Access method changed for the next revision
            </p>

            <p className="text-sm leading-6 text-foreground/90">
              The existing published revision keeps its
              current access method. Your new choice will
              apply to the revision you publish next.
              Existing candidate assignments and Exam Numbers
              will not automatically transfer.
            </p>
          </div>
        </div>
      )}

      {published && !changingMethod && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground/80">
            Manage access for the existing published revision.
          </p>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="shadow-none"
          >
            <Link href={candidatesHref}>
              Exam Candidates
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
