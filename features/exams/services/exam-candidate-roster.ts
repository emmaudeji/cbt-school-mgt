export type ExamCandidateStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "closed"
  | "revoked"

export type ExamCandidateFilter = "all" | ExamCandidateStatus

export type ExamCandidateRow = {
  assignment_id: string
  candidate_id: string
  assignment_status: "assigned" | "revoked"
  assigned_at: string
  first_name: string
  last_name: string
  candidate_code: string | null
  source: string
  candidate_status: "active" | "inactive"
  attempt_count: number
  has_started: boolean
  last_started_at: string | null
  last_submitted_at: string | null
  exam_status: ExamCandidateStatus
}

export type ExamCandidateStats = {
  candidates: number
  revoked: number
  started: number
  notStarted: number
  inProgress: number
  submitted: number
}

export type ExamCandidateRosterPage = {
  rows: ExamCandidateRow[]
  page: number
  pageSize: number
  total: number
  stats: ExamCandidateStats
}

export type CandidateListQuery = {
  page?: number
  search?: string
  filter?: ExamCandidateFilter
}

export const EMPTY_ROSTER: ExamCandidateRosterPage = {
  rows: [],
  page: 1,
  pageSize: 20,
  total: 0,
  stats: {
    candidates: 0,
    revoked: 0,
    started: 0,
    notStarted: 0,
    inProgress: 0,
    submitted: 0,
  },
}
