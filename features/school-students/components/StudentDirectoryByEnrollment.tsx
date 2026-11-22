
"use client"

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArrowRight,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Search,
  UserMinus,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  getDirectoryDestinationClasses,
  submitDirectoryAction,
} from "../services/directory-actions"

import {
  initialDirectoryActionState,
} from "../services/directory-state"

import type {
  StudentDirectoryData,
} from "../services/directory-queries"

type Mode = "promote" | "transfer" | "remove"
type Scope = "selected" | "class"

type Props = {
  data: StudentDirectoryData
}

type ActionRequest = {
  mode: Mode
  scope: Scope
  enrollmentIds: string[]
}

const actionLabels: Record<Mode, string> = {
  promote: "Promote",
  transfer: "Transfer",
  remove: "Remove",
}

const todayLocal = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function StudentName({
  first,
  last,
  other,
}: {
  first: string
  last: string
  other?: string | null
}) {
  return (
    <span>
      {last} {first}
      {other ? ` ${other}` : ""}
    </span>
  )
}

function DirectoryActionDialog({
  request,
  data,
  onClose,
  onSuccess,
}: {
  request: ActionRequest
  data: StudentDirectoryData
  onClose: () => void
  onSuccess: () => void
}) {
  const [targetSessionId, setTargetSessionId] =
    useState(
      request.mode === "transfer"
        ? data.sessionId
        : "none"
    )

  const [targetClassId, setTargetClassId] =
    useState("none")

  const [targetClasses, setTargetClasses] =
    useState<{ id: string; name: string }[]>([])

  const [loadingClasses, setLoadingClasses] =
    useState(false)

  const [loadError, setLoadError] = useState("")

  const [effectiveOn, setEffectiveOn] =
    useState(todayLocal())

  const [state, action, pending] =
    useActionState(
      submitDirectoryAction,
      initialDirectoryActionState
    )

  const handledSuccess = useRef(false)

  const selectedClass = data.classes.find(
    c => c.id === data.classId
  )

  const countLabel =
    request.scope === "class"
      ? `the whole ${selectedClass?.name ?? "selected"} class`
      : `${request.enrollmentIds.length} student(s)`

  // Load destination classes whenever the selected
  // destination session changes.
  useEffect(() => {
    if (
      request.mode === "remove" ||
      targetSessionId === "none"
    ) {
      setTargetClasses([])
      setTargetClassId("none")
      return
    }

    let cancelled = false

    async function load() {
      setLoadingClasses(true)
      setLoadError("")
      setTargetClassId("none")

      try {
        const result =
          await getDirectoryDestinationClasses(
            targetSessionId
          )

        if (cancelled) return

        if (result.error) {
          setLoadError(result.error)
          setTargetClasses([])
        } else {
          const options = result.classes.filter(
            c =>
              request.mode !== "transfer" ||
              c.id !== data.classId
          )

          setTargetClasses(options)
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "Unable to load destination classes."
          )
        }
      } finally {
        if (!cancelled) setLoadingClasses(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    request.mode,
    targetSessionId,
    data.classId,
  ])

  useEffect(() => {
    if (state.ok && !handledSuccess.current) {
      handledSuccess.current = true
      onSuccess()
    }
  }, [state.ok, onSuccess])

  const validDestination =
    request.mode === "remove" ||
    (
      targetSessionId !== "none" &&
      targetClassId !== "none" &&
      !loadingClasses
    )

  const destinationSessions = data.sessions.filter(
    s =>
      request.mode !== "promote" ||
      s.id !== data.sessionId
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="directory-action-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-5 shadow-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="directory-action-title"
              className="text-lg font-semibold"
            >
              {actionLabels[request.mode]} Students
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You are about to{" "}
              {request.mode} {countLabel}.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={pending}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form action={action} className="mt-5 space-y-4">
          <input
            type="hidden"
            name="mode"
            value={request.mode}
          />
          <input
            type="hidden"
            name="scope"
            value={request.scope}
          />
          <input
            type="hidden"
            name="sourceSessionId"
            value={data.sessionId}
          />
          <input
            type="hidden"
            name="sourceClassId"
            value={data.classId}
          />
          <input
            type="hidden"
            name="enrollmentIds"
            value={JSON.stringify(
              request.enrollmentIds
            )}
          />
          <input
            type="hidden"
            name="targetSessionId"
            value={
              request.mode === "transfer"
                ? data.sessionId
                : targetSessionId
            }
          />
          <input
            type="hidden"
            name="targetClassId"
            value={
              request.mode === "remove"
                ? ""
                : targetClassId
            }
          />
          <input
            type="hidden"
            name="effectiveOn"
            value={effectiveOn}
          />

          {request.mode === "promote" && (
            <div className="space-y-2">
              <Label>Destination Academic Session</Label>

              <Select
                value={targetSessionId}
                onValueChange={setTargetSessionId}
                disabled={pending}
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue placeholder="Choose session" />
                </SelectTrigger>

                <SelectContent>
                  {destinationSessions.map(s => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {request.mode !== "remove" && (
            <div className="space-y-2">
              <Label>Destination Class</Label>

              <Select
                value={targetClassId}
                onValueChange={setTargetClassId}
                disabled={
                  pending ||
                  loadingClasses ||
                  targetSessionId === "none"
                }
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue
                    placeholder={
                      loadingClasses
                        ? "Loading classes..."
                        : "Choose class"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {targetClasses.map(c => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {loadError && (
                <p className="text-xs text-destructive">
                  {loadError}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="effectiveOn">
              Effective Date
            </Label>

            <Input
              id="effectiveOn"
              type="date"
              value={effectiveOn}
              onChange={e =>
                setEffectiveOn(e.target.value)
              }
              disabled={pending}
              required
              className="shadow-none"
            />

            <p className="text-xs text-muted-foreground">
              Choose a date within the relevant
              academic session and not before the
              student's enrollment date.
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs leading-5">
              {request.mode === "promote"
                ? "Promotion creates a new enrollment in another session. The previous session remains unchanged."
                : request.mode === "transfer"
                  ? "Transfer ends the current placement and starts another placement in the same session. Existing results remain recorded."
                  : "Removal ends the selected active placements. Student registration and academic history are retained."}
            </p>
          </div>

          {state.message && !state.ok && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
              className="shadow-none"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                pending ||
                !effectiveOn ||
                !validDestination
              }
              variant={
                request.mode === "remove"
                  ? "destructive"
                  : "default"
              }
              className="shadow-none"
            >
              {pending && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {pending
                ? "Processing..."
                : `Confirm ${actionLabels[request.mode]}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// List oe enrolled students by session/classes

export function StudentDirectoryByEnrollment({ data }: Props) {
  const router = useRouter()

  const [search, setSearch] = useState(data.search)
  const [selected, setSelected] =
    useState<string[]>([])
  const [request, setRequest] =
    useState<ActionRequest | null>(null)

  const selectedClass = data.classes.find(
    c => c.id === data.classId
  )

  function href(changes: Record<string, string>) {
    const params = new URLSearchParams({
      session: data.sessionId,
      class: data.classId,
      term: data.termId,
      search: data.search,
      page: String(data.page),
      ...changes,
    })

    return `/school/students?${params}`
  }

  function navigate(changes: Record<string, string>) {
    setSelected([])
    router.push(href(changes))
  }

  const visibleIds = data.students.map(
    s => s.enrollment_id
  )

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every(id => selected.includes(id))

  function toggle(id: string, value: boolean) {
    setSelected(previous =>
      value
        ? [...new Set([...previous, id])]
        : previous.filter(item => item !== id)
    )
  }

  function openAction(
    mode: Mode,
    scope: Scope,
    enrollmentIds: string[] = selected
  ) {
    setRequest({
      mode,
      scope,
      enrollmentIds,
    })
  }

  const totalPages = Math.max(
    1,
    Math.ceil(data.total / 100)
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Student Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.schoolName} · Class registers
          and student placement
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[235px_minmax(0,1fr)]">
        {/* Session and class navigation */}
        <aside className="rounded-xl border bg-background p-3">
          <div className="flex items-center gap-2 border-b pb-3">
            <GraduationCap className="size-5 text-primary" />
            <p className="text-sm font-semibold">
              Academic Sessions
            </p>
          </div>

          <nav
            className="mt-3 space-y-2"
            aria-label="Academic sessions and classes"
          >
            {data.sessions.map(session => {
              const expanded =
                session.id === data.sessionId

              return (
                <div key={session.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        session: session.id,
                        class: "",
                        term: "",
                        search: "",
                        page: "1",
                      })
                    }
                    aria-expanded={expanded}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                      expanded
                        ? "bg-primary/10 font-semibold text-primary"
                        : ""
                    }`}
                  >
                    <span>
                      {session.name}
                      {session.is_current && (
                        <span className="ml-1 text-[10px]">
                          · Current
                        </span>
                      )}
                    </span>

                    {expanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>

                  {expanded && (
                    <div className="ml-3 mt-1 space-y-1 border-l pl-2">
                      {data.classes.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          No classes configured
                        </p>
                      ) : (
                        data.classes.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              navigate({
                                class: c.id,
                                term: "",
                                search: "",
                                page: "1",
                              })
                            }
                            className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                              c.id === data.classId
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Register */}
        <article className="min-w-0 space-y-4">
          <Card className="gap-3 p-4 shadow-none sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedClass?.name ??
                    "Choose a Class"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {data.sessions.find(
                    s => s.id === data.sessionId
                  )?.name}
                  {" · "}
                  Active class register
                </p>
              </div>

              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                <Users className="mr-1 size-3" />
                {data.total} enrolled
              </Badge>
            </div>

            {/* Term tabs */}
            {data.terms.length > 0 && (
              <div
                role="tablist"
                aria-label="Academic term"
                className="flex flex-wrap gap-2 border-b pb-3"
              >
                {data.terms.map(term => (
                  <button
                    key={term.id}
                    role="tab"
                    type="button"
                    aria-selected={
                      term.id === data.termId
                    }
                    onClick={() =>
                      navigate({
                        term: term.id,
                        page: "1",
                      })
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      term.id === data.termId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {term.name}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Class placement is recorded by session.
              Term tabs provide academic context;
              they do not change the active register.
            </p>

            {/* Search */}
            <form
              onSubmit={e => {
                e.preventDefault()
                navigate({
                  search: search.trim(),
                  page: "1",
                })
              }}
              className="flex gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search name or admission number..."
                  className="pl-9 shadow-none"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="shadow-none"
              >
                Search
              </Button>
            </form>

            {/* Bulk action toolbar */}
            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Badge>
                  {selected.length} selected
                </Badge>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    openAction("promote", "selected")
                  }
                >
                  Promote
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    openAction("transfer", "selected")
                  }
                >
                  Transfer
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    openAction("remove", "selected")
                  }
                >
                  Remove
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Select students or manage the
                  entire class.
                </p>

                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted">
                    <CheckSquare className="size-4" />
                    Whole Class
                    <ChevronDown className="size-4" />
                  </summary>

                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border bg-background p-1">
                    {(
                      ["promote", "transfer", "remove"] as Mode[]
                    ).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        disabled={!data.total}
                        onClick={() =>
                          openAction(mode, "class", [])
                        }
                        className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                      >
                        {actionLabels[mode]} Entire Class
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {data.error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {data.error}
              </p>
            )}

            {/* Roster table */}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <Checkbox
                        aria-label="Select students on this page"
                        checked={
                          allVisibleSelected
                            ? true
                            : selected.length > 0 &&
                                visibleIds.some(id =>
                                  selected.includes(id)
                                )
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={checked => {
                          setSelected(
                            checked === true
                              ? visibleIds
                              : []
                          )
                        }}
                      />
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Student
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Admission Number
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Enrolled
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {data.students.map(student => (
                    <tr
                      key={student.enrollment_id}
                      className="hover:bg-primary/5"
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          aria-label={`Select ${student.first_name} ${student.last_name}`}
                          checked={selected.includes(
                            student.enrollment_id
                          )}
                          onCheckedChange={checked =>
                            toggle(
                              student.enrollment_id,
                              checked === true
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <Link
                          href={`/school/students/${student.student_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          <StudentName
                            first={student.first_name}
                            last={student.last_name}
                            other={student.other_names}
                          />
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">
                          View student record
                        </p>
                      </td>

                      <td className="px-3 py-3">
                        {student.admission_number ?? "—"}
                      </td>

                      <td className="px-3 py-3 text-xs">
                        {student.enrolled_on}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <details className="relative inline-block text-left">
                          <summary
                            aria-label="Student actions"
                            className="inline-flex cursor-pointer list-none items-center justify-center rounded-md p-2 hover:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </summary>

                          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-background p-1 text-left">
                            <Link
                              href={`/school/students/${student.student_id}`}
                              className="block rounded-md px-3 py-2 text-xs hover:bg-muted"
                            >
                              View Record
                            </Link>

                            {(
                              ["promote", "transfer", "remove"] as Mode[]
                            ).map(mode => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() =>
                                  openAction(
                                    mode,
                                    "selected",
                                    [student.enrollment_id]
                                  )
                                }
                                className={`block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted ${
                                  mode === "remove"
                                    ? "text-destructive"
                                    : ""
                                }`}
                              >
                                {actionLabels[mode]}
                              </button>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.students.length === 0 && (
                <div className="p-10 text-center">
                  <Users className="mx-auto mb-3 size-8 text-primary" />
                  <p className="text-sm font-semibold">
                    No enrolled students found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose another class or enroll
                    students from the enrollment module.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {totalPages}
                {" · "}
                {data.total} student(s)
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() =>
                    navigate({
                      page: String(data.page - 1),
                    })
                  }
                  className="shadow-none"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= totalPages}
                  onClick={() =>
                    navigate({
                      page: String(data.page + 1),
                    })
                  }
                  className="shadow-none"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>

          <Link
            href="/school/enrollment"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Enroll more students
            <ArrowRight className="size-4" />
          </Link>
        </article>
      </div>

      {request && (
        <DirectoryActionDialog
          key={`${request.mode}:${request.scope}:${request.enrollmentIds.join(",")}`}
          request={request}
          data={data}
          onClose={() => setRequest(null)}
          onSuccess={() => {
            setRequest(null)
            setSelected([])
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
