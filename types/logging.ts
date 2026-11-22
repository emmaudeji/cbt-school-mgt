
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "deactivate"
  | "publish"
  | "approve"
  | "login"
  | "logout"
  | "import"
  | "export"
  | "assign"
  | "revoke"
  | "submit"

export interface CreateLogActivityInput {
  action: AuditAction
  description: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

export interface LogPayload {
  id: string
  organization_slug: string
  actor_id: string | null
  actor_email: string | null
  action: AuditAction
  description: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface LogQuery {
  page?: number
  limit?: number
  action?: AuditAction
  entityType?: string
  entityId?: string
  actorId?: string
  startDate?: string
  endDate?: string
  search?: string
}
