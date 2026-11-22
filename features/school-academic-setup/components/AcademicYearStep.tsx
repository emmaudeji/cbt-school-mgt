
"use client"

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  School,
  X,
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

 

import type {
} from "../services/queries"
import { AcademicSetupData } from "@/types/school-integration"
import { createAcademicPeriod,  } from "../services/actions"
import { urls } from "@/constants"
import { initialSetupState } from "../services/action-states"

type Props = {
  data: AcademicSetupData
  initialSessionId: string
  initialTermId: string
}

type CreateKind = "session" | "term"

function CreatePeriodForm({
  kind,
  sessionId,
  onCreated,
  onCancel,
}: {
  kind: CreateKind
  sessionId: string
  onCreated: (
    kind: CreateKind,
    id: string
  ) => void
  onCancel: () => void
}) {
  const [state, action, pending] =
    useActionState(
      createAcademicPeriod,
      initialSetupState
    )

  useEffect(() => {
    if (state.ok && state.id) {
      onCreated(kind, state.id)
    }
  }, [state, kind, onCreated])

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <input
        type="hidden"
        name="kind"
        value={kind}
      />

      <input
        type="hidden"
        name="sessionId"
        value={sessionId}
      />

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {kind === "session"
            ? "Add Academic Session"
            : "Add School Term"}
        </h3>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Close"
          className="shadow-none"
        >
          <X className="size-4" />
        </Button>
      </div>

      {kind === "session" ? (
        <div className="space-y-2">
          <Label htmlFor="new-session">
            Session Name
          </Label>

          <Input
            id="new-session"
            name="name"
            required
            placeholder="2027/2028"
            pattern="[0-9]{4}/[0-9]{4}"
            maxLength={9}
            className="bg-background shadow-none"
          />

          <p className="text-xs text-muted-foreground">
            Use the format YYYY/YYYY.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="new-term">
            School Term
          </Label>

          <select
            id="new-term"
            name="name"
            required
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Choose a term
            </option>
            <option value="First Term">
              First Term
            </option>
            <option value="Second Term">
              Second Term
            </option>
            <option value="Third Term">
              Third Term
            </option>
          </select>
        </div>
      )}

      {state.message && (
        <p
          role="status"
          className={
            state.ok
              ? "text-xs text-emerald-700 dark:text-emerald-400"
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

        <Button
          type="submit"
          disabled={pending}
          className="shadow-none"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}

          {pending ? "Saving..." : "Create"}
        </Button>
      </div>
    </form>
  )
}

export function AcademicYearStep({
  data,
  initialSessionId,
  initialTermId,
}: Props) {
  const router = useRouter()

  const [sessionId, setSessionId] =
    useState(initialSessionId)

  const [termId, setTermId] =
    useState(initialTermId)

  const [creating, setCreating] =
    useState<CreateKind | null>(null)

  const sessions = data.sessions

  const terms = useMemo(
    () =>
      data.terms.filter(
        (term) => term.session_id === sessionId
      ),
    [data.terms, sessionId]
  )

  const selectedSession = sessions.find(
    (session) => session.id === sessionId
  )

  const selectedTerm = terms.find(
    (term) => term.id === termId
  )

  function saveSelection(
    nextSessionId: string,
    nextTermId: string
  ) {
    const params = new URLSearchParams()

    if (nextSessionId) {
      params.set("session", nextSessionId)
    }

    if (nextTermId) {
      params.set("term", nextTermId)
    }

    const query = params.toString()

    router.replace(
      `${urls.schoolAcademicSetup}${query ? `?${query}` : ""}`,
      { scroll: false }
    )
  }

  function changeSession(value: string) {
    setSessionId(value)

    const nextTerm =
      data.terms.find(
        (term) =>
          term.session_id === value &&
          term.is_current
      ) ??
      data.terms.find(
        (term) => term.session_id === value
      )

    const nextTermId = nextTerm?.id ?? ""

    setTermId(nextTermId)
    setCreating(null)

    saveSelection(value, nextTermId)
  }

  function changeTerm(value: string) {
    setTermId(value)
    setCreating(null)

    saveSelection(sessionId, value)
  }

  function handleCreated(
    kind: CreateKind,
    id: string
  ) {
    setCreating(null)

    if (kind === "session") {
      setSessionId(id)
      setTermId("")
      saveSelection(id, "")
    } else {
      setTermId(id)
      saveSelection(sessionId, id)
    }

    router.refresh()
  }

  const ready = Boolean(
    selectedSession && selectedTerm
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <School className="size-4 text-primary" />
          School Integration
          <ChevronRight className="size-3.5" />
          Academic Setup
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Set Up Academic Year
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {data.school.name}
            </p>
          </div>

          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Step 1 of 4
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-4 gap-2">
        {[
          "Academic Year",
          "Classes & Subjects",
          "Assessments",
          "Review",
        ].map((step, index) => (
          <div
            key={step}
            className="space-y-2"
          >
            <div
              className={
                index === 0
                  ? "h-1.5 rounded-full bg-primary"
                  : "h-1.5 rounded-full bg-muted"
              }
            />

            <p
              className={
                index === 0
                  ? "text-xs font-medium text-primary"
                  : "text-xs text-muted-foreground"
              }
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* Main section */}
      <Card className="gap-0 overflow-hidden border-border p-0 shadow-none">
        <CardHeader className="border-b bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-lg">
                Academic Session & Term
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Choose the academic period you
                want to prepare.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className=" p-5 sm:p-6">
          {/* Session */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">
                Academic Session
              </Label>

              <p className="text-xs text-muted-foreground">
                Select an existing session
                or create a new one.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={sessionId}
                onValueChange={changeSession}
              >
                <SelectTrigger className="min-w-0 flex-1 bg-background shadow-none">
                  <SelectValue placeholder="Choose academic session" />
                </SelectTrigger>

                <SelectContent>
                  {sessions.map((session) => (
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

              <Button
                type="button"
                variant="outline"
                onClick={() => setCreating("session")}
                className="shrink-0 shadow-none"
              >
                <Plus className="size-4" />
                New
              </Button>
            </div>

            {creating === "session" && (
              <CreatePeriodForm
                kind="session"
                sessionId={sessionId}
                onCreated={handleCreated}
                onCancel={() => setCreating(null)}
              />
            )}

            {selectedSession?.is_current && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Current school session
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Term */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">
                School Term
              </Label>

              <p className="text-xs text-muted-foreground">
                Select the term within the
                chosen academic session.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={termId}
                onValueChange={changeTerm}
                disabled={!sessionId || terms.length === 0}
              >
                <SelectTrigger className="min-w-0 flex-1 bg-background shadow-none">
                  <SelectValue placeholder="Choose school term" />
                </SelectTrigger>

                <SelectContent>
                  {terms.map((term) => (
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

              <Button
                type="button"
                variant="outline"
                disabled={!sessionId}
                onClick={() => setCreating("term")}
                className="shrink-0 shadow-none"
              >
                <Plus className="size-4" />
                New
              </Button>
            </div>

            {creating === "term" && (
              <CreatePeriodForm
                kind="term"
                sessionId={sessionId}
                onCreated={handleCreated}
                onCancel={() => setCreating(null)}
              />
            )}

            {selectedTerm?.is_current && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Current school term
              </div>
            )}
          </div>

          {/* Selection summary */}
          {ready ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Academic period selected
                  </p>

                  <p className="text-sm">
                    {selectedSession?.name}
                    {" · "}
                    {selectedTerm?.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Ready for class and subject
                    setup.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <p className="text-sm">
                Choose a session and term
                to continue.
              </p>
            </div>
          )}

          {/* Next phase */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="size-4 text-primary" />

              Up next: Classes & Subjects
            </div>

            <Button
                disabled={!ready}
                className="shadow-none"
                onClick={() => {
                    const params = new URLSearchParams({
                    step: "2",
                    session: sessionId,
                    term: termId,
                    })

                    router.push(
                    `${urls.schoolAcademicSetup}?${params}`
                    )
                }}
                >
                Continue to Classes & Subjects
                <ArrowRight className="size-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            The next step will be enabled when
            we implement class and subject setup.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
