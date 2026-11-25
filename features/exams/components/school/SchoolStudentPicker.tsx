
"use client"

import { CheckCircle2, Search, UserRoundX, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { SchoolStudentRow } from "../../services/assignment/school-actions"

type Props = {
  rows: SchoolStudentRow[]
  selected: string[]
  search: string
  accessMode: string | null
  loading?: boolean
  truncated?: boolean
  disabled?: boolean
  onSearch: (value: string) => void
  onSelect: (ids: string[]) => void
}

export function SchoolStudentPicker({
  rows, selected, search, accessMode, truncated, loading,
  disabled, onSearch, onSelect,
}: Props) {
  const registered = accessMode === "registered"
  const selectable = rows.filter(
    row => !row.assigned && (!registered || row.loginReady)
  )
  const selectedSet = new Set(selected)
  const allSelected = selectable.length > 0 &&
    selectable.every(row => selectedSet.has(row.id))
  const missingAccounts = registered
    ? rows.filter(row => !row.loginReady).length : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
          <Input value={search} onChange={e => onSearch(e.target.value)}
            disabled={disabled} className="h-9 bg-background pl-9 shadow-none"
            placeholder="Search name or admission number" />
        </div>
        <Button type="button" variant="outline" size="sm"
          disabled={disabled || !selectable.length}
          onClick={() => onSelect(allSelected ? [] : selectable.map(row => row.id))}
          className="shadow-none">
          {allSelected ? "Clear Selection" : `Select Available (${selectable.length})`}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-foreground/80">
        <span>{rows.length} shown</span>
        <span>· {selected.length} selected</span>
        <span>· {rows.filter(row => row.assigned).length} assigned</span>
        {missingAccounts > 0 && (
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            · {missingAccounts} need accounts
          </span>
        )}
      </div>

      {truncated && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2 text-xs">
          More than 500 matches. Narrow your search or class selection.
        </p>
      )}

      <div className="max-h-[430px] divide-y overflow-y-auto rounded-lg border">
        {!rows.length ? (
          <div className="p-8 text-center">
            <UsersRound className="mx-auto size-6 text-primary" />
            <p className="mt-2 text-sm font-medium">
              {loading ? "Loading students..." : "No matching students"}
            </p>
          </div>
        ) : rows.map(row => {
          const checked = selectedSet.has(row.id)
          const needsAccount = registered && !row.loginReady
          const locked = disabled || row.assigned || needsAccount ||
            (!checked && selected.length >= 500)

          return (
            <label key={row.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${
                locked ? "bg-muted/20" : "cursor-pointer hover:bg-primary/5"
              }`}>
              <Checkbox checked={row.assigned || checked}
                disabled={locked}
                onCheckedChange={v => onSelect(v === true
                  ? [...selected, row.id]
                  : selected.filter(id => id !== row.id))} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {row.firstName} {row.lastName}
                </p>
                <p className="truncate text-xs text-foreground/75">
                  {row.code ?? "No admission number"} · {row.className}
                </p>
              </div>

              {row.assigned ? (
                <Badge variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="mr-1 size-3" /> Assigned
                </Badge>
              ) : needsAccount ? (
                <Badge variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <UserRoundX className="mr-1 size-3" /> Account Required
                </Badge>
              ) : row.revoked ? (
                <Badge variant="outline">Restore Access</Badge>
              ) : (
                <Badge variant="outline" className="border-blue-500/25">
                  Ready
                </Badge>
              )}
            </label>
          )
        })}
      </div>

      {registered && missingAccounts > 0 && (
        <p className="text-xs leading-5 text-foreground/80">
          Students without active accounts cannot use account sign-in.
          Switch to Exam Number access if you want to assign them without accounts.
        </p>
      )}
    </div>
  )
}




// "use client"

// import { CheckCircle2, Search, UsersRound } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Input } from "@/components/ui/input"
// import type { SchoolStudentRow } from "../../services/assignment/school-actions"

// type Props = {
//   rows: SchoolStudentRow[]
//   selected: string[]
//   search: string
//   loading?: boolean
//   truncated?: boolean
//   disabled?: boolean
//   onSearch: (value: string) => void
//   onSelect: (ids: string[]) => void
// }

// export function SchoolStudentPicker({ rows, selected, search, truncated, loading, disabled, onSearch, onSelect }: Props) {
//   const selectable = rows.filter(row => !row.assigned)
//   const selection = new Set(selected)
//   const allSelected = selectable.length > 0 && selectable.every(row => selection.has(row.id))

//   return (
//     <div className="space-y-3">
//       <div className="flex flex-wrap items-center justify-between gap-2">
//         <div className="relative min-w-52 flex-1">
//           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
//           <Input className="h-10 pl-9" value={search} onChange={e => onSearch(e.target.value)}
//             placeholder="Find a student or admission number" disabled={disabled} />
//         </div>
//         <Button type="button" variant="outline" size="sm" disabled={disabled || !selectable.length}
//           onClick={() => onSelect(allSelected ? [] : selectable.map(row => row.id))}>
//           {allSelected ? "Clear selection" : `Select available (${selectable.length})`}
//         </Button>
//       </div>

//       <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/75">
//         <span>{rows.length} shown · {selected.length} selected · {rows.filter(row => row.assigned).length} already assigned</span>
//         {truncated && <span className="font-medium text-amber-700 dark:text-amber-300">More than 500 matches. Narrow the class or search.</span>}
//       </div>

//       <div className="max-h-[450px] divide-y divide-primary/10 overflow-auto rounded-xl border border-primary/20 bg-background">
//         {!rows.length ? (
//           <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-foreground/75">
//             <UsersRound className="size-7 text-primary/60" />
//             {loading ? "Loading students…" : "No active students match this selection."}
//           </div>
//         ) : rows.map(row => {
//           const checked = selection.has(row.id)
//           return (
//             <label key={row.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4 ${row.assigned ? "bg-primary/[0.035]" : "cursor-pointer hover:bg-primary/5"}`}>
//               <Checkbox checked={row.assigned || checked} disabled={disabled || row.assigned || (!checked && selected.length >= 500)}
//                 onCheckedChange={v => onSelect(v === true ? [...selected, row.id] : selected.filter(id => id !== row.id))} />
//               <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-800 dark:text-amber-200">
//                 {(row.firstName[0] ?? "").toUpperCase()}{(row.lastName[0] ?? "").toUpperCase()}
//               </div>
//               <div className="min-w-0 flex-1">
//                 <p className="truncate text-sm font-semibold">{row.firstName} {row.lastName}</p>
//                 <p className="truncate text-xs text-foreground/70">{row.code || "No admission number"} · {row.className}</p>
//               </div>
//               {row.assigned ? (
//                 <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Assigned</Badge>
//               ) : row.revoked ? (
//                 <Badge variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-200">Restore access</Badge>
//               ) : (
//                 <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">Ready</Badge>
//               )}
//             </label>
//           )
//         })}
//       </div>
//     </div>
//   )
// }
