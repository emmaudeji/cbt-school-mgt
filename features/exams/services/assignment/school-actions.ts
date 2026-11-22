"use server"

import { getStaffContext } from "@/services/auth"


export type SchoolOption = {
  id: string
  name: string
  isCurrent?: boolean
  levelId?: string
}

export type SchoolStudentRow = {
  id: string
  firstName: string
  lastName: string
  code: string | null
  classId: string
  className: string
  assigned: boolean
  revoked: boolean
  loginReady: boolean
}

export type SchoolAssignmentPicker = {
  accessMode: string
  entryCode: string | null
  currentSessionId: string | null
  sessions: SchoolOption[]
  levels: SchoolOption[]
  classes: SchoolOption[]
  rows: SchoolStudentRow[]
  truncated: boolean
}

type Filters = {
  search?: string
  sessionId?: string | null
  levelId?: string | null
  classIds?: string[]
}

const isUuid = (id: string) => /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)

export async function loadSchoolAssignmentAction(publicationId: string, filters: Filters) {
  if (!isUuid(publicationId) ||
    (filters.sessionId && !isUuid(filters.sessionId)) ||
    (filters.levelId && !isUuid(filters.levelId)) ||
    (filters.classIds?.length ?? 0) > 100 ||
    filters.classIds?.some(id => !isUuid(id))) {
    return { success: false as const, error: "Invalid school selection." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false as const, error: "Your staff session has expired." }

  const { data, error } = await context.supabase.rpc("cbt_get_school_private_assignment_picker", {
    p_publication_id: publicationId,
    p_search: (filters.search ?? "").trim().slice(0, 100),
    p_session_id: filters.sessionId || null,
    p_level_id: filters.levelId || null,
    p_class_ids: filters.classIds?.length ? [...new Set(filters.classIds)] : null
  })

  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data: data as SchoolAssignmentPicker }
}
