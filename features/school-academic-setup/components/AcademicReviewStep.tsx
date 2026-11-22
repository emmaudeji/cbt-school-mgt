
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Info,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { urls } from "@/constants"
import type {
  AssessmentSetupData,
} from "../services/assessment-queries"
import { buildAcademicReadiness, OfferingReadinessStatus } from "../services/academic-readiness"
 
type Props = {
  data: AssessmentSetupData
  sessionId: string
  termId: string
  sessionName: string
  termName: string
}

function StatusBadge({
  status,
}: {
  status: OfferingReadinessStatus
}) {
  if (status === "ready") {
    return (
      <Badge className="gap-1 border-0 bg-emerald-500/10 text-emerald-700 shadow-none hover:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Configured
      </Badge>
    )
  }

  if (status === "review") {
    return (
      <Badge className="gap-1 border-0 bg-amber-500/10 text-amber-700 shadow-none hover:bg-amber-500/10 dark:text-amber-400">
        <AlertCircle className="size-3" />
        Needs review
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 shadow-none">
      <AlertCircle className="size-3" />
      Missing setup
    </Badge>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: typeof GraduationCap
  color: "primary" | "emerald" | "amber" | "sky"
}) {
  const styles = {
    primary: {
      card: "border-primary/20 bg-primary/5",
      icon: "bg-primary/10 text-primary",
    },
    emerald: {
      card: "border-emerald-500/20 bg-emerald-500/5",
      icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      card: "border-amber-500/20 bg-amber-500/5",
      icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    sky: {
      card: "border-sky-500/20 bg-sky-500/5",
      icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  }[color]

  return (
    <Card
      className={`flex flex-row items-center gap-3 p-3 shadow-none sm:p-4 ${styles.card}`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums">
          {value}
        </p>
        <p className="text-xs">{label}</p>
      </div>
    </Card>
  )
}

export function AcademicReviewStep({
  data,
  sessionId,
  termId,
  sessionName,
  termName,
}: Props) {
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])

  const classes = useMemo(
    () => buildAcademicReadiness(data),
    [data]
  )

  const allOfferings = useMemo(
    () => classes.flatMap((c) => c.offerings),
    [classes]
  )

  const classesWithoutSubjects = classes.filter(
    (c) => c.offerings.length === 0
  )

  const missingAssessments = allOfferings.filter(
    (o) => o.status === "missing"
  )

  const needsReview = allOfferings.filter(
    (o) => o.status === "review"
  )

  const configured = allOfferings.filter(
    (o) => o.status === "ready"
  )

  const attentionCount =
    classesWithoutSubjects.length +
    missingAssessments.length +
    needsReview.length

  const filteredClasses = classes
    .map((schoolClass) => {
      const query = search.trim().toLowerCase()

      const classMatches =
        schoolClass.name.toLowerCase().includes(query)

      const offerings = schoolClass.offerings.filter(
        (offering) => {
          const matchesStatus =
            statusFilter === "all" ||
            offering.status === statusFilter

          const matchesSearch =
            !query ||
            classMatches ||
            offering.subjectName
              .toLowerCase()
              .includes(query)

          return matchesStatus && matchesSearch
        }
      )

      return {
        ...schoolClass,
        visibleOfferings: offerings,
      }
    })
    .filter((schoolClass) => {
      if (
        classFilter !== "all" &&
        schoolClass.id !== classFilter
      ) {
        return false
      }

      if (schoolClass.offerings.length === 0) {
        return (
          (statusFilter === "all" ||
            statusFilter === "missing") &&
          (!search ||
            schoolClass.name
              .toLowerCase()
              .includes(search.toLowerCase()))
        )
      }

      return schoolClass.visibleOfferings.length > 0
    })

  const baseUrl = urls.schoolAcademicSetup

  function stepUrl(step: number) {
    return `${baseUrl}?${new URLSearchParams({
      session: sessionId,
      term: termId,
      step: String(step),
    })}`
  }

  function toggleExpanded(id: string) {
    setExpanded((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4 text-primary" />
            Academic Setup
            <ChevronRight className="size-3.5" />
            Review
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Review Academic Setup
          </h1>

          <p className="text-sm text-muted-foreground">
            {sessionName} · {termName}
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary shadow-none hover:bg-primary/10">
          Step 4 of 4
        </Badge>
      </div>

      {/* Wizard progress */}
      <div className="grid grid-cols-4 gap-2">
        {[
          "Academic Year",
          "Classes & Subjects",
          "Assessments",
          "Review",
        ].map((label, index) => (
          <div key={label} className="space-y-2">
            <div className="h-1.5 rounded-full bg-primary" />
            <p
              className={
                index === 3
                  ? "text-xs font-semibold text-primary"
                  : "text-xs text-muted-foreground"
              }
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Classes"
          value={classes.length}
          icon={GraduationCap}
          color="primary"
        />
        <StatCard
          label="Subject offerings"
          value={allOfferings.length}
          icon={BookOpen}
          color="sky"
        />
        <StatCard
          label="Configured"
          value={configured.length}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Need attention"
          value={attentionCount}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Overall assessment */}
      <Card
        className={
          attentionCount === 0 && classes.length > 0
            ? "gap-2 border-emerald-500/20 bg-emerald-500/5 p-4 shadow-none"
            : "gap-2 border-amber-500/20 bg-amber-500/5 p-4 shadow-none"
        }
      >
        <div className="flex items-start gap-3">
          {attentionCount === 0 && classes.length > 0 ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {attentionCount === 0 && classes.length > 0
                ? "Academic structure configured"
                : "Some academic setup needs attention"}
            </p>

            <p className="text-xs leading-5 text-muted-foreground">
              {attentionCount === 0 && classes.length > 0
                ? "Every class has subject offerings, and their assessment structures pass the current configuration checks."
                : `${classesWithoutSubjects.length} class(es) without subjects, ${missingAssessments.length} subject(s) without assessments, and ${needsReview.length} assessment structure(s) needing review.`}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick fixes */}
      {attentionCount > 0 && (
        <Card className="gap-3 border-border p-4 shadow-none">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">
              Recommended next actions
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {classesWithoutSubjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shadow-none"
              >
                <Link href={stepUrl(2)}>
                  Assign class subjects
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}

            {missingAssessments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shadow-none"
              >
                <Link href={stepUrl(3)}>
                  Set up assessments
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}

            {needsReview.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <Info className="size-3.5" />
                Review assessment weights in School Configuration
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Readiness detail */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="border-b bg-primary/5 p-5">
          <CardTitle className="text-lg">
            Class Readiness
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review each class and the subjects prepared
            for the selected academic term.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Filters */}
          <div className="grid gap-2 sm:grid-cols-[1fr_190px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search class or subject..."
                className="pl-9 shadow-none"
              />
            </div>

            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger className="w-full shadow-none">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All classes
                </SelectItem>
                {classes.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full shadow-none">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All statuses
                </SelectItem>
                <SelectItem value="ready">
                  Configured
                </SelectItem>
                <SelectItem value="missing">
                  Missing setup
                </SelectItem>
                <SelectItem value="review">
                  Needs review
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Search className="mx-auto mb-3 size-7 text-muted-foreground" />
              <p className="text-sm font-semibold">
                No matching classes or subjects
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((schoolClass) => {
                const count = schoolClass.offerings.length

                const percent = count > 0
                  ? Math.round(schoolClass.ready / count * 100)
                  : 0

                return (
                  <div
                    key={schoolClass.id}
                    className="overflow-hidden rounded-xl border"
                  >
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <GraduationCap className="size-5" />
                          </div>

                          <div>
                            <p className="font-semibold">
                              {schoolClass.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {count} subject offerings
                              {" · "}
                              {schoolClass.ready} configured
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={schoolClass.status} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Assessment readiness
                          </span>
                          <span className="font-medium">
                            {percent}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={
                              schoolClass.status === "ready"
                                ? "h-full rounded-full bg-emerald-500"
                                : "h-full rounded-full bg-amber-500"
                            }
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{schoolClass.missing} missing</span>
                          <span>·</span>
                          <span>{schoolClass.review} review</span>
                        </div>

                        {count === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="shadow-none"
                          >
                            <Link href={stepUrl(2)}>
                              Add subjects
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toggleExpanded(schoolClass.id)
                            }
                          >
                            {expanded.includes(schoolClass.id)
                              ? "Hide subjects"
                              : "View subjects"}

                            <ChevronDown
                              className={
                                expanded.includes(schoolClass.id)
                                  ? "size-4 rotate-180"
                                  : "size-4"
                              }
                            />
                          </Button>
                        )}
                      </div>
                    </div>

                    {count > 0 &&
                      expanded.includes(schoolClass.id) && (
                        <div className="overflow-x-auto border-t">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 text-xs">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Subject
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Assessments
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Maximum
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {schoolClass.visibleOfferings.map(
                                (offering) => (
                                  <tr
                                    key={offering.id}
                                    className="hover:bg-primary/5"
                                  >
                                    <td className="px-4 py-3 font-medium">
                                      {offering.subjectName}
                                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                                        {offering.reason}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                      {offering.components.length}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                      {offering.components.length
                                        ? offering.totalMarks
                                        : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <StatusBadge
                                        status={offering.status}
                                      />
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope explanation */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />

        <div className="space-y-1">
          <p className="text-sm font-semibold">
            Academic setup review only
          </p>

          <p className="text-xs leading-6 text-muted-foreground">
            This page verifies classes, subject
            assignments and assessment definitions.
            Student enrollment, CBT publication,
            candidate assignments and finalized
            results are checked in their respective
            workflows.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <Button
          variant="outline"
          asChild
          className="shadow-none"
        >
          <Link href={stepUrl(3)}>
            <ArrowLeft className="size-4" />
            Assessment Setup
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            asChild
            className="shadow-none"
          >
            <Link href={stepUrl(1)}>
              <CalendarDays className="size-4" />
              Change Academic Period
            </Link>
          </Button>

          <Button asChild className="shadow-none">
            <Link href="/exams">
              <CheckCircle2 className="size-4" />
              Go to Examinations
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
