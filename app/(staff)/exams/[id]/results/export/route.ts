import { NextRequest, NextResponse } from "next/server"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import {
  normalizeFilter,
  type ResultPage,
  type ResultRow,
} from "@/features/results/services/results"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function cell(value: unknown): string {
  // Quotes and CR/LF are escaped. Prefix formula-like values to prevent
  // spreadsheet formula execution when users open a downloaded CSV.
  const raw = value == null ? "" : String(value)
  const safe = /^[\s]*[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

function rowCsv(row: ResultRow, isSchool: boolean): string {
  return [
    row.candidate_code,
    `${row.first_name} ${row.last_name}`.trim(),
    row.candidate_id,
    row.attempt_id,
    row.attempt_number,
    row.revision,
    row.attempt_status,
    row.grading_status ?? (row.result_id ? "finalized" : "not graded"),
    row.pending_manual_count,
    row.earned_points,
    row.total_points,
    row.percentage,
    row.result_released ? "Yes" : "No",
    ...(isSchool ? [row.school_assessment_linked ? "Yes" : "No"] : []),
    row.submitted_at ?? row.closed_at,
  ].map(cell).join(",") + "\r\n"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: slug } = await params
  const context = await getStaffContext()
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const exam = await getExamBySlug(slug)
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim().slice(0, 120)
  const status = normalizeFilter(request.nextUrl.searchParams.get("status") ?? undefined)

  const fetchChunk = async (offset: number): Promise<ResultPage> => {
    const { data, error } = await context.supabase.rpc("cbt_staff_exam_results", {
      p_exam_id: exam.id,
      p_search: search,
      p_status: status,
      p_limit: 500,
      p_offset: offset,
    })
    if (error) throw error
    return data as unknown as ResultPage
  }

  // Check authorization BEFORE beginning a streamed response.
  let first: ResultPage
  try {
    first = await fetchChunk(0)
  } catch (error) {
    console.error("[CBT:CSV_EXPORT]", error)
    return NextResponse.json({ error: "Not permitted or export failed" }, { status: 403 })
  }

  const encoder = new TextEncoder()
  let offset = 0
  let pending: ResultPage | null = first
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (offset === 0) {
          const columns = [
            "Candidate code", first.isSchool ? "Student" : "Candidate",
            "Candidate ID", "Attempt ID", "Attempt", "Revision",
            "Attempt status", "Grading status", "Manual questions pending",
            "Earned marks", "Total marks", "Percentage", "Released",
            ...(first.isSchool ? ["School assessment linked"] : []),
            "Submitted at",
          ]
          controller.enqueue(encoder.encode(columns.map(cell).join(",") + "\r\n"))
        }
        const chunk = pending ?? await fetchChunk(offset)
        pending = null
        if (chunk.rows.length) {
          controller.enqueue(encoder.encode(chunk.rows.map(r => rowCsv(r, first.isSchool)).join("")))
        }
        offset += chunk.rows.length
        if (chunk.rows.length < 500 || offset >= chunk.total) controller.close()
      } catch (error) {
        console.error("[CBT:CSV_EXPORT_STREAM]", error)
        controller.error(error)
      }
    },
  })

  const fileSlug = exam.slug.replace(/[^a-z0-9_-]/gi, "-")
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileSlug}-results.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
