
export type ManagedCandidate = {
  id: string
  membership_id: string | null
  candidate_code: string | null
  first_name: string
  last_name: string
  status: "active" | "inactive"
  source: string
}

export type CandidateAssignment = {
  id: string
  candidate_id: string
  status: "assigned" | "revoked"
  created_at: string
  candidate: {
    id: string
    first_name: string
    last_name: string
    candidate_code: string | null
    source: string
  } | null
}

export type CandidatePublication = {
  id: string
  revision: number
  available_from: string
  available_until: string
}

export type CandidateManagementData = {
  exam: {
    id: string
    slug: string
    title: string
    status: string
  }
  publication: CandidatePublication | null
  accessMode: string | null
  publicLinkCode: string | null
  candidates: ManagedCandidate[]
  assignments: CandidateAssignment[]
  examEntryCode: string | null
}
