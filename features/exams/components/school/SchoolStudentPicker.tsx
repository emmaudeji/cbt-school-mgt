"use client"

import { CheckCircle2, Search, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { SchoolStudentRow } from "../../services/assignment/school-actions"

type Props = {
  rows: SchoolStudentRow[]
  selected: string[]
  search: string
  loading?: boolean
  truncated?: boolean
  disabled?: boolean
  onSearch: (value: string) => void
  onSelect: (ids: string[]) => void
}

export function SchoolStudentPicker({ rows, selected, search, truncated, loading, disabled, onSearch, onSelect }: Props) {
  const selectable = rows.filter(row => !row.assigned)
  const selection = new Set(selected)
  const allSelected = selectable.length > 0 && selectable.every(row => selection.has(row.id))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
          <Input className="h-10 pl-9" value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Find a student or admission number" disabled={disabled} />
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || !selectable.length}
          onClick={() => onSelect(allSelected ? [] : selectable.map(row => row.id))}>
          {allSelected ? "Clear selection" : `Select available (${selectable.length})`}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/75">
        <span>{rows.length} shown · {selected.length} selected · {rows.filter(row => row.assigned).length} already assigned</span>
        {truncated && <span className="font-medium text-amber-700 dark:text-amber-300">More than 500 matches. Narrow the class or search.</span>}
      </div>

      <div className="max-h-[450px] divide-y divide-primary/10 overflow-auto rounded-xl border border-primary/20 bg-background">
        {!rows.length ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-foreground/75">
            <UsersRound className="size-7 text-primary/60" />
            {loading ? "Loading students…" : "No active students match this selection."}
          </div>
        ) : rows.map(row => {
          const checked = selection.has(row.id)
          return (
            <label key={row.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4 ${row.assigned ? "bg-primary/[0.035]" : "cursor-pointer hover:bg-primary/5"}`}>
              <Checkbox checked={row.assigned || checked} disabled={disabled || row.assigned || (!checked && selected.length >= 500)}
                onCheckedChange={v => onSelect(v === true ? [...selected, row.id] : selected.filter(id => id !== row.id))} />
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-800 dark:text-amber-200">
                {(row.firstName[0] ?? "").toUpperCase()}{(row.lastName[0] ?? "").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.firstName} {row.lastName}</p>
                <p className="truncate text-xs text-foreground/70">{row.code || "No admission number"} · {row.className}</p>
              </div>
              {row.assigned ? (
                <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Assigned</Badge>
              ) : row.revoked ? (
                <Badge variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-200">Restore access</Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">Ready</Badge>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
