
"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Loader2,
  Search,
  UsersRound,
} from "lucide-react"

import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  getInitialSchoolStudentsAction,
  type AccessMode,
  type AssignmentChoice,
  type InitialStudent,
} from "@/features/exams/services/assignment/school-publication-actions"

type Props = {
  examId: string
  slug: string
  accessMode: AccessMode | null
  choice: AssignmentChoice
  onChoice: (value: AssignmentChoice) => void
  selectedIds: string[]
  onSelectedIds: (ids: string[]) => void
  disabled?: boolean
}

export function SchoolPublicationChoice({
  examId,
  slug,
  accessMode,
  choice,
  onChoice,
  selectedIds,
  onSelectedIds,
  disabled,
}: Props) {
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<InitialStudent[]>([])
  const [nextCursor, setNextCursor] =
    useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPublic = accessMode === "open_link"

  useEffect(() => {
    if (!isPublic || choice === "later") return
    onChoice("later")
  }, [isPublic, choice, onChoice])

  useEffect(() => {
    if (choice !== "specific" || isPublic) return

    let active = true

    const timer = setTimeout(async () => {
      setLoading(true)

      const result =
        await getInitialSchoolStudentsAction(
          examId,
          slug,
          search
        )

      if (!active) return

      if (result.success) {
        setRows(result.data.rows)
        setNextCursor(result.data.nextCursor)
        setHasMore(result.data.hasMore)
        setError("")
      } else {
        setRows([])
        setHasMore(false)
        setError(result.error)
      }

      setLoading(false)
    }, search ? 250 : 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [choice, examId, slug, search, isPublic])

  async function more() {
    if (!nextCursor || loading) return

    setLoading(true)

    const result = await getInitialSchoolStudentsAction(
      examId,
      slug,
      search,
      nextCursor
    )

    if (result.success) {
      setRows(old => [
        ...old,
        ...result.data.rows,
      ])
      setNextCursor(result.data.nextCursor)
      setHasMore(result.data.hasMore)
      setError("")
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const picked = new Set(selectedIds)

  return (
    <section className="space-y-3 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
      <div className="flex items-center gap-2">
        <UsersRound className="size-4 text-blue-600" />
        <h3 className="text-sm font-semibold">
          Who should take this examination?
        </h3>
      </div>

      <p className="text-xs leading-5 text-foreground/75">
        Initial students come from the classes chosen
        during examination setup. You can assign students
        from any other class later.
      </p>

      <RadioGroup
        value={choice}
        onValueChange={value =>
          onChoice(value as AssignmentChoice)
        }
        disabled={disabled}
        className="space-y-2"
      >
        <div className="flex items-start gap-2">
          <RadioGroupItem
            id="school-auto-all"
            value="all"
            disabled={isPublic}
          />
          <Label
            htmlFor="school-auto-all"
            className="text-sm leading-5"
          >
            Automatically assign all students in the
            selected classes
          </Label>
        </div>

        <div className="flex items-start gap-2">
          <RadioGroupItem
            id="school-auto-specific"
            value="specific"
            disabled={isPublic}
          />
          <Label
            htmlFor="school-auto-specific"
            className="text-sm leading-5"
          >
            Let me select specific students
          </Label>
        </div>

        <div className="flex items-start gap-2">
          <RadioGroupItem
            id="school-auto-later"
            value="later"
          />
          <Label
            htmlFor="school-auto-later"
            className="text-sm leading-5"
          >
            I'll assign students later
          </Label>
        </div>
      </RadioGroup>

      {isPublic && (
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Public-link access uses self-registration.
          Preassigning private school credentials is not
          supported in this mode. You can manage candidates
          after publication.
        </p>
      )}

      {choice === "all" && !isPublic && (
        <p className="rounded-lg border bg-background p-3 text-xs leading-5">
          Students enrolled in the examination's selected
          classes will be assigned.
          {accessMode === "registered"
            ? " Students without ready accounts will be reported and can be assigned later."
            : " Each assigned student receives a personal Exam Number."}
        </p>
      )}

      {choice === "specific" && !isPublic && (
        <div className="space-y-2 rounded-lg border bg-background p-3">
          <p className="text-xs font-semibold">
            {selectedIds.length} students selected
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              disabled={disabled}
              className="pl-9 shadow-none"
              placeholder="Search names or admission numbers"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex gap-2 text-xs text-destructive"
            >
              <AlertCircle className="size-4" />
              {error}
            </p>
          )}

          <div className="max-h-64 divide-y overflow-y-auto rounded-md border">
            {rows.map(student => {
              const ready =
                accessMode !== "registered" ||
                student.loginReady

              const checked = picked.has(student.id)

              return (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30"
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled || !ready}
                    onCheckedChange={state =>
                      onSelectedIds(
                        state === true
                          ? [...selectedIds, student.id]
                          : selectedIds.filter(
                              id => id !== student.id
                            )
                      )
                    }
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="block truncate text-xs text-foreground/70">
                      {student.className} ·{" "}
                      {student.code ??
                        "No admission number"}
                    </span>
                  </span>

                  {!ready && (
                    <span className="text-xs text-amber-700">
                      Account needed
                    </span>
                  )}
                </label>
              )
            })}

            {!loading && rows.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">
                No students found.
              </p>
            )}
          </div>

          {hasMore && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || disabled}
              onClick={() => void more()}
            >
              {loading && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              Load more students
            </Button>
          )}

          {selectedIds.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onSelectedIds([])}
            >
              Clear selection
            </Button>
          )}

          <p className="text-xs text-foreground/65">
            Selection stays in place when you search
            or load more results.
          </p>
        </div>
      )}
    </section>
  )
}
