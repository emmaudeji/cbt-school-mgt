"use client"

import { CalendarClock, Clock3, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  durationMinutes: number
  onDurationChange: (minutes: number) => void
  availableFrom: string
  onAvailableFromChange: (value: string) => void
  availableUntil: string
  onAvailableUntilChange: (value: string) => void
  disabled: boolean
  isPublished: boolean
}

export function ExamScheduleFields({
  durationMinutes,
  onDurationChange,
  availableFrom,
  onAvailableFromChange,
  availableUntil,
  onAvailableUntilChange,
  disabled,
  isPublished,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035]">
      <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/10 px-4 py-3">
        <CalendarClock className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Examination Schedule</h3>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="exam-duration" className="flex items-center gap-2 font-semibold">
            <Clock3 className="size-4 text-primary" />
            Time allowed per candidate
          </Label>
          <Input
            id="exam-duration"
            type="number"
            required
            min={1}
            max={1440}
            step={1}
            value={durationMinutes}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            disabled={disabled}
            className="max-w-44 border-primary/25 bg-background"
          />
          <p className="text-xs text-foreground/80">
            Minutes available after a candidate starts, subject to the examination closing time.
          </p>
        </div>

        <div className="space-y-1.5 rounded-lg border border-primary/20 bg-background p-3">
          <Label htmlFor="exam-available-from" className="font-semibold">
            Candidates can start from
          </Label>
          <Input
            id="exam-available-from"
            type="datetime-local"
            value={availableFrom}
            onChange={(event) => onAvailableFromChange(event.target.value)}
            disabled={disabled}
            className="border-primary/25 bg-background"
          />
          <p className="text-xs text-foreground/80">
            Before this date and time, candidates cannot begin an attempt.
          </p>
        </div>

        <div className="space-y-1.5 rounded-lg border border-primary/20 bg-background p-3">
          <Label htmlFor="exam-available-until" className="font-semibold">
            Examination closes at
          </Label>
          <Input
            id="exam-available-until"
            type="datetime-local"
            value={availableUntil}
            min={availableFrom || undefined}
            onChange={(event) => onAvailableUntilChange(event.target.value)}
            disabled={disabled}
            className="border-primary/25 bg-background"
          />
          <p className="text-xs text-foreground/80">
            No new attempt may begin at or after this time. Existing attempts also end no later than this time.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 sm:col-span-2">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs leading-5 text-foreground/90">
            Dates use the time zone of your device. Both dates are required before publishing.
            {isPublished && (
              <span className="mt-1 block font-semibold">
                Changes here prepare the next publication revision. They do not change the schedule of an already sealed revision.
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
