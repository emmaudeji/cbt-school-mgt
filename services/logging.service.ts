
import "server-only"

import { isIP } from "node:net"
import { headers } from "next/headers"

import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/utils/supabase/secrete-client"
import { SCHOOL_SLUG, tables } from "@/constants"

import type { CreateLogActivityInput } from "@/types/logging"

export async function logActivity(
  input: CreateLogActivityInput
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const h = await headers()
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim()
    const rawIp = forwarded || h.get("x-real-ip")
    const ip = rawIp && isIP(rawIp) ? rawIp : null

    const { error } = await supabaseAdmin
      .from(tables.activity_logs)
      .insert({
        organization_slug: SCHOOL_SLUG,
        actor_id: user.id,
        actor_email: user.email ?? null,
        action: input.action,
        description: input.description,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ip_address: ip,
        user_agent: h.get("user-agent"),
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error("[AUDIT LOG]", error)
    return false
  }
}

import type { LogPayload, LogQuery } from "@/types/logging"

export async function fetchLogs(params: LogQuery = {}) {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))

  const supabase = await createClient()

  let query = supabase
    .from(tables.activity_logs)
    .select("*", { count: "exact" })
    .eq("organization_slug", SCHOOL_SLUG)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (params.action)
    query = query.eq("action", params.action)

  if (params.entityType)
    query = query.eq("entity_type", params.entityType)

  if (params.entityId)
    query = query.eq("entity_id", params.entityId)

  if (params.actorId)
    query = query.eq("actor_id", params.actorId)

  if (params.startDate)
    query = query.gte("created_at", params.startDate)

  if (params.endDate)
    query = query.lte("created_at", params.endDate)

  if (params.search?.trim())
    query = query.ilike("description", `%${params.search.trim()}%`)

  const { data, count, error } = await query

  return {
    data: (data ?? []) as LogPayload[],
    total: count ?? 0,
    error: error?.message ?? null,
  }
}


// await logActivity({
//   action: "create",
//   description: "Created a new student",
//   entityType: "school_student",
//   entityId: student.id,
//   metadata: {
//     admissionNumber: student.admission_number,
//   },
// })