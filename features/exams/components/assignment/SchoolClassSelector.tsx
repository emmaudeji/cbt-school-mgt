"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SelectorOption } from "../../services/assignment/types"

type Props = {
  sessions: SelectorOption[]
  levels: SelectorOption[]
  classes: SelectorOption[]
  sessionId: string
  levelId: string
  classId: string
  disabled?: boolean
  onSession: (id: string) => void
  onLevel: (id: string) => void
  onClass: (id: string) => void
}

export function SchoolClassSelector({ sessions, levels, classes, sessionId, levelId, classId, disabled, onSession, onLevel, onClass }: Props) {
  const visibleClasses = classes.filter(item => !levelId || item.levelId === levelId)
  return (
    <div className="grid gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 md:grid-cols-3">
      <div className="space-y-1.5">
        <Label>Academic session</Label>
        <Select value={sessionId} onValueChange={onSession} disabled={disabled || sessions.length === 0}>
          <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Select session" /></SelectTrigger>
          <SelectContent>{sessions.map(item => <SelectItem key={item.id} value={item.id}>{item.name}{item.isCurrent ? " (current)" : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Class level</Label>
        <Select value={levelId || "all"} onValueChange={v => onLevel(v === "all" ? "" : v)} disabled={disabled}>
          <SelectTrigger className="w-full bg-background"><SelectValue placeholder="All levels" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All levels</SelectItem>{levels.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Class / arm</Label>
        <Select value={classId || "all"} onValueChange={v => onClass(v === "all" ? "" : v)} disabled={disabled}>
          <SelectTrigger className="w-full bg-background"><SelectValue placeholder="All arms" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All classes / arms</SelectItem>{visibleClasses.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  )
}
