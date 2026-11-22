import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"
import { getStaffContext } from "@/services/auth"
import { decryptAccessCode } from "@/features/exams/services/assignment/credential-crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 200

type CredentialRow = {
  assignment_id: string
  first_name: string
  last_name: string
  encrypted_code: string
}

function csvCell(value: string) {
  // Prevent spreadsheet formula execution even after leading whitespace.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}
const encodeCsv = (row: string[]) => row.map(csvCell).join(",") + "\r\n"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params
  const staff = await getStaffContext()
  if (!staff) return new Response("Unauthorized", { status: 401 })

  try {
    const context = await getExamAssignmentContext(slug)
    if (!context.publication || context.accessMode !== "access_code") {
      return new Response("Exam Numbers are not enabled", { status: 409 })
    }
    const publicationId = context.publication.id

    async function fetchPage(after: string | null): Promise<CredentialRow[]> {
      // Permission-checked existing RPC. It returns only encrypted codes,
      // and validates both staff permissions and the latest publication.
      const { data, error } = await staff!.supabase.rpc("cbt_get_exam_credentials_page", {
        p_publication_id: publicationId,
        p_after: after,
        p_limit: PAGE_SIZE,
      })
      if (error) throw new Error(error.message)
      if (!Array.isArray(data)) throw new Error("Unexpected export response")
      return data as CredentialRow[]
    }

    // Authorize and fetch the first page BEFORE responding with headers.
    let page = await fetchPage(null)
    const encoder = new TextEncoder()
    let first = true
    let finished = false

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          if (first) {
            first = false
            controller.enqueue(encoder.encode("\uFEFF" + encodeCsv([
              "First name", "Surname", "Exam Number",
            ])))
          }
          if (finished || page.length === 0) { controller.close(); return }

          const output = page.map(row => encodeCsv([
            row.first_name,
            row.last_name,
            decryptAccessCode(row.encrypted_code),
          ])).join("")
          controller.enqueue(encoder.encode(output))

          if (page.length < PAGE_SIZE) {
            finished = true
            return
          }
          page = await fetchPage(page[page.length - 1].assignment_id)
        } catch {
          controller.error(new Error("Exam Number export failed"))
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="exam-numbers-${slug.replace(/[^a-z0-9_-]/gi, "_")}.csv"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    })
  } catch {
    return new Response("Unable to export Exam Numbers or access denied", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    })
  }
}






// import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"
// import { getStaffContext } from "@/services/auth"
// import { decryptAccessCode } from "@/features/exams/services/assignment/credential-crypto"

// export const runtime = "nodejs"
// export const dynamic = "force-dynamic"

// const PAGE_SIZE = 200

// type CredentialRow = {
//   assignment_id: string
//   first_name: string
//   last_name: string
//   candidate_code: string
//   entry_code: string
//   encrypted_code: string
// }

// function csvCell(value: string) {
//   // Avoid spreadsheet formula injection, including leading whitespace evasion.
//   const safe = /^[\s]*[=+@\-]/.test(value) || /^[\t\r]/.test(value) ? `'${value}` : value
//   return `"${safe.replaceAll('"', '""')}"`
// }

// function encodeCsv(row: string[]) { return row.map(csvCell).join(",") + "\r\n" }

// export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
//   const { id: slug } = await params
//   try {
//     const [context, staff] = await Promise.all([
//       getExamAssignmentContext(slug),
//       getStaffContext(),
//     ])
//     if (!staff) return new Response("Unauthorized", { status: 401 })
//     if (!context.publication || context.accessMode !== "access_code") {
//       return new Response("Personal access codes are not enabled", { status: 409 })
//     }
//     const publicationId = context.publication.id

//     async function fetchPage(after: string | null): Promise<CredentialRow[]> {
//       const { data, error } = await staff!.supabase.rpc("cbt_get_exam_credentials_page", {
//         p_publication_id: publicationId,
//         p_after: after,
//         p_limit: PAGE_SIZE,
//       })
//       if (error) throw new Error(error.message)
//       return data as CredentialRow[]
//     }
//     // The first request verifies the caller before sending a CSV response.
//     let page = await fetchPage(null)
//     let finished = false
//     let after: string | null = null
//     let first = true
//     const encoder = new TextEncoder()

//     const stream = new ReadableStream<Uint8Array>({
//       async pull(controller) {
//         try {
//           if (first) {
//             first = false
//             controller.enqueue(encoder.encode("\uFEFF" + encodeCsv([
//               "First name", "Surname", "Candidate code", "Exam entry code", "Personal access code"
//             ])))
//           }
//           if (finished) { controller.close(); return }
//           if (page.length === 0) { finished = true; controller.close(); return }
//           const output = page.map(row => encodeCsv([
//             row.first_name, row.last_name, row.candidate_code, row.entry_code,
//             decryptAccessCode(row.encrypted_code),
//           ])).join("")
//           controller.enqueue(encoder.encode(output))
//           after = page[page.length - 1].assignment_id
//           if (page.length < PAGE_SIZE) { finished = true; return }
//           page = await fetchPage(after)
//         } catch {
//           // Never send partial secrets or error details to logs.
//           controller.error(new Error("Credential export failed"))
//         }
//       },
//     })

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/csv; charset=utf-8",
//         "Content-Disposition": `attachment; filename="cbt-credentials-${slug.replace(/[^a-z0-9_-]/gi, "_")}.csv"`,
//         "Cache-Control": "private, no-store, max-age=0",
//         "X-Content-Type-Options": "nosniff",
//         "Referrer-Policy": "no-referrer",
//       },
//     })
//   } catch {
//     return new Response("Unable to export credentials or access denied", {
//       status: 403, headers: { "Cache-Control": "no-store" },
//     })
//   }
// }
