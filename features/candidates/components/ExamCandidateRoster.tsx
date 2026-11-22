import { Badge } from "@/components/ui/badge"
import type { CandidateManagementData } from "@/types/candidate-management"
import { candidateName, formatCandidateDate } from "../services/candidate-ui"

type Props = { data: CandidateManagementData }

export function ExamCandidateRoster({ data }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-background">
      <div className="border-b border-primary/15 bg-sky-500/5 px-5 py-4">
        <h2 className="font-semibold">Public-link participants</h2>
        <p className="mt-1 text-xs text-muted-foreground">Candidates who joined through the current public examination link.</p>
      </div>
      <div className="divide-y divide-primary/10">
        {data.assignments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No participants have registered through this link yet.</p>
        ) : data.assignments.map(assignment => (
          <div key={assignment.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{assignment.candidate ? candidateName(assignment.candidate) : "Candidate unavailable"}</p>
              <p className="text-xs text-muted-foreground">Joined {formatCandidateDate(assignment.created_at)}</p>
            </div>
            <Badge variant={assignment.status === "assigned" ? "secondary" : "outline"} className="capitalize">{assignment.status}</Badge>
          </div>
        ))}
      </div>
    </section>
  )
}
