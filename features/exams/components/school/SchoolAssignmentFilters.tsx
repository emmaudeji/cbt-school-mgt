"use client"

import { Check, GraduationCap } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SchoolOption } from "../../services/assignment/school-actions"

type Props = {
  sessions: SchoolOption[]
  levels: SchoolOption[]
  classes: SchoolOption[]
  sessionId: string
  levelId: string
  classIds: string[]
  disabled?: boolean
  onSession: (id: string) => void
  onLevel: (id: string) => void
  onClasses: (ids: string[]) => void
}

export function SchoolAssignmentFilters({
  sessions, levels, classes, sessionId, levelId, classIds,
  disabled, onSession, onLevel, onClasses
}: Props) {
  const availableClasses = classes.filter(item => item.levelId === levelId)
  const selected = new Set(classIds)

  function toggleClass(id: string) {
    onClasses(selected.has(id) ? classIds.filter(value => value !== id) : [...classIds, id])
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 sm:p-4">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <GraduationCap className="size-4" />
        <h3 className="text-sm font-semibold">Choose students from the school register</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Academic session</Label>
          <Select value={sessionId || undefined} disabled={disabled || !sessions.length} onValueChange={onSession}>
            <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Choose session" /></SelectTrigger>
            <SelectContent>
              {sessions.map(item => <SelectItem key={item.id} value={item.id}>
                {item.name}{item.isCurrent ? " (current)" : ""}
              </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Class level</Label>
          <Select value={levelId || undefined} disabled={disabled || !sessionId} onValueChange={onLevel}>
            <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Select class level" /></SelectTrigger>
            <SelectContent>
              {levels.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {levelId && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Classes / arms</Label>
            <Button type="button" variant="outline" size="sm" disabled={disabled}
              onClick={() => onClasses([])}>
              {classIds.length ? "Use all arms" : "All arms selected"}
            </Button>
          </div>
          <p className="text-xs text-foreground/75">
            {classIds.length === 0
              ? "All arms in this class level are included. Select individual classes to narrow the list."
              : `${classIds.length} class${classIds.length === 1 ? "" : "es"} selected. Click again to remove a class.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableClasses.map(item => (
              <button key={item.id} type="button" disabled={disabled} onClick={() => toggleClass(item.id)}
                aria-pressed={selected.has(item.id)}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${selected.has(item.id) ? "border-amber-600/50 bg-amber-500/15 text-foreground" : "border-primary/20 bg-background hover:bg-amber-500/10"}`}>
                {selected.has(item.id) && <Check className="size-3.5" />}
                {item.name}
              </button>
            ))}
            {!availableClasses.length && <p className="text-sm text-foreground/70">No classes configured for this level and session.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
