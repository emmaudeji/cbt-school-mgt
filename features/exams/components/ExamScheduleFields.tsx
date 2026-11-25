
"use client"

import { CalendarClock, Clock3, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  durationMinutes: number
  onDurationChange: (value: number) => void
  availableFrom: string
  onAvailableFromChange: (value: string) => void
  availableUntil: string
  onAvailableUntilChange: (value: string) => void
  disabled: boolean
  isPublished: boolean
  isSchoolExam: boolean
}

export function ExamScheduleFields({
  durationMinutes, onDurationChange, availableFrom, onAvailableFromChange,
  availableUntil, onAvailableUntilChange, disabled, isPublished, isSchoolExam,
}: Props) {
  const person = isSchoolExam ? "Students" : "Candidates"

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-sky-500/10 px-4 py-3">
        <CalendarClock className="size-4 text-sky-600" />
        <h3 className="text-sm font-bold">{isSchoolExam ? "Examination" : "Test"} Schedule</h3>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="exam-duration" className="flex items-center gap-2 font-semibold">
            <Clock3 className="size-4 text-sky-600" /> Time Allowed (minutes)
          </Label>
          <Input id="exam-duration" type="number" min={1} max={1440} step={1}
            required value={durationMinutes}
            onChange={e => onDurationChange(Number(e.target.value))}
            disabled={disabled} className="h-10 max-w-40 shadow-none" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exam-from" className="font-semibold">Opening Date & Time</Label>
          <Input id="exam-from" type="datetime-local" value={availableFrom}
            onChange={e => onAvailableFromChange(e.target.value)}
            disabled={disabled} className="h-10 w-full min-w-0 shadow-none" />
          <p className="text-xs text-foreground/75">{person} can begin from this time.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exam-until" className="font-semibold">Closing Date & Time</Label>
          <Input id="exam-until" type="datetime-local" value={availableUntil}
            min={availableFrom || undefined}
            onChange={e => onAvailableUntilChange(e.target.value)}
            disabled={disabled} className="h-10 w-full min-w-0 shadow-none" />
          <p className="text-xs text-foreground/75">Attempts must finish by the closing time.</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 sm:col-span-2">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
          <p className="text-xs leading-5 text-foreground/85">
            Dates use your device's time zone. Both dates are required for publication.
            A late start may shorten the available attempt time.
            {isPublished && " Changes apply only after publishing a new revision."}
          </p>
        </div>
      </div>
    </section>
  )
}
