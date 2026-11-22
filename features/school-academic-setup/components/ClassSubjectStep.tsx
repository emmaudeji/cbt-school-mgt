
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
  GraduationCap,
  Loader2,
  Plus,
  Search,
  School,
  X,
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
import type { ClassSubjectData } from "../services/class-subject-queries"
import {
  createAcademicClass,
  saveClassSubjects,
} from "../services/actions"
import { initialClassSubjectsState, initialCreateClassState } from "../services/action-states"

type Props = {
  data: ClassSubjectData
  sessionId: string
  termId: string
  sessionName: string
  termName: string
}

function NewClassForm({
  data,
  sessionId,
  onCancel,
  onCreated,
}: {
  data: ClassSubjectData
  sessionId: string
  onCancel: () => void
  onCreated: (id: string) => void
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    createAcademicClass,
    initialCreateClassState
  )

  useEffect(() => {
    if (state.ok && state.id) {
      onCreated(state.id)
      router.refresh()
    }
  }, [state, onCreated, router])

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Add a class</h3>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shadow-none"
          onClick={onCancel}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Class level</Label>
          <select
            name="levelId"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>Choose level</option>
            {data.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Class arm</Label>
          <select
            name="armId"
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">No arm</option>
            {data.arms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.message && (
        <p
          role="status"
          className={
            state.ok
              ? "text-xs text-emerald-700"
              : "text-xs text-destructive"
          }
        >
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="shadow-none"
        >
          Cancel
        </Button>
        <Button disabled={pending || !data.levels.length} className="shadow-none">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {pending ? "Creating..." : "Create Class"}
        </Button>
      </div>
    </form>
  )
}

function ClassSubjectsEditor({
  data,
  classId,
  sessionId,
  termId,
}: {
  data: ClassSubjectData
  classId: string
  sessionId: string
  termId: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  const [state, action, pending] = useActionState(
    saveClassSubjects,
    initialClassSubjectsState
  )

  const assignedIds = useMemo(
    () => new Set(
      data.offerings
        .filter((offering) => offering.class_id === classId)
        .map((offering) => offering.subject_id)
    ),
    [data.offerings, classId]
  )

  const available = useMemo(
    () => data.subjects.filter((subject) => !assignedIds.has(subject.id)),
    [data.subjects, assignedIds]
  )

  const filtered = useMemo(
    () => data.subjects.filter((subject) =>
      subject.name.toLowerCase().includes(search.toLowerCase()) ||
      subject.code?.toLowerCase().includes(search.toLowerCase())
    ),
    [data.subjects, search]
  )

  useEffect(() => {
    if (state.ok) {
      setSelected([])
      router.refresh()
    }
  }, [state, router])

  function toggle(id: string, checked: boolean) {
    setSelected((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((value) => value !== id)
    )
  }

  function selectAllAvailable() {
    setSelected(available.map((subject) => subject.id))
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="termId" value={termId} />
      <input type="hidden" name="classId" value={classId} />
      <input
        type="hidden"
        name="subjectIds"
        value={JSON.stringify(selected)}
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Available", value: data.subjects.length, color: "border-primary/20 bg-primary/5" },
          { label: "Assigned", value: assignedIds.size, color: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "To Add", value: selected.length, color: "border-sky-500/20 bg-sky-500/5" },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-3 ${item.color}`}
          >
            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
            <p className="text-xs">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search school subjects..."
            className="pl-9 shadow-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shadow-none"
            onClick={selectAllAvailable}
            disabled={available.length === 0}
          >
            Select unassigned
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={selected.length === 0}
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-xl border">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No subjects match your search.
          </p>
        ) : (
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {filtered.map((subject) => {
              const assigned = assignedIds.has(subject.id)
              const checked = assigned || selected.includes(subject.id)

              return (
                <label
                  key={subject.id}
                  className="flex cursor-pointer items-center gap-3 bg-background p-3 hover:bg-primary/5"
                >
                  <Checkbox
                    checked={checked}
                    disabled={assigned || pending}
                    onCheckedChange={(value) =>
                      toggle(subject.id, value === true)
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {subject.name}
                    </p>
                    {subject.code && (
                      <p className="text-xs text-muted-foreground">
                        {subject.code}
                      </p>
                    )}
                  </div>

                  {assigned ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircle2 className="mr-1 size-3" />
                      Assigned
                    </Badge>
                  ) : selected.includes(subject.id) ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      New
                    </Badge>
                  ) : null}
                </label>
              )
            })}
          </div>
        )}
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
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Existing subjects will not be removed or duplicated.
        </p>

        <Button
          type="submit"
          disabled={pending || selected.length === 0}
          className="shadow-none"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BookOpen className="size-4" />
          )}
          {pending ? "Saving..." : `Save ${selected.length} Subjects`}
        </Button>
      </div>
    </form>
  )
}

export function ClassSubjectStep({
  data,
  sessionId,
  termId,
  sessionName,
  termName,
}: Props) {
  const router = useRouter()
  const [classId, setClassId] = useState(data.classes[0]?.id ?? "")
  const [creatingClass, setCreatingClass] = useState(false)

  const selectedClass = data.classes.find((item) => item.id === classId)

  const configuredClasses = new Set(
    data.offerings.map((item) => item.class_id)
  ).size

  const previousUrl =
    `${urls.schoolAcademicSetup}?` +
    new URLSearchParams({ session: sessionId, term: termId, step: "1" })

  const nextUrl =
    `${urls.schoolAcademicSetup}?` +
    new URLSearchParams({ session: sessionId, term: termId, step: "3" })

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <School className="size-4 text-primary" />
          School Integration
          <span>/</span>
          Academic Setup
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Classes & Subjects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sessionName} · {termName}
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Step 2 of 4
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {["Academic Year", "Classes & Subjects", "Assessments", "Review"].map(
          (label, index) => (
            <div key={label} className="space-y-2">
              <div
                className={
                  index <= 1
                    ? "h-1.5 rounded-full bg-primary"
                    : "h-1.5 rounded-full bg-muted"
                }
              />
              <p
                className={
                  index === 1
                    ? "text-xs font-medium text-primary"
                    : "text-xs text-muted-foreground"
                }
              >
                {label}
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-row items-center gap-3 border-primary/20 bg-primary/5 p-4 shadow-none">
          <GraduationCap className="size-7 text-primary" />
          <div>
            <p className="text-xl font-semibold">{data.classes.length}</p>
            <p className="text-xs">Classes in session</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center gap-3 border-emerald-500/20 bg-emerald-500/5 p-4 shadow-none">
          <CheckCircle2 className="size-7 text-emerald-600" />
          <div>
            <p className="text-xl font-semibold">{configuredClasses}</p>
            <p className="text-xs">Classes with subjects this term</p>
          </div>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="border-b bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Class Subjects</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a class, then assign the subjects it offers this term.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <Label>Choose Class</Label>
            <div className="flex gap-2">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="min-w-0 flex-1 shadow-none">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {data.classes.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatingClass((value) => !value)}
                className="shrink-0 shadow-none"
              >
                <Plus className="size-4" />
                New
              </Button>
            </div>
          </div>

          {creatingClass && (
            <NewClassForm
              data={data}
              sessionId={sessionId}
              onCancel={() => setCreatingClass(false)}
              onCreated={(id) => {
                setClassId(id)
                setCreatingClass(false)
              }}
            />
          )}

          {selectedClass ? (
            <ClassSubjectsEditor
              key={selectedClass.id}
              classId={selectedClass.id}
              sessionId={sessionId}
              termId={termId}
              data={data}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <GraduationCap className="mx-auto mb-3 size-8 text-primary" />
              <p className="font-medium">No classes available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a class to this session to begin assigning subjects.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button variant="outline" asChild className="shadow-none">
              <Link href={previousUrl}>
                <ArrowLeft className="size-4" />
                Academic Year
              </Link>
            </Button>

            <Button
              type="button"
              disabled={configuredClasses === 0}
              onClick={() => router.push(nextUrl)}
              className="shadow-none"
            >
              Continue to Assessments
              <ArrowRight className="size-4" />
            </Button>
          </div>

          {configuredClasses === 0 && (
            <p className="text-xs text-muted-foreground">
              Save subjects for at least one class to continue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
