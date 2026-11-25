
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Globe2,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { PublicExamJoinForm } from
  "@/features/exams/attempts/components/PublicExamJoinForm"

import { ExamNumberLoginForm } from
  "@/features/exams/attempts/components/ExamNumberLoginForm"

 

import type {
  ExamEntryPreview,
  ExamAccessMode,
} from "@/features/exams/public/services/exam-entry-access"
import { RegisteredExamLoginForm } from "./RegisteredExamLoginForm"

type ExamStatus = "open" | "upcoming" | "closed"

type Props = {
  code: string
  exam: ExamEntryPreview
  status: ExamStatus
}

const modeDetails: Record<
  ExamAccessMode,
  {
    label: string
    heading: string
    icon: typeof UserRound
    style: string
  }
> = {
  registered: {
    label: "Registered Students",
    heading: "Sign in with your school account",
    icon: UserRound,
    style:
      "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  },
  access_code: {
    label: "Exam Number Access",
    heading: "Enter your examination credentials",
    icon: KeyRound,
    style:
      "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  open_link: {
    label: "Public Examination",
    heading: "Join this examination",
    icon: Globe2,
    style:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value))
}

function ExamAccessForm({
  code,
  mode,
}: {
  code: string
  mode: ExamAccessMode
}) {
  switch (mode) {
    case "registered":
      return <RegisteredExamLoginForm code={code} />

    case "access_code":
      return <ExamNumberLoginForm code={code} />

    case "open_link":
      return <PublicExamJoinForm code={code} />
  }
}

export function ExamEntryScreen({
  code,
  exam,
  status,
}: Props) {
  // Route validation guarantees these fields are present.
  const mode = exam.mode!
  const details = modeDetails[mode]
  const AccessIcon = details.icon

  const duration = Math.max(
    1,
    Math.ceil((exam.duration_seconds ?? 3600) / 60)
  )

  const isOpen = status === "open"

  return (
    <main className="relative min-h-screen overflow-hidden bg-muted/20 px-4 py-8 sm:py-12">
      {/* Subtle background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-blue-500/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-40 size-72 rounded-full bg-violet-500/5 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-2xl space-y-5">
        {/* Examination branding */}
        <header className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <GraduationCap className="size-7" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className={`gap-1.5 ${details.style}`}
            >
              <AccessIcon className="size-3.5" />
              {details.label}
            </Badge>

            <Badge
              variant="outline"
              className={
                isOpen
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              }
            >
              {isOpen
                ? "Entry Open"
                : status === "upcoming"
                  ? "Opens Soon"
                  : "Entry Closed"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="mx-auto max-w-xl text-sm leading-6 text-foreground/75">
                {exam.description}
              </p>
            )}
          </div>
        </header>

        {/* Examination facts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <Clock3 className="size-4" />
              Duration
            </div>
            <p className="mt-2 text-lg font-bold">
              {duration} minutes
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CalendarClock className="size-4" />
              Availability
            </div>

            <p className="mt-2 text-sm font-bold">
              {isOpen
                ? "Open for entry"
                : status === "upcoming"
                  ? "Not started"
                  : "Closed"}
            </p>
          </div>
        </div>

        {/* Entry card */}
        <Card className="gap-0 overflow-hidden border-blue-500/15 py-0 shadow-none">
          <div className="flex items-center gap-3 border-b bg-blue-500/5 px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <ClipboardList className="size-4.5" />
            </span>

            <div>
              <h2 className="text-sm font-bold">
                Examination Entry
              </h2>
              <p className="text-xs text-foreground/70">
                Review the instructions before continuing.
              </p>
            </div>
          </div>

          <CardContent className="space-y-4 p-5">
            {/* Published examination instructions */}
            {exam.instructions && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-600" />
                  <h3 className="text-sm font-bold">
                    Instructions
                  </h3>
                </div>

                <p className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-3.5 text-sm leading-6 text-foreground/80">
                  {exam.instructions}
                </p>
              </section>
            )}

            {/* Authentication or availability notice */}
            <section className="space-y-4  ">
              {isOpen ? (
                <>
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="size-4 text-violet-600" />
                    <h3 className="text-base font-bold">
                      {details.heading}
                    </h3>
                  </div>

                  <ExamAccessForm
                    code={code}
                    mode={mode}
                  />
                </>
              ) : (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />

                    <div className="space-y-1">
                      <p className="text-sm font-bold">
                        {status === "upcoming"
                          ? "The examination has not opened"
                          : "The examination is closed"}
                      </p>

                      <p className="text-xs leading-5 text-foreground/80">
                        {status === "upcoming"
                          ? `You can enter from ${formatDate(exam.available_from!)} (Lagos time).`
                          : `The examination closed on ${formatDate(exam.available_until!)} (Lagos time).`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </CardContent>
        </Card>

        {/* Reassurance and examination guidance */}
        <footer className="space-y-2 text-center">
          

          <p className="text-xs leading-5 text-foreground/65">
            Keep this page open until your examination session
            is ready. Do not share individual login credentials.
          </p>
        </footer>
      </div>
    </main>
  )
}
