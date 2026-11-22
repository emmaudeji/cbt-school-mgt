
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  StudentProfileData,
} from "../services/student-profile-queries"
import { LinkButton } from "@/components/shared/LinkButton"
import { urls } from "@/constants"

type Tab =
  | "admission"
  | "history"
  | "cbt"
  | "assessments"
  | "reports"

type Props = {
  data: StudentProfileData
}

const tabs: {
  value: Tab
  label: string
}[] = [
  { value: "admission", label: "Admission" },
  { value: "history", label: "Class History" },
  { value: "cbt", label: "CBT Results" },
  { value: "assessments", label: "Assessments" },
  { value: "reports", label: "Report Cards" },
]

function formatDate(value?: string | null) {
  if (!value) return "Not recorded"

  const date = new Date(
    value.length === 10
      ? `${value}T12:00:00Z`
      : value
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function show(value?: string | null) {
  return value?.trim() || "Not recorded"
}

function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <BookOpen className="mx-auto mb-3 size-7 text-muted-foreground" />

      <p className="text-sm font-semibold">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium">
        {value}
      </dd>
    </div>
  )
}

function SectionTitle({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof BookOpen
}) {
  return (
    <CardHeader className="border-b bg-primary/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <CardTitle className="text-base">
            {title}
          </CardTitle>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </CardHeader>
  )
}

