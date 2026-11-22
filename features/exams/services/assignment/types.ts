export type AssignmentSource = "directory" | "school"

export type PickerRow = {
  id: string
  firstName: string
  lastName: string
  code: string | null
  className?: string
  assigned: boolean
  revoked: boolean
  loginReady: boolean
}

export type SelectorOption = { id: string; name: string; isCurrent?: boolean; levelId?: string }

export type AssignmentPickerData = {
  schoolEnabled: boolean
  accessMode: string
  currentSessionId: string | null
  sessions: SelectorOption[]
  levels: SelectorOption[]
  classes: SelectorOption[]
  rows: PickerRow[]
  truncated: boolean
}

export type AssignmentPickerFilters = {
  source: AssignmentSource
  search?: string
  sessionId?: string | null
  levelId?: string | null
  classId?: string | null
}

export type AssignmentBatchResult = {
  createdCandidates: number
  assigned: number
  restored: number
  alreadyAssigned: number
  revoked: number
  needsRegistration: number
}
