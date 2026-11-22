
"use client"

import { CheckCircle2, Pencil, UserRoundX, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import type { DirectoryCandidate } from "../services/directory-types"
import { ExamDirectoryCandidate } from "../services/directory-queries"

type Props = {
 candidates: ExamDirectoryCandidate[]
  onEdit: (candidate: DirectoryCandidate) => void
  isSchool?: boolean
  assignmentMode?: boolean
  selectedIds?: ReadonlySet<string>
  onToggle?: (id: string, checked: boolean) => void
  onTogglePage?: (checked: boolean) => void
  allPageSelected?: boolean
  somePageSelected?: boolean
  limitReached?: boolean
  disabled?: boolean

  //  candidates: ExamDirectoryCandidate[]
}

const sourceText: Record<
  DirectoryCandidate["source"],
  string
> = {
  manual: "Manually added",
  import: "Imported",
  registered: "Registered",
  school: "School",
  open: "Public link",
}

export function CandidateDirectoryTable({
  candidates,
  onEdit,
  isSchool = false,
  assignmentMode = false,
  selectedIds,
  onToggle,
  onTogglePage,
  allPageSelected = false,
  somePageSelected = false,
  limitReached = false,
  disabled = false,
}: Props) {
  const people = isSchool ? "students" : "candidates"

  if (!candidates.length) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-5 py-12 text-center">
        <UserRoundX className="mx-auto size-9 text-primary/60" />

        <h3 className="mt-3 text-sm font-bold">
          No matching {people}
        </h3>

        <p className="mt-1 text-sm text-foreground/80">
          Try another search or add a new{" "}
          {isSchool ? "student" : "candidate"}.
        </p>
      </div>
    )
  }

  const gridClasses = assignmentMode
    ? "md:grid-cols-[40px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
    : "md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-background">

      {/* Desktop header */}
      <div
        className={`hidden items-center gap-4 border-b border-primary/15 bg-primary/5 px-4 py-3 text-xs font-semibold text-foreground/85 md:grid ${gridClasses}`}
      >
        {assignmentMode && (
          <Checkbox
            checked={
              allPageSelected
                ? true
                : somePageSelected
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={checked =>
              onTogglePage?.(checked === true)
            }
            disabled={
              disabled ||
              !candidates.some(
                candidate => candidate.status === "active"
              )
            }
            aria-label={`Select active ${people} on this page`}
          />
        )}

        <span>{isSchool ? "Student" : "Candidate"}</span>
        <span>{isSchool ? "Student ID" : "Candidate code"}</span>
        <span>Source</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      <div className="divide-y divide-primary/10">
        {candidates.map(candidate => {
          const active = candidate.status === "active"
          const selected = selectedIds?.has(candidate.id) ?? false

 

          const name = [
            candidate.first_name,
            candidate.last_name,
          ]
            .filter(Boolean)
            .join(" ")

          const alreadyAssigned =
            candidate.exam_assignment_status === "assigned"

          const previouslyRemoved =
            candidate.exam_assignment_status === "revoked"

          const selectionDisabled =
            disabled ||
            !active ||
            alreadyAssigned ||
            (!selected && limitReached)

          return (
            <div
              key={candidate.id}
              className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors md:grid md:gap-4 ${gridClasses} ${
                selected
                  ? "bg-primary/5"
                  : "hover:bg-primary/[0.025]"
              }`}
            >
              {/* Selection checkbox */}
              {assignmentMode && (
                <div className="flex shrink-0 items-center">
                  <Checkbox
                    checked={selected}
                    disabled={selectionDisabled}
                    onCheckedChange={checked =>
                      onToggle?.(
                        candidate.id,
                        checked === true
                      )
                    }
                    aria-label={`Select ${name}`}
                  />
                </div>
              )}

              {/* Candidate identity */}
              <div className="flex min-w-[150px] flex-1 items-center gap-3 md:min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Users className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {name}
                  </p>

                  <p className="text-xs text-foreground/70">
                    {candidate.membership_id
                      ? "Linked member"
                      : "Directory record"}
                  </p>
                </div>
              </div>

              {/* Directory code, not the Exam Number */}
              <p className="min-w-[100px] flex-1 truncate text-xs font-semibold text-foreground/80 md:min-w-0">
                {candidate.candidate_code ?? "Not assigned"}
              </p>

              {/* Source */}
              <div className="min-w-[95px] flex-1 md:min-w-0">
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {sourceText[candidate.source] ??
                    candidate.source}
                </Badge>
              </div>

              {/* Status */}
              <div className="min-w-[95px] md:min-w-0">
                {assignmentMode && alreadyAssigned ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="mr-1 size-3.5" />
                    Already added
                  </Badge>
                ) : assignmentMode && previouslyRemoved ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  >
                    Previously removed
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className={
                      active
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    }
                  >
                    {active ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>

              {/* Edit stays available in both modes */}
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 shadow-none"
                onClick={() => onEdit(candidate)}
                disabled={disabled}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>

              {assignmentMode && !active && (
                <p className="w-full text-xs font-medium text-amber-800 dark:text-amber-300 md:col-span-full">
                  This candidate is inactive and cannot be
                  assigned.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile select-all */}
      {assignmentMode && (
        <div className="flex items-center justify-between gap-3 border-t border-primary/15 bg-primary/5 px-4 py-3 md:hidden">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={
                allPageSelected
                  ? true
                  : somePageSelected
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={checked =>
                onTogglePage?.(checked === true)
              }
              disabled={disabled}
            />
            Select this page
          </label>

          <span className="text-xs text-foreground/75">
            Active {people} only
          </span>
        </div>
      )}
    </div>
  )
}
