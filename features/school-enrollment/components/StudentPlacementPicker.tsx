
"use client"

import {
  useActionState,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"

import {
  CheckCircle2,
  Loader2,
  Search,
  UserPlus,
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

import {
  enrollExistingStudents,
} from "../services/actions"

import {
  initialEnrollmentState,
} from "../services/action-states"

import type {
  EnrollmentCandidate,
  EnrollmentClass,
  EnrollmentSession,
} from "../services/queries"

type Props = {
  candidates: EnrollmentCandidate[]
  total: number

  sessionId: string
  classId: string

  sessions: EnrollmentSession[]
  sourceClasses: EnrollmentClass[]

  sourceSessionId: string
  sourceClassId: string

  search: string

  onSearch: (value: string) => void
  onSourceSessionChange: (value: string) => void
  onSourceClassChange: (value: string) => void
}

export function StudentPlacementPicker({
  candidates,
  total,
  sessionId,
  classId,
  sessions,
  sourceClasses,
  sourceSessionId,
  sourceClassId,
  search,
  onSearch,
  onSourceSessionChange,
  onSourceClassChange,
}: Props) {
  const router = useRouter()

  const [query, setQuery] = useState(search)
  const [selected, setSelected] =
    useState<string[]>([])

  const [state, action, pending] =
    useActionState(
      enrollExistingStudents,
      initialEnrollmentState
    )

  useEffect(() => {
    if (state.ok) {
      setSelected([])
      router.refresh()
    }
  }, [state, router])

  const visibleIds = candidates.map(
    (item) => item.student_id
  )

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every(
      (id) => selected.includes(id)
    )

  function toggle(
    id: string,
    checked: boolean
  ) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter(
            (value) => value !== id
          )
    )
  }

  function toggleVisible() {
    setSelected((current) =>
      allVisibleSelected
        ? current.filter(
            (id) => !visibleIds.includes(id)
          )
        : [...new Set([
            ...current,
            ...visibleIds,
          ])]
    )
  }

  const sourceSessionName =
    sessions.find(
      (item) => item.id === sourceSessionId
    )?.name

  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-none">
      <CardHeader className="border-b bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <UserPlus className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base">
                Enroll Students
              </CardTitle>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Find eligible students using
                their previous session and class.
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            {total} Available
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Source filters */}
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <div>
            <h3 className="text-sm font-semibold">
              Find Students
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Filter by the academic session and
              class they previously attended.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Source Academic Session
              </Label>

              <Select
                value={sourceSessionId}
                disabled={pending}
                onValueChange={
                  onSourceSessionChange
                }
              >
                <SelectTrigger className="w-full min-w-0 bg-background shadow-none">
                  <SelectValue placeholder="Choose session" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Registered Students
                  </SelectItem>

                  {sessions.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.is_current
                        ? " · Current"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Source Class
              </Label>

              <Select
                value={sourceClassId}
                disabled={
                  sourceSessionId === "all" ||
                  pending
                }
                onValueChange={
                  onSourceClassChange
                }
              >
                <SelectTrigger className="w-full min-w-0 bg-background shadow-none">
                  <SelectValue
                    placeholder={
                      sourceSessionId === "all"
                        ? "Select a session first"
                        : "Choose class"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Classes
                  </SelectItem>

                  {sourceClasses.map(
                    (item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            {sourceSessionId === "all"
              ? "Showing all registered students who can be enrolled in the destination session."
              : sourceClassId === "all"
                ? `Showing eligible students who attended any class in ${sourceSessionName ?? "the selected session"}.`
                : `Showing eligible students from the selected class in ${sourceSessionName ?? "the selected session"}.`}
          </p>

          {(sourceSessionId !== "all" ||
            sourceClassId !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="h-8 px-2"
              onClick={() =>
                onSourceSessionChange("all")
              }
            >
              Clear source filters
            </Button>
          )}
        </div>

        {/* Candidate search */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSearch(query.trim())
          }}
          className="flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Name or admission number..."
              className="pl-9 shadow-none"
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="shadow-none"
          >
            Search
          </Button>
        </form>

        {/* Enrollment form */}
        <form
          action={action}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="sessionId"
            value={sessionId}
          />

          <input
            type="hidden"
            name="classId"
            value={classId}
          />

          <input
            type="hidden"
            name="studentIds"
            value={JSON.stringify(selected)}
          />

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {selected.length} selected
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                pending ||
                candidates.length === 0
              }
              onClick={toggleVisible}
            >
              {allVisibleSelected
                ? "Clear visible"
                : "Select visible"}
            </Button>
          </div>

          {candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Users className="mx-auto mb-3 size-8 text-primary" />

              <p className="text-sm font-semibold">
                No eligible students found
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Try another academic session,
                class or search term.
              </p>
            </div>
          ) : (
            <div className="max-h-[450px] divide-y overflow-y-auto rounded-xl border">
              {candidates.map((student) => {
                const checked =
                  selected.includes(
                    student.student_id
                  )

                return (
                  <label
                    key={student.student_id}
                    className="flex cursor-pointer items-center gap-3 p-3 hover:bg-primary/5"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={pending}
                      onCheckedChange={(value) =>
                        toggle(
                          student.student_id,
                          value === true
                        )
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {student.last_name}{" "}
                        {student.first_name}
                        {student.other_names
                          ? ` ${student.other_names}`
                          : ""}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {student.admission_number ||
                          "No admission number"}
                      </p>
                    </div>

                    {checked && (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    )}
                  </label>
                )
              })}
            </div>
          )}

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
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">
              Students already active in another
              class this session are excluded.
            </p>

            <Button
              type="submit"
              disabled={
                pending ||
                selected.length === 0 ||
                !classId
              }
              className="shadow-none"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}

              {pending
                ? "Enrolling..."
                : `Enroll ${selected.length}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
