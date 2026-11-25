
"use client"

import Link from "next/link"
import {
  ArrowRight, CheckCircle2, Info, KeyRound,
  Link2, ShieldAlert, UserRoundCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ExamAccessMode } from "../../services/queries"

type Props = {
  examSlug: string
  value: ExamAccessMode | null
  onChange: (mode: ExamAccessMode) => void
  currentAccessMode?: ExamAccessMode | null
  published: boolean
  disabled?: boolean
  isSchoolExam?: boolean
}

export const examAccessLabels: Record<ExamAccessMode, string> = {
  access_code: "Exam Number",
  open_link: "Public Link",
  registered: "Registered Accounts",
}

export function ExamPublicationAccessGuide({
  examSlug, value, onChange, currentAccessMode = null,
  published, disabled = false, isSchoolExam = false,
}: Props) {
  const person = isSchoolExam ? "students" : "candidates"
  const changed = published && !!currentAccessMode &&
    !!value && value !== currentAccessMode

  const methods = [
    {
      id: "registered" as const,
      icon: UserRoundCheck,
      title: isSchoolExam ? "Student Sign-in" : "Registered Accounts",
      description: isSchoolExam
        ? "Students use their school accounts. Exam eligibility must also be assigned."
        : "Registered candidates sign in to access eligible tests.",
      color: "violet",
      recommended: isSchoolExam,
    },
    {
      id: "access_code" as const,
      icon: KeyRound,
      title: "Exam Number",
      description: "Participants enter with individual examination numbers.",
      color: "blue",
      recommended: false,
    },
    {
      id: "open_link" as const,
      icon: Link2,
      title: "Public Link",
      description: "Participants use a shared link and enter their details.",
      color: "emerald",
      recommended: false,
    },
  ]

  const styles = {
    violet: {
      selected: "border-violet-500 bg-violet-500/10",
      icon: "bg-violet-600",
    },
    blue: {
      selected: "border-blue-500 bg-blue-500/10",
      icon: "bg-blue-600",
    },
    emerald: {
      selected: "border-emerald-500 bg-emerald-500/10",
      icon: "bg-emerald-600",
    },
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold">
          How will {person} access this {isSchoolExam ? "examination" : "test"}?
        </h2>
        <p className="mt-1 text-xs text-foreground/80">
          Select the access method for the revision being published.
        </p>
      </div>

      <div role="radiogroup" aria-label="Examination access" className="grid gap-2 md:grid-cols-3">
        {methods.map(method => {
          const Icon = method.icon
          const selected = value === method.id
          const style = styles[method.color as keyof typeof styles]

          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(method.id)}
              className={`rounded-xl border p-3 text-left transition-colors shadow-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                disabled:opacity-50 ${selected ? style.selected : "bg-background hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className={`flex size-9 items-center justify-center rounded-lg text-white ${style.icon}`}>
                  <Icon className="size-4" />
                </div>
                {selected
                  ? <CheckCircle2 className="size-5 text-emerald-600" />
                  : <span className="size-4 rounded-full border-2 border-foreground/30" />}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-bold">{method.title}</p>
                {method.recommended && (
                  <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                    Recommended
                  </span>
                )}
                {published && currentAccessMode === method.id && (
                  <Badge variant="outline" className="text-[10px]">Current</Badge>
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-foreground/80">
                {method.description}
              </p>
            </button>
          )
        })}
      </div>

      {isSchoolExam && value !== "registered" && value !== null && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-foreground/90">
            <strong>School access warning:</strong> This method does not by itself
            restrict participants to the selected class arms. Use registered
            student access for formal school examinations.
          </p>
        </div>
      )}

      {value === "registered" && (
        <div className="flex gap-2 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
          <UserRoundCheck className="mt-0.5 size-4 shrink-0 text-violet-600" />
          <p className="text-xs leading-5">
            {isSchoolExam
              ? "After publishing, assign eligible enrolled students from the covered classes. Account sign-in alone is not proof of exam eligibility."
              : "After publishing, verify registered candidate eligibility and assignments."}
          </p>
        </div>
      )}

      {changed && (
        <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5">
            Changing access mode affects the next publication only.
            Previous candidate assignments, links and exam numbers
            do not automatically transfer.
          </p>
        </div>
      )}

      {published && !changed && (
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <span className="text-xs text-foreground/80">
            Manage the current revision's participants.
          </span>
          <Button asChild variant="outline" size="sm" className="shadow-none">
            <Link href={`/exams/${encodeURIComponent(examSlug)}/candidates`}>
              {isSchoolExam ? "Student Assignment" : "Candidates"}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
 