export function StudentProfile({ data }: Props) {
  const [tab, setTab] = useState<Tab>("admission")

  const defaultSession =
    data.sessions.find((s) => s.is_current)?.id ??
    data.enrollments[0]?.sessionId ??
    data.sessions[0]?.id ??
    "all"

  const [sessionId, setSessionId] = useState(
    defaultSession
  )

  const availableTerms = useMemo(
    () =>
      data.terms
        .filter((t) =>
          sessionId === "all"
            ? true
            : t.sessionId === sessionId
        )
        .sort((a, b) => a.position - b.position),
    [data.terms, sessionId]
  )

  const [termId, setTermId] = useState("all")

  const currentEnrollment =
    data.enrollments.find(
      (e) =>
        e.status === "active" &&
        data.sessions.some(
          (s) =>
            s.id === e.sessionId &&
            s.is_current
        )
    ) ??
    data.enrollments.find(
      (e) => e.status === "active"
    )

  const enrolledSessions = new Set(
    data.enrollments.map((e) => e.sessionId)
  ).size

  const fullName = [
    data.student.last_name,
    data.student.first_name,
    data.student.other_names,
  ].filter(Boolean).join(" ")

  const assessmentRows = data.assessments.filter(
    (item) =>
      (sessionId === "all" ||
        item.sessionId === sessionId) &&
      (termId === "all" ||
        item.termId === termId)
  )

  const reportRows = data.reportCards
    .filter(
      (item) =>
        (sessionId === "all" ||
          item.sessionId === sessionId) &&
        (termId === "all" ||
          item.termId === termId)
    )
    .sort((a, b) =>
      (b.publishedAt ?? "").localeCompare(
        a.publishedAt ?? ""
      )
    )

  const termMap = new Map(
    data.terms.map((t) => [t.id, t.name])
  )

  const sessionMap = new Map(
    data.sessions.map((s) => [s.id, s.name])
  )

  function changeSession(value: string) {
    setSessionId(value)
    setTermId("all")
  }

  return (
    <div className="space-y-5">
      {/* Navigation */}
      <div className="flex justify-between">
        <LinkButton
            variant="ghost"
            size="sm"
            href={urls.studentsDirectoryByEnrollment}
            className="shadow-none"
        >
          <ArrowLeft className="size-4" />
          Student Directory
        </LinkButton>

        <LinkButton
            href={urls.studentRegistrationEdit(data.student.id)}
            variant="outline"
            size="sm"
            className="shadow-none"
        >
            <Pencil className="size-4" />
            Edit Admission Details
        </LinkButton>
    </div>
      
    

      {/* Student header */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-8" />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {fullName}
                </h1>

                <Badge variant="secondary">
                  {data.student.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {data.schoolName}
              </p>

              <p className="text-xs text-muted-foreground">
                Admission number:{" "}
                <span className="font-medium text-foreground">
                  {show(data.student.admission_number)}
                </span>
              </p>
            </div>
          </div>

          {/* Quick facts */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                label: "Current Class",
                value:
                  currentEnrollment?.className ??
                  "Not placed",
              },
              {
                label: "Academic Sessions",
                value: String(enrolledSessions),
              },
              {
                label: "CBT Results",
                value: String(data.cbtResults.length),
              },
              {
                label: "Report Cards",
                value: String(data.reportCards.length),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border bg-muted/20 p-3"
              >
                <p className="text-xs text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data warnings */}
      {data.sectionErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="size-4 text-amber-600" />
            Some records are temporarily unavailable
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-6 text-xs">
            {data.sectionErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Student profile sections"
        className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/20 p-1"
      >
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={
              tab === item.value
                ? "shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                : "shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Academic filters */}
      {(tab === "assessments" ||
        tab === "reports" ||
        tab === "history") && (
        <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium">
              Academic Session
            </label>

            <Select
              value={sessionId}
              onValueChange={changeSession}
            >
              <SelectTrigger className="w-full shadow-none">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Sessions
                </SelectItem>

                {data.sessions.map((session) => (
                  <SelectItem
                    key={session.id}
                    value={session.id}
                  >
                    {session.name}
                    {session.is_current
                      ? " · Current"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tab !== "history" && (
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Academic Term
              </label>

              <Select
                value={termId}
                onValueChange={setTermId}
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Terms
                  </SelectItem>

                  {availableTerms.map((term) => (
                    <SelectItem
                      key={term.id}
                      value={term.id}
                    >
                      {term.name}
                      {term.is_current
                        ? " · Current"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Admission details */}
      {tab === "admission" && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="gap-0 overflow-hidden p-0 shadow-none">
            <SectionTitle
              title="Admission Information"
              description="Official student registration details."
              icon={UserRound}
            />

            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 p-4 sm:p-5">
              <Field
                label="Admission Number"
                value={show(data.student.admission_number)}
              />
              <Field
                label="Student Status"
                value={data.student.status}
              />
              <Field
                label="First Name"
                value={data.student.first_name}
              />
              <Field
                label="Last Name"
                value={data.student.last_name}
              />
              <Field
                label="Other Names"
                value={show(data.student.other_names)}
              />
              <Field
                label="Date of Birth"
                value={formatDate(
                  data.details?.date_of_birth
                )}
              />
              <Field
                label="Gender"
                value={show(data.details?.gender)}
              />
              <Field
                label="Registered On"
                value={formatDate(
                  data.student.created_at
                )}
              />
              <div className="col-span-2">
                <Field
                  label="Residential Address"
                  value={show(
                    data.details?.residential_address
                  )}
                />
              </div>
              <Field
                label="Previous School"
                value={show(
                  data.details?.previous_school_name
                )}
              />
              <Field
                label="Previous School Address"
                value={show(
                  data.details?.previous_school_address
                )}
              />
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden p-0 shadow-none">
            <SectionTitle
              title="Parents & Guardians"
              description="Registered guardian and emergency contacts."
              icon={Users}
            />

            <CardContent className="space-y-3 p-4 sm:p-5">
              {data.guardians.length === 0 ? (
                <EmptyState
                  title="No guardians recorded"
                  message="Guardian details have not been linked to this student."
                />
              ) : (
                data.guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="space-y-3 rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {guardian.name}
                      </p>

                      {guardian.primary && (
                        <Badge variant="secondary">
                          Primary
                        </Badge>
                      )}

                      {guardian.emergency && (
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          Emergency
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {show(guardian.relationship)}
                    </p>

                    {guardian.phone && (
                      <a
                        href={`tel:${guardian.phone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Phone className="size-4 text-muted-foreground" />
                        {guardian.phone}
                      </a>
                    )}

                    {guardian.alternatePhone && (
                      <a
                        href={`tel:${guardian.alternatePhone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Phone className="size-4 text-muted-foreground" />
                        {guardian.alternatePhone}
                      </a>
                    )}

                    {guardian.email && (
                      <a
                        href={`mailto:${guardian.email}`}
                        className="flex items-center gap-2 break-all text-sm hover:text-primary"
                      >
                        <Mail className="size-4 text-muted-foreground" />
                        {guardian.email}
                      </a>
                    )}
                  </div>
                ))
              )}

              <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                Contact details come from the school's
                registered guardian records.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enrollment history */}
      {tab === "history" && (
        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <SectionTitle
            title="Enrollment & Class History"
            description="All recorded class placements, including transfers and previous sessions."
            icon={GraduationCap}
          />

          <CardContent className="space-y-3 p-4 sm:p-5">
            {data.enrollments.filter(
              (e) =>
                sessionId === "all" ||
                e.sessionId === sessionId
            ).length === 0 ? (
              <EmptyState
                title="No enrollment history"
                message="No class placements match the selected session."
              />
            ) : (
              data.enrollments
                .filter(
                  (e) =>
                    sessionId === "all" ||
                    e.sessionId === sessionId
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {item.className}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.sessionName}
                        </p>
                      </div>

                      <Badge
                        className={
                          item.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Field
                        label="Enrolled On"
                        value={formatDate(
                          item.enrolledOn
                        )}
                      />

                      <Field
                        label="Left On"
                        value={
                          item.leftOn
                            ? formatDate(item.leftOn)
                            : "—"
                        }
                      />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      )}

      {/* CBT results */}
      {tab === "cbt" && (
        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <SectionTitle
            title="CBT Examination Results"
            description="Finalized examination attempts linked to this student's CBT identity."
            icon={ClipboardList}
          />

          <CardContent className="space-y-4 p-4 sm:p-5">
            {!data.cbtLinked && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="size-4 text-amber-600" />
                  CBT account not linked
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  This student's school record is not
                  linked to a CBT membership. Exam
                  results cannot be attributed safely
                  until that identity is linked.
                </p>
              </div>
            )}

            {data.cbtResults.length === 0 ? (
              <EmptyState
                title="No finalized CBT results"
                message="No finalized examination results were found for the linked CBT identity, or the current staff account cannot access them."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs">
                    <tr>
                      <th className="px-3 py-3 font-medium">
                        Examination
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Score
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Percentage
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Finalized
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.cbtResults.map((result) => (
                      <tr key={result.id}>
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {result.examTitle}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Attempt {result.attemptNumber}
                            {" · "}
                            Revision {result.revision}
                          </p>
                        </td>

                        <td className="px-3 py-3 tabular-nums">
                          {result.earnedPoints} /{" "}
                          {result.totalPoints}
                        </td>

                        <td className="px-3 py-3">
                          <Badge variant="secondary">
                            {result.percentage}%
                          </Badge>
                        </td>

                        <td className="px-3 py-3 text-xs">
                          {formatDate(
                            result.finalizedAt
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              CBT results represent examination performance.
              They appear in school assessments only
              after the authorized score-import process.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assessment scores */}
      {tab === "assessments" && (
        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <SectionTitle
            title="School Assessment Scores"
            description="Marks recorded against school assessment components."
            icon={BookOpen}
          />

          <CardContent className="space-y-4 p-4 sm:p-5">
            {assessmentRows.length === 0 ? (
              <EmptyState
                title="No assessment scores"
                message="No assessment scores match the selected academic session and term."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs">
                    <tr>
                      <th className="px-3 py-3 font-medium">
                        Subject / Assessment
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Term
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Marks
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Weight
                      </th>
                      <th className="px-3 py-3 font-medium">
                        Note
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {assessmentRows.map((score) => (
                      <tr key={score.id}>
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {score.subjectName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {score.componentName}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-xs">
                          {termMap.get(score.termId) ??
                            "Unknown term"}
                        </td>

                        <td className="px-3 py-3 font-medium tabular-nums">
                          {score.score} /{" "}
                          {score.maximumScore}
                        </td>

                        <td className="px-3 py-3 tabular-nums">
                          {score.weightPercent}%
                        </td>

                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {score.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Scores are shown as saved. This profile
              does not apply additional weighting or
              recalculate report-card totals.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report cards */}
      {tab === "reports" && (
        <div className="space-y-4">
          {reportRows.length === 0 ? (
            <EmptyState
              title="No report cards"
              message="No report cards match the selected academic period."
            />
          ) : (
            reportRows.map((report) => (
              <Card
                key={report.id}
                className="gap-0 overflow-hidden p-0 shadow-none"
              >
                <CardHeader className="border-b bg-primary/5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {report.termName} Report Card
                      </CardTitle>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {sessionMap.get(
                          report.sessionId
                        ) ?? "Academic session"}
                        {" · "}
                        {report.className}
                      </p>
                    </div>

                    <Badge
                      className={
                        report.status === "published"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }
                    >
                      {report.status === "published" && (
                        <CheckCircle2 className="mr-1 size-3" />
                      )}
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 sm:p-5">
                  {report.subjects.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 text-xs">
                          <tr>
                            <th className="px-3 py-3 font-medium">
                              Subject
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Total
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Grade
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Remark
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {report.subjects.map(
                            (subject) => (
                              <tr key={subject.id}>
                                <td className="px-3 py-3 font-medium">
                                  {subject.subjectName}
                                </td>

                                <td className="px-3 py-3 tabular-nums">
                                  {subject.totalScore ?? "—"}
                                </td>

                                <td className="px-3 py-3">
                                  {subject.grade ?? "—"}
                                </td>

                                <td className="px-3 py-3 text-xs">
                                  {subject.remark ?? "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No report-card subject scores
                      have been recorded.
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/20 p-3">
                      <p className="text-xs font-medium">
                        Class Teacher's Comment
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {show(report.teacherComment)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/20 p-3">
                      <p className="text-xs font-medium">
                        Principal's Comment
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {show(report.principalComment)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <CalendarDays className="size-4" />
                    {report.publishedAt
                      ? `Published ${formatDate(
                          report.publishedAt
                        )}`
                      : "Not yet published"}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
