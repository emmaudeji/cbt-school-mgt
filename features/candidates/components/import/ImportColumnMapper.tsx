"use client"

import type { FieldMap } from "../../services/import/types"

export function ImportColumnMapper({ headers, mapping, setMapping, fullNameIndex, setFullNameIndex }: {
  headers: string[]
  mapping: FieldMap
  setMapping: (value: FieldMap) => void
  fullNameIndex: number | null
  setFullNameIndex: (value: number | null) => void
}) {
  const picker = (value: number | null, change: (value: number | null) => void, label: string) =>
    <select aria-label={label} value={value === null ? "" : String(value)} onChange={event => change(event.target.value === "" ? null : Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
      <option value="">Not present</option>
      {headers.map((header, i) => <option key={i} value={i}>{header || `Column ${i + 1}`}</option>)}
    </select>
  return <div className="grid gap-3 sm:grid-cols-2">
    {(["first_name", "last_name"] as const).map(field => <label key={field} className="space-y-1 rounded-lg border border-primary/15 p-3">
      <span className="block text-sm font-medium">{field === "first_name" ? "First name" : "Surname"}</span>
      {picker(mapping[field], value => setMapping({ ...mapping, [field]: value }), field)}
    </label>)}
    <label className="space-y-1 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 sm:col-span-2">
      <span className="block text-sm font-medium">Full name (recommended for name-only lists)</span>
      {picker(fullNameIndex, setFullNameIndex, "Full name column")}
    </label>
    
    <p className="text-sm font-medium text-foreground/85 sm:col-span-2">
      Candidate directory codes are generated automatically.
      When you assign candidates to an examination using Exam Numbers,
      their separate six-character Exam Numbers are also generated.
    </p>

  </div>
}
