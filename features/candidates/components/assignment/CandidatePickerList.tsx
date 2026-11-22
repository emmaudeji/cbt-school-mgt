"use client"

import { CheckCircle2, Clock3, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { PickerRow } from "../../services/assignment/types"

type Props = {
  rows: PickerRow[]
  selected: string[]
  search: string
  onSearch: (text: string) => void
  onSelected: (ids: string[]) => void
  truncated?: boolean
  disabled?: boolean
}

export function CandidatePickerList({ rows, selected, search, onSearch, onSelected, truncated, disabled }: Props) {
  const eligible = rows.filter(row => !row.assigned && row.loginReady)
  const selectedIds = new Set(selected)
  const selectAll = () => onSelected([...new Set([...selected, ...eligible.map(row => row.id)])].slice(0, 500))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Find a name, code or admission number" value={search} onChange={e => onSearch(e.target.value)} />
        </div>
        <Button type="button" size="sm" variant="outline" disabled={disabled || eligible.length === 0} onClick={selectAll}>Select all displayed ({eligible.length})</Button>
        <Button type="button" size="sm" variant="ghost" disabled={disabled || selected.length === 0} onClick={() => onSelected([])}>Clear</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{rows.length} displayed · {selected.length} selected</span>
        {truncated && <span className="text-amber-700 dark:text-amber-300">More results exist. Narrow your search or class selection.</span>}
      </div>
      <div className="max-h-[420px] divide-y divide-primary/10 overflow-y-auto rounded-xl border border-primary/20">
        {!rows.length ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"><Users className="size-7" />No candidates match these filters.</div>
        ) : rows.map(row => {
          const checked = selectedIds.has(row.id)
          return (
            <label key={row.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${row.assigned ? "bg-primary/[0.025]" : "cursor-pointer hover:bg-primary/5"}`}>
              <Checkbox checked={row.assigned || checked} disabled={disabled || row.assigned || !row.loginReady || (!checked && selected.length >= 500)}
                onCheckedChange={value => onSelected(value === true ? [...new Set([...selected,row.id])] : selected.filter(id => id !== row.id))} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.firstName} {row.lastName}</p>
                <p className="truncate text-xs text-muted-foreground">{row.code || "Code generated when assigned"}{row.className ? ` · ${row.className}` : ""}</p>
              </div>
              {row.assigned ? (
                <Badge variant="secondary"><CheckCircle2 className="size-3" /> Assigned</Badge>
              ) : !row.loginReady ? (
                <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300"><Clock3 className="size-3" /> Account needed</Badge>
              ) : row.revoked ? <Badge variant="outline">Previously revoked</Badge> : <Badge variant="outline">Ready</Badge>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
