"use client"

import { BookUser, GraduationCap } from "lucide-react"
import type { AssignmentSource } from "../../services/assignment/types"

type Props = {
  selected: AssignmentSource
  schoolEnabled: boolean
  onChange: (source: AssignmentSource) => void
  disabled?: boolean
}

export function AssignmentSourceSelector({ selected, schoolEnabled, onChange, disabled }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" disabled={disabled} onClick={() => onChange("directory")}
        className={`rounded-xl border p-4 text-left transition-colors hover:border-sky-500/50 ${selected === "directory" ? "border-sky-500/50 bg-sky-500/10" : "border-primary/20 bg-background"}`}>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300"><BookUser className="size-5" /></div>
        <p className="font-semibold">Candidate Directory</p>
        <p className="mt-1 text-xs text-muted-foreground">Select existing CBT candidates and assign them together.</p>
      </button>
      {schoolEnabled && (
        <button type="button" disabled={disabled} onClick={() => onChange("school")}
          className={`rounded-xl border p-4 text-left transition-colors hover:border-amber-500/50 ${selected === "school" ? "border-amber-500/50 bg-amber-500/10" : "border-primary/20 bg-background"}`}>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300"><GraduationCap className="size-5" /></div>
          <p className="font-semibold">School Register</p>
          <p className="mt-1 text-xs text-muted-foreground">Select JSS 2, an entire level, or one class and arm.</p>
        </button>
      )}
    </div>
  )
}
