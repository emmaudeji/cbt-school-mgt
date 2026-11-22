import { ClipboardCheck, ClipboardList, UserRoundPlus, UsersRound } from "lucide-react"
import type { CandidateManagementData } from "@/types/candidate-management"

type Props = { data: CandidateManagementData }

export function CandidateOverviewStats({ data }: Props) {
  const assigned = data.assignments.filter(item => item.status === "assigned").length
  const revoked = data.assignments.filter(item => item.status === "revoked").length
  const available = data.candidates.filter(candidate =>
    candidate.status === "active" &&
    candidate.membership_id !== null &&
    !data.assignments.some(item => item.candidate_id === candidate.id && item.status === "assigned")
  ).length

  const stats = [
    { label: "Candidate records", value: data.candidates.length, icon: UsersRound, tone: "text-sky-700 dark:text-sky-300", surface: "bg-sky-500/10" },
    { label: "Assigned", value: assigned, icon: ClipboardCheck, tone: "text-emerald-700 dark:text-emerald-300", surface: "bg-emerald-500/10" },
    { label: "Available registered", value: available, icon: UserRoundPlus, tone: "text-violet-700 dark:text-violet-300", surface: "bg-violet-500/10" },
    { label: "Revoked", value: revoked, icon: ClipboardList, tone: "text-amber-700 dark:text-amber-300", surface: "bg-amber-500/10" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-xl border border-primary/20 bg-background p-4">
          <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${stat.surface} ${stat.tone}`}>
            <stat.icon className="size-4" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
