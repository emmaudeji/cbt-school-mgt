
"use client"

import {
  useActionState,
  useMemo,
  useState,
} from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  Info,
  Link2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  School,
  ShieldCheck,
  Sparkles,
  Unlink2,
} from "lucide-react"

import {
  linkSchoolAssessment,
  setSchoolAssessmentLinkActive,
} from "../services/actions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { ExamData } from "@/types/exams"
import { cn } from "cn"

type Publication = {
  id: string
  revision: number
  published_at: string
}

type Component = {
  id: string
  offering_id: string
  name: string
  maximum_score: number
  weight_percent: number
  session_id: string
  session_name: string
  term_id: string
  term_name: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
}

type ExistingLink = {
  id: string
  component_id: string
  publication_id: string
  revision: number
  is_active: boolean
  note: string | null
  component_name: string
  session_name: string
  term_name: string
  class_name: string
  subject_name: string
}

type Overview = {
  ok: true
  organization_id: string
  components: Component[]
  publications: Publication[]
  links: ExistingLink[]
}

const initial = {
  ok: false,
  message: "",
}

function uniqueRows(
  rows: Component[],
  key: keyof Component,
  label: keyof Component
) {
  const values = new Map<string, string>()

  rows.forEach((row) => {
    values.set(String(row[key]), String(row[label]))
  })

  return [...values]
    .map(([value, name]) => ({ value, name }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
      })
    )
}

function StatusMessage({
  state,
}: {
  state: { ok: boolean; message: string }
}) {
  if (!state.message) return null

  return (
    <div
      role="status"
      className={
        state.ok
          ? "flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"
          : "flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
      }
    >
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}

      <span>{state.message}</span>
    </div>
  )
}

function SelectionField({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string
  icon: typeof CalendarDays
  value: string
  onChange: (value: string) => void
  options: { value: string; name: string }[]
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {label}
      </Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger className="w-full border-border bg-background shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function StatusForm({
  slug,
  link,
}: {
  slug: string
  link: ExistingLink
}) {
  const [state, action, pending] =
    useActionState(
      setSchoolAssessmentLinkActive,
      initial
    )

  return (
    <form action={action} className="space-y-2">
      <input
        type="hidden"
        name="slug"
        value={slug}
      />
      <input
        type="hidden"
        name="linkId"
        value={link.id}
      />
      <input
        type="hidden"
        name="active"
        value={String(!link.is_active)}
      />

      <Button
        type="submit"
        size="sm"
        variant={
          link.is_active
            ? "outline"
            : "default"
        }
        disabled={pending}
        className="w-full shadow-none sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : link.is_active ? (
          <Unlink2 className="size-4" />
        ) : (
          <RefreshCw className="size-4" />
        )}

        {pending
          ? "Saving..."
          : link.is_active
            ? "Deactivate Link"
            : "Reactivate Link"}
      </Button>

      <StatusMessage state={state} />
    </form>
  )
}

