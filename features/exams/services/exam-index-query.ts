import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { tables, urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

export type ExamIndexStatus = "draft" | "active" | "archived"

export type ExamIndexItem = {
  id: string
  slug: string
  title: string
  description: string | null
  status: ExamIndexStatus
  duration_seconds: number | null
  available_from: string | null
  available_until: string | null
  max_attempts: number | null
  updated_at: string
  latest_revision: number | null
}

export type ExamIndexResult = {
  exams: ExamIndexItem[]
  total: number
  page: number
  pageSize: number
  query: string
  status: "all" | ExamIndexStatus
}

export async function getOrganizationExamIndex(options: {
  page?: number
  query?: string
  status?: string
} = {}): Promise<ExamIndexResult> {
  const context = await getStaffContext()
  if (!context) notFound()

  const pageSize = 20
  const page = Math.max(1, Math.min(10000, Math.trunc(options.page ?? 1) || 1))
  // Escape ILIKE special characters and PostgREST pattern characters.
  const query = (options.query ?? "").trim().slice(0, 80).replace(/[\\%_]/g, "")
  const status: ExamIndexResult["status"] =
    options.status === "draft" || options.status === "active" || options.status === "archived"
      ? options.status
      : "all"

  let request = context.supabase
    .from(tables.cbt_exams)
    .select(
      "id,slug,title,description,status,duration_seconds,available_from,available_until,max_attempts,updated_at",
      { count: "exact" }
    )
    .eq("organization_id", context.organizationId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (query) request = request.ilike("title", `%${query}%`)
  if (status !== "all") request = request.eq("status", status)

  const { data, error, count } = await request
  if (error) {
    console.error("[CBT:LIST_EXAMS]", error)
    throw new Error("Unable to load examinations.")
  }

  const rows = (data ?? []) as Omit<ExamIndexItem, "latest_revision">[]
  const ids = rows.map((exam) => exam.id)
  const latestByExam = new Map<string, number>()

  if (ids.length) {
    // One compact batch for the visible page, never an RPC per exam.
    const { data: revisions, error: revisionError } = await context.supabase
      .from(tables.cbt_exam_publications)
      .select("exam_id,revision")
      .eq("organization_id", context.organizationId)
      .in("exam_id", ids)
      .order("revision", { ascending: false })

    if (revisionError) {
      console.error("[CBT:LIST_EXAM_REVISIONS]", revisionError)
      throw new Error("Unable to load examination revisions.")
    }

    for (const publication of revisions ?? []) {
      if (!latestByExam.has(publication.exam_id)) {
        latestByExam.set(publication.exam_id, publication.revision)
      }
    }
  }

  return {
    exams: rows.map((exam) => ({
      ...exam,
      latest_revision: latestByExam.get(exam.id) ?? null,
    })),
    total: count ?? 0,
    page,
    pageSize,
    query,
    status,
  }
}
