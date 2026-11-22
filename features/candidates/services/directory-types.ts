export type DirectoryCandidate = {
  id: string
  first_name: string
  last_name: string
  candidate_code: string | null
  status: "active" | "inactive"
  source: "manual" | "import" | "registered" | "school" | "open"
  membership_id: string | null
  created_at: string
  updated_at: string
}

export type DirectoryPage = {
  rows: DirectoryCandidate[]
  total: number
  page: number
  pageSize: number
}

export type DirectoryFilters = {
  search: string
  status: "all" | "active" | "inactive"
  page: number
}

export type CandidateFormValues = {
  id?: string
  firstName: string
  lastName: string
  candidateCode: string
  status: "active" | "inactive"
}