export function SchoolAssessmentIntegration({
  slug,
  overview,
  exam
}: {
  slug: string
  overview: Overview
  exam: ExamData
}) {
  const [sessionId, setSessionId] = useState("")
  const [termId, setTermId] = useState("")
  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [componentId, setComponentId] = useState("")

  const [publicationId, setPublicationId] =
    useState(
      overview.publications[0]?.id ?? ""
    )

  const [state, action, pending] =
    useActionState(
      linkSchoolAssessment,
      initial
    )

  const components = overview.components

  const sessionRows = useMemo(
    () =>
      uniqueRows(
        components,
        "session_id",
        "session_name"
      ),
    [components]
  )

  const termRows = useMemo(
    () =>
      uniqueRows(
        components.filter(
          (x) => x.session_id === sessionId
        ),
        "term_id",
        "term_name"
      ),
    [components, sessionId]
  )

  const classRows = useMemo(
    () =>
      uniqueRows(
        components.filter(
          (x) =>
            x.session_id === sessionId &&
            x.term_id === termId
        ),
        "class_id",
        "class_name"
      ),
    [components, sessionId, termId]
  )

  const subjectRows = useMemo(
    () =>
      uniqueRows(
        components.filter(
          (x) =>
            x.session_id === sessionId &&
            x.term_id === termId &&
            x.class_id === classId
        ),
        "subject_id",
        "subject_name"
      ),
    [components, sessionId, termId, classId]
  )

  const filtered = useMemo(
    () =>
      components.filter(
        (x) =>
          x.session_id === sessionId &&
          x.term_id === termId &&
          x.class_id === classId &&
          x.subject_id === subjectId
      ),
    [
      components,
      sessionId,
      termId,
      classId,
      subjectId,
    ]
  )

  const selected = filtered.find(
    (x) => x.id === componentId
  )

  const selectedPublication =
    overview.publications.find(
      (x) => x.id === publicationId
    )

  const linked = overview.links.some(
    (x) =>
      x.component_id === componentId &&
      x.publication_id === publicationId &&
      x.is_active
  )

  const activeLinks = overview.links.filter(
    (x) => x.is_active
  ).length

  const inactiveLinks =
    overview.links.length - activeLinks

  const canSubmit =
    !!componentId &&
    !!publicationId &&
    !linked &&
    !pending

  function handleSessionChange(value: string) {
    setSessionId(value)
    setTermId("")
    setClassId("")
    setSubjectId("")
    setComponentId("")
  }

  function handleTermChange(value: string) {
    setTermId(value)
    setClassId("")
    setSubjectId("")
    setComponentId("")
  }

  function handleClassChange(value: string) {
    setClassId(value)
    setSubjectId("")
    setComponentId("")
  }

  function handleSubjectChange(value: string) {
    setSubjectId(value)
    setComponentId("")
  }

  return (
    <div className="space-y-4">

      <div className="">
        <div className="flex">
          <Link href={`/exams/${encodeURIComponent(slug)}/results`} className="flex items-center text-primary hover:underline underline-offset-4 duration-300 text-sm gap-1">
            <ArrowLeft size={14}/> Back to results
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">

            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                School Assessment Integration
              </h2>
 
              {/* <p className="text-sm  ">{exam.title}</p> */}

              <p className="max-w-2xl text-sm leading-6  ">
                Connect a published CBT examination
                to an existing school assessment
                component. This allows examination
                scores to be imported into the
                school's academic records later.
              </p>
            </div>
 
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-primary/15 bg-background/80 px-3 py-2 text-xs">
            <Info className="size-4 text-primary" />
            Configuration only
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Components",
            value: components.length,
            icon: BookOpen,
            className: "border-primary/20 bg-primary/5",
            iconClassName: "bg-primary/10 text-primary",
          },
          {
            label: "Publications",
            value: overview.publications.length,
            icon: ClipboardCheck,
            className: "border-sky-500/20 bg-sky-500/5",
            iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "Active links",
            value: activeLinks,
            icon: CheckCircle2,
            className: "border-emerald-500/20 bg-emerald-500/5",
            iconClassName:
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Inactive links",
            value: inactiveLinks,
            icon: Unlink2,
            className: "border-amber-500/20 bg-amber-500/5",
            iconClassName:
              "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
        ].map(({ label, value, icon: Icon, className, iconClassName }) => (
          <Card
            key={label}
            className={cn(
              "flex flex-row items-center justify-center gap-2 p-4 shadow-none",
              className,
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                iconClassName,
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-sm">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Link form */}
        <Card className="min-w-0 overflow-hidden border-border shadow-none p-0 pb-6 gap-3">
          <CardHeader className="border-b bg-primary/5 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <School className="size-5" />
              </div>

              <div className=" ">
                <CardTitle className="text-lg">
                  Assessment Destination
                </CardTitle>

                <p className="text-xs leading-5">
                  Choose where the examination
                  result will contribute to
                  school academic assessment.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="">
            <form
              action={action}
              className="space-y-3"
            >
              <input
                type="hidden"
                name="slug"
                value={slug}
              />

              {/* Academic context */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    1
                  </span>

                  <h3 className="text-sm font-semibold">
                    Academic Information
                  </h3>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <SelectionField
                    label="Academic Session"
                    icon={CalendarDays}
                    value={sessionId}
                    onChange={handleSessionChange}
                    options={sessionRows}
                    placeholder="Select session"
                  />

                  <SelectionField
                    label="Term"
                    icon={CalendarDays}
                    value={termId}
                    onChange={handleTermChange}
                    options={termRows}
                    placeholder="Select term"
                    disabled={!sessionId}
                  />

                  <SelectionField
                    label="Class"
                    icon={GraduationCap}
                    value={classId}
                    onChange={handleClassChange}
                    options={classRows}
                    placeholder="Select class"
                    disabled={!termId}
                  />

                  <SelectionField
                    label="Subject"
                    icon={BookOpen}
                    value={subjectId}
                    onChange={handleSubjectChange}
                    options={subjectRows}
                    placeholder="Select subject"
                    disabled={!classId}
                  />
                </div>
              </div>

              <div className="border-t" />

              {/* Component */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    2
                  </span>

                  <h3 className="text-sm font-semibold">
                    Assessment Component
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ClipboardCheck className="size-4 text-primary" />
                    Assessment type
                  </Label>

                  <Select
                    value={componentId}
                    onValueChange={setComponentId}
                    disabled={
                      !subjectId ||
                      filtered.length === 0
                    }
                  >
                    <SelectTrigger className="w-full bg-background shadow-none">
                      <SelectValue placeholder="Select assessment component" />
                    </SelectTrigger>

                    <SelectContent>
                      {filtered.map((component) => (
                        <SelectItem
                          key={component.id}
                          value={component.id}
                        >
                          {component.name}
                          {" · "}
                          {component.maximum_score} marks
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <input
                    type="hidden"
                    name="componentId"
                    value={componentId}
                  />

                  {subjectId &&
                    filtered.length === 0 && (
                      <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="size-3.5" />
                        No assessment components
                        configured for this subject.
                      </p>
                    )}
                </div>

                {selected && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle2 className="size-4" />
                      Selected Assessment
                    </div>

                    <p className="font-medium">
                      {selected.name}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-background p-3">
                        <p className="text-xs">
                          Maximum Marks
                        </p>
                        <p className="mt-1 text-xl font-semibold text-primary">
                          {selected.maximum_score}
                        </p>
                      </div>

                      <div className="rounded-lg bg-background p-3">
                        <p className="text-xs">
                          Existing Weight
                        </p>
                        <p className="mt-1 text-xl font-semibold text-primary">
                          {selected.weight_percent}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t" />

              {/* Publication */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    3
                  </span>

                  <h3 className="text-sm font-semibold">
                    CBT Publication
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>
                    Published Examination Revision
                  </Label>

                  <Select
                    value={publicationId}
                    onValueChange={setPublicationId}
                    disabled={
                      overview.publications.length === 0
                    }
                  >
                    <SelectTrigger className="w-full bg-background shadow-none">
                      <SelectValue placeholder="Select published revision" />
                    </SelectTrigger>

                    <SelectContent>
                      {overview.publications.map(
                        (publication) => (
                          <SelectItem
                            key={publication.id}
                            value={publication.id}
                          >
                            Revision {publication.revision}
                            {" · "}
                            {new Date(
                              publication.published_at
                            ).toLocaleDateString()}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <input
                    type="hidden"
                    name="publicationId"
                    value={publicationId}
                  />
                </div>

                {selectedPublication && (
                  <div className="flex items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <ShieldCheck className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">
                        Revision{" "}
                        {selectedPublication.revision}
                      </p>

                      <p className="text-xs leading-5">
                        This link will reference the
                        selected published examination
                        snapshot, not its editable draft.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submission */}
              <div className="space-y-3 border-t pt-5">
                {linked && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    This publication is already
                    actively linked to the selected
                    assessment.
                  </div>
                )}

                <StatusMessage state={state} />

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full shadow-none sm:w-auto"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : linked ? (
                    <Check className="size-4" />
                  ) : (
                    <Link2 className="size-4" />
                  )}

                  {pending
                    ? "Creating link..."
                    : linked
                      ? "Already Linked"
                      : "Link Examination"}

                  {!pending && !linked && (
                    <ArrowRight className="size-4" />
                  )}
                </Button>

                <p className="text-xs leading-5">
                  Linking does not modify examination
                  results or import student marks.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5 shadow-none gap-2 divide-y">
            <CardHeader className=" pb-2">
              <CardTitle className="flex items-center gap-2 text-">
                <ShieldCheck className="size-5 text-primary" />
                Integration Rules
              </CardTitle>
            </CardHeader>

            <CardContent className=" text-sm gap-2">
              {[
                {
                  title: "School-scoped",
                  description:
                    "Links belong to the current school organization.",
                },
                {
                  title: "Revision-specific",
                  description:
                    "Each link references an immutable published examination.",
                },
                {
                  title: "One active source",
                  description:
                    "Only one published examination can be active for a component.",
                },
                {
                  title: "Latest attempt",
                  description:
                    "The latest eligible attempt supersedes earlier attempts during future imports.",
                },
                {
                  title: "Protected results",
                  description:
                    "Existing imported marks are never silently overwritten.",
                },
              ].map((rule) => (
                <div
                  key={rule.title}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      {rule.title}
                    </p>

                    <p className="mt-0.5 text-xs leading-5">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5 shadow-none p-0 ">
            <CardContent className="gap-2 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                <CircleHelp className="size-5" />
                Important
              </div>

              <p className="text-xs leading-6">
                Confirm that the selected class,
                subject, and academic term actually
                correspond to this CBT examination.
              </p>
 
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Existing links */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Link2 className="size-5 text-primary" />
              Existing Assessment Links
            </h2>

            <p className="text-sm">
              Manage this examination's
              school assessment destinations.
            </p>
          </div>

          <Badge variant="secondary">
            {overview.links.length} Total
          </Badge>
        </div>

        {overview.links.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-5 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Link2 className="size-7" />
            </div>

            <h3 className="font-semibold">
              No Assessment Links Yet
            </h3>

            <p className="max-w-md text-sm leading-6">
              Select an academic session, term,
              class, subject, and assessment
              component above to create your
              first integration.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {overview.links.map((link) => (
              <Card
                key={link.id}
                className={cn(
                  "p-0 gap-0",
                  link.is_active
                    ? "overflow-hidden border-emerald-500/25 shadow-none "
                    : "overflow-hidden border-border shadow-none")
                }
              >
                <div
                  className={
                    link.is_active
                      ? "h-1 bg-emerald-500"
                      : "h-1 bg-muted-foreground/25"
                  }
                />

                <CardContent className="space-y-2 p-4  ">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          link.is_active
                            ? "flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "flex size-10 items-center justify-center rounded-lg bg-muted"
                        }
                      >
                        <ClipboardCheck className="size-5" />
                      </div>

                      <div>
                        <p className="font-semibold">
                          {link.component_name}
                        </p>

                        <p className="text-sm">
                          Published revision{" "}
                          {link.revision}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={
                        link.is_active
                          ? "gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "gap-1"
                      }
                    >
                      {link.is_active ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Unlink2 className="size-3" />
                      )}

                      {link.is_active
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">
                        Academic Session
                      </p>
                      <p className="mt-1 font-medium">
                        {link.session_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Term
                      </p>
                      <p className="mt-1 font-medium">
                        {link.term_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Class
                      </p>
                      <p className="mt-1 font-medium">
                        {link.class_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Subject
                      </p>
                      <p className="mt-1 font-medium">
                        {link.subject_name}
                      </p>
                    </div>
                  </div>

                  {link.note && (
                    <p className="flex items-start gap-2 text-xs leading-5">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      {link.note}
                    </p>
                  )}

                  <div className="border-t pt-3">
                    <StatusForm
                      slug={slug}
                      link={link}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
