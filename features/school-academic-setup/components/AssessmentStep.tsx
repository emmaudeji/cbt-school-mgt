
"use client"

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

import {
  applyAssessmentTemplate,
} from "../services/actions"

import {
  initialAssessmentState,
} from "../services/action-states"

type Props = {
  data: AssessmentSetupData
  sessionId: string
  termId: string
  sessionName: string
  termName: string
}

const standardTemplate = [
  { name: "1ST CA", maximum_score: 20, weight_percent: 20 },
  { name: "2ND CA", maximum_score: 20, weight_percent: 20 },
  { name: "FINAL EXAMINATION", maximum_score: 60, weight_percent: 60 },
]

export function AssessmentStep({
  data,
  sessionId,
  termId,
  sessionName,
  termName,
}: Props) {
  const router = useRouter()

  const [classId, setClassId] = useState("all")
  const [search, setSearch] = useState("")
  const [sourceId, setSourceId] = useState("standard")

  const [selected, setSelected] = useState<string[]>(
    data.offerings
      .filter((offering) =>
        !data.components.some(
          (component) =>
            component.offering_id === offering.id
        )
      )
      .map((offering) => offering.id)
  )

  const [state, action, pending] = useActionState(
    applyAssessmentTemplate,
    initialAssessmentState
  )

  const classMap = useMemo(
    () => new Map(
      data.classes.map((item) => [item.id, item.name])
    ),
    [data.classes]
  )

  const subjectMap = useMemo(
    () => new Map(
      data.subjects.map((item) => [item.id, item.name])
    ),
    [data.subjects]
  )

  const componentsByOffering = useMemo(() => {
    const map = new Map<string, typeof data.components>()

    data.components.forEach((component) => {
      const list = map.get(component.offering_id) ?? []
      list.push(component)
      map.set(component.offering_id, list)
    })

    return map
  }, [data.components])

  const templateSources = useMemo(
    () =>
      data.offerings.filter((offering) =>
        (componentsByOffering.get(offering.id)?.length ?? 0) > 0
      ),
    [data.offerings, componentsByOffering]
  )

  const template = useMemo(() => {
    if (sourceId === "standard") return standardTemplate

    return (
      componentsByOffering.get(sourceId) ?? []
    ).map((component) => ({
      name: component.name,
      maximum_score: component.maximum_score,
      weight_percent: component.weight_percent,
    }))
  }, [sourceId, componentsByOffering])

  const rows = useMemo(
    () =>
      data.offerings
        .map((offering) => {
          const existing =
            componentsByOffering.get(offering.id) ?? []

          const existingNames = new Set(
            existing.map((item) => item.name)
          )

          const missing = template.filter(
            (item) => !existingNames.has(item.name)
          )

          return {
            ...offering,
            className:
              classMap.get(offering.class_id) ?? "Unknown class",
            subjectName:
              subjectMap.get(offering.subject_id) ?? "Unknown subject",
            existing,
            missing,
          }
        })
        .sort((a, b) =>
          a.className.localeCompare(b.className, undefined, {
            numeric: true,
          }) ||
          a.subjectName.localeCompare(b.subjectName)
        ),
    [
      data.offerings,
      componentsByOffering,
      classMap,
      subjectMap,
      template,
    ]
  )

  const filtered = rows.filter((row) => {
    const matchesClass =
      classId === "all" || row.class_id === classId

    const query = search.trim().toLowerCase()

    const matchesSearch =
      !query ||
      `${row.className} ${row.subjectName}`
        .toLowerCase()
        .includes(query)

    return matchesClass && matchesSearch
  })

  const configured = rows.filter(
    (row) => row.missing.length === 0
  ).length

  const partial = rows.filter(
    (row) =>
      row.existing.length > 0 &&
      row.missing.length > 0
  ).length

  const selectedRows = rows.filter(
    (row) => selected.includes(row.id)
  )

  const toCreate = selectedRows.reduce(
    (sum, row) => sum + row.missing.length,
    0
  )

  const templateTotal = template.reduce(
    (sum, item) => sum + Number(item.maximum_score),
    0
  )

  const sourceLabel = (id: string) => {
    const offering = data.offerings.find(
      (item) => item.id === id
    )

    if (!offering) return "Unknown subject"

    return [
      classMap.get(offering.class_id),
      subjectMap.get(offering.subject_id),
    ].filter(Boolean).join(" · ")
  }

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state, router])

  function toggle(id: string, checked: boolean) {
    setSelected((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((value) => value !== id)
    )
  }

  const previousUrl =
    `${urls.schoolAcademicSetup}?` +
    new URLSearchParams({
      step: "2",
      session: sessionId,
      term: termId,
    })

    const reviewUrl =
    `${urls.schoolAcademicSetup}?` +
    new URLSearchParams({
        step: "4",
        session: sessionId,
        term: termId,
    })

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Assessment Setup
          </h1>
          <p className="text-sm text-muted-foreground">
            {sessionName} · {termName}
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
          Step 3 of 4
        </Badge>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-4 gap-2">
        {[
          "Academic Year",
          "Classes & Subjects",
          "Assessments",
          "Review",
        ].map((label, index) => (
          <div key={label} className="space-y-2">
            <div
              className={
                index <= 2
                  ? "h-1.5 rounded-full bg-primary"
                  : "h-1.5 rounded-full bg-muted"
              }
            />
            <p
              className={
                index === 2
                  ? "text-xs font-medium text-primary"
                  : "text-xs text-muted-foreground"
              }
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Subject offerings",
            value: rows.length,
            color: "border-primary/20 bg-primary/5",
          },
          {
            label: "Ready",
            value: configured,
            color: "border-emerald-500/20 bg-emerald-500/5",
          },
          {
            label: "Partially set up",
            value: partial,
            color: "border-amber-500/20 bg-amber-500/5",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className={`gap-1 p-3 shadow-none sm:p-4 ${item.color}`}
          >
            <p className="text-2xl font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="text-xs">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="border-b bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Prepare School Assessments
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a marking structure and the
                subjects that should use it.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5 sm:p-6">
          <form action={action} className="space-y-5">
            <input
              type="hidden"
              name="sessionId"
              value={sessionId}
            />
            <input
              type="hidden"
              name="termId"
              value={termId}
            />
            <input
              type="hidden"
              name="sourceOfferingId"
              value={sourceId === "standard" ? "" : sourceId}
            />
            <input
              type="hidden"
              name="offeringIds"
              value={JSON.stringify(
                selectedRows
                  .filter((row) => row.missing.length > 0)
                  .map((row) => row.id)
              )}
            />

            {/* Template selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Assessment Structure
              </Label>

              <Select
                value={sourceId}
                onValueChange={(value) => {
                  setSourceId(value)
                  setSelected([])
                }}
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue placeholder="Choose assessment structure" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="standard">
                    Standard · 20 / 20 / 60
                  </SelectItem>

                  {templateSources.map((offering) => (
                    <SelectItem
                      key={offering.id}
                      value={offering.id}
                    >
                      Copy from {sourceLabel(offering.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Copying an existing structure uses its
                current component names, maximum marks
                and weights.
              </p>
            </div>

            {/* Template preview */}
            <div className="overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <p className="text-sm font-semibold">
                  Assessment Structure
                </p>

                <Badge variant="secondary">
                  {templateTotal} marks
                </Badge>
              </div>

              <div className="divide-y">
                {template.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span>{item.name}</span>

                    <div className="text-right">
                      <span className="font-semibold text-primary">
                        {item.maximum_score} marks
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Weight: {item.weight_percent}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offering selection */}
            <div className="space-y-3 border-t pt-5">
              <div>
                <h3 className="text-sm font-semibold">
                  Choose Class Subjects
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only missing components will be added.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={classId}
                  onValueChange={setClassId}
                >
                  <SelectTrigger className="w-full shadow-none sm:w-[220px]">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All classes
                    </SelectItem>

                    {data.classes.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search class or subject..."
                    className="pl-9 shadow-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} subject offerings
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shadow-none"
                    onClick={() =>
                      setSelected((previous) => [
                        ...new Set([
                          ...previous,
                          ...filtered
                            .filter(
                              (row) => row.missing.length > 0
                            )
                            .map((row) => row.id),
                        ]),
                      ])
                    }
                  >
                    Select missing
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelected((previous) =>
                        previous.filter(
                          (id) =>
                            !filtered.some(
                              (row) => row.id === id
                            )
                        )
                      )
                    }
                  >
                    Clear visible
                  </Button>
                </div>
              </div>

              <div className="max-h-[440px] overflow-y-auto rounded-xl border">
                {filtered.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No subject offerings found.
                  </p>
                ) : (
                  <div className="divide-y">
                    {filtered.map((row) => {
                      const complete =
                        row.missing.length === 0

                      return (
                        <label
                          key={row.id}
                          className="flex items-center gap-3 p-3 hover:bg-primary/5"
                        >
                          <Checkbox
                            checked={
                              complete ||
                              selected.includes(row.id)
                            }
                            disabled={complete || pending}
                            onCheckedChange={(checked) =>
                              toggle(row.id, checked === true)
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {row.subjectName}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {row.className}
                              {" · "}
                              {row.existing.length} existing
                            </p>

                            {!complete && (
                              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                Add:{" "}
                                {row.missing
                                  .map((item) => item.name)
                                  .join(", ")}
                              </p>
                            )}
                          </div>

                          {complete ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="mr-1 size-3" />
                              Ready
                            </Badge>
                          ) : row.existing.length > 0 ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            >
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Not set up
                            </Badge>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Changes summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Ready to apply
                  </p>

                  <p className="text-sm">
                    {selectedRows.filter(
                      (row) => row.missing.length > 0
                    ).length}{" "}
                    subject offering(s) selected
                  </p>

                  <p className="text-sm font-medium text-primary">
                    {toCreate} new component(s)
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Existing custom settings and scores
                    will remain unchanged.
                  </p>
                </div>
              </div>
            </div>

            {state.message && (
              <div
                role="status"
                className={
                  state.ok
                    ? "rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
                    : "rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                }
              >
                {state.message}
                {state.ok && state.preserved > 0 && (
                  <p className="mt-1 text-xs">
                    {state.preserved} existing component
                    assignment(s) preserved.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button
                variant="outline"
                asChild
                className="shadow-none"
              >
                <Link href={previousUrl}>
                  <ArrowLeft className="size-4" />
                  Classes & Subjects
                </Link>
              </Button>

              <Button
                type="submit"
                disabled={pending || toCreate === 0}
                className="shadow-none"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="size-4" />
                )}

                {pending
                  ? "Applying..."
                  : `Apply ${toCreate} Components`}
              </Button>
            </div>
          </form>


            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-1">
                <p className="text-sm font-semibold">
                Review your academic setup
                </p>
                <p className="text-xs text-muted-foreground">
                Check what is ready and what still needs attention.
                </p>
            </div>

            <Button asChild className="shadow-none">
                <Link href={reviewUrl}>
                Review Setup
                <ArrowRight className="size-4" />
                </Link>
            </Button>
            </div>


          <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
            <p className="text-xs leading-5 text-muted-foreground">
              Assessment setup does not import student
              scores, link CBT examinations or change
              existing marks. Those operations are
              managed separately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
