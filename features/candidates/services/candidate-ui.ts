import type { ManagedCandidate } from "@/types/candidate-management"

export function candidateName(candidate: Pick<ManagedCandidate, "first_name" | "last_name">) {
  return [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") || "Unnamed candidate"
}

export function formatCandidateDate(value: string | null | undefined) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  }).format(date)
}

export function candidateBasePath(slug: string) {
  return `/exams/${encodeURIComponent(slug)}/candidates`
}
