"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { issueAccessCode } from "./credential-crypto"
import type { AssignmentSource } from "./types"

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export type IssuedPrivateCredential = {
  createdCandidates: number
  assigned: number
  restored: number
  alreadyAssigned: number
  reissuedExisting: number
  issuedCount: number
}

type Result =
  | { success: true; data: IssuedPrivateCredential }
  | { success: false; error: string }

const MAX_UNIQUE_RETRIES = 6

export async function assignPrivateCodeCandidatesAction(
  publicationId: string,
  slug: string,
  source: AssignmentSource,
  ids: string[]
): Promise<Result> {
  if (
    !isUuid(publicationId) ||
    !["school", "directory"].includes(source) ||
    ids.length < 1 || ids.length > 500 ||
    ids.some(id => !isUuid(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return { success: false, error: "Choose 1 to 500 valid, distinct students." }
  }

  const context = await getStaffContext()
  if (!context) {
    return { success: false, error: "Your staff session has expired." }
  }

  try {
    for (let attempt = 0; attempt < MAX_UNIQUE_RETRIES; attempt++) {
      // Fresh cryptographically random Exam Numbers are created each retry.
      // The RPC is transactional: an index collision rolls back the whole batch.
      const rows = ids.map(id => ({ id, ...issueAccessCode() }))

      const { data, error } = await context.supabase.rpc(
        "cbt_assign_private_code_candidates",
        {
          p_publication_id: publicationId,
          p_source: source,
          p_rows: rows,
        }
      )

      if (!error) {
        const result = data as IssuedPrivateCredential
        revalidatePath(`/exams/${encodeURIComponent(slug)}/candidates`)
        revalidatePath(`/exams/${encodeURIComponent(slug)}/candidates/assign`)
        return { success: true, data: result }
      }

      // No two candidates in the same publication may share an Exam Number.
      // A very rare collision can happen with six-character random codes;
      // retry ONLY if that exact database uniqueness constraint rejected it.
      const collision = error.code === "23505" &&
        /cbt_exam_number_per_publication_unique/.test(
          `${error.message ?? ""} ${error.details ?? ""}`
        )

      if (collision && attempt + 1 < MAX_UNIQUE_RETRIES) continue

      console.error("[CBT:ISSUE_EXAM_NUMBER] RPC failed", {
        code: error.code,
        message: error.message,
      })
      return {
        success: false,
        error: collision
          ? "Could not generate unique Exam Numbers. Please try again."
          : "Unable to add students to the examination. Please try again.",
      }
    }
  } catch (error) {
    console.error("[CBT:ISSUE_EXAM_NUMBER] Unexpected error", {
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }

  return { success: false, error: "Unable to prepare Exam Numbers." }
}



// "use server"

// import { revalidatePath } from "next/cache"
// import { getStaffContext } from "@/services/auth"
// import { issueAccessCode } from "./credential-crypto"
// import type { AssignmentSource } from "./types"

// const isUuid = (s: string) =>
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

// export type IssuedPrivateCredential = {
//   createdCandidates: number
//   assigned: number
//   restored: number
//   alreadyAssigned: number
//   reissuedExisting: number
//   issuedCount: number
// }

// export async function assignPrivateCodeCandidatesAction(
//   publicationId: string,
//   slug: string,
//   source: AssignmentSource,
//   ids: string[]
// ): Promise<
//   { success: true; data: IssuedPrivateCredential } |
//   { success: false; error: string }
// > {
//   const logPrefix = "[assignPrivateCodeCandidatesAction]"

//   console.info(`${logPrefix} Started`, {
//     publicationId,
//     slug,
//     source,
//     candidateCount: ids.length,
//   })

//   if (
//     !isUuid(publicationId) ||
//     !["school", "directory"].includes(source) ||
//     ids.length < 1 ||
//     ids.length > 500 ||
//     ids.some(id => !isUuid(id)) ||
//     new Set(ids).size !== ids.length
//   ) {
//     console.warn(`${logPrefix} Validation failed`, {
//       publicationIdValid: isUuid(publicationId),
//       sourceValid: ["school", "directory"].includes(source),
//       candidateCount: ids.length,
//       invalidIds: ids.filter(id => !isUuid(id)).length,
//       hasDuplicates: new Set(ids).size !== ids.length,
//     })

//     return {
//       success: false,
//       error: "Choose 1 to 500 valid, distinct candidates.",
//     }
//   }

//   const context = await getStaffContext()

//   if (!context) {
//     console.warn(`${logPrefix} Staff session expired`, { publicationId })

//     return {
//       success: false,
//       error: "Your staff session has expired.",
//     }
//   }

//   try {
//     console.info(`${logPrefix} Generating access codes`, {
//       candidateCount: ids.length,
//     })

//     const rows = ids.map(id => ({
//       id,
//       ...issueAccessCode(),
//     }))

//     console.info(`${logPrefix} Calling assignment RPC`, {
//       publicationId,
//       source,
//       rowCount: rows.length,
//     })

//     const { data, error } = await context.supabase.rpc(
//       "cbt_assign_private_code_candidates",
//       {
//         p_publication_id: publicationId,
//         p_source: source,
//         p_rows: rows,
//       }
//     )

//     if (error) {
//       console.error(`${logPrefix} RPC failed`, {
//         publicationId,
//         source,
//         code: error.code,
//         message: error.message,
//         details: error.details,
//         hint: error.hint,
//       })

//       return { success: false, error: error.message }
//     }

//     const result = data as IssuedPrivateCredential

//     console.info(`${logPrefix} Assignment successful`, {
//       publicationId,
//       source,
//       ...result,
//     })

//     revalidatePath(`/exams/${encodeURIComponent(slug)}/candidates`)
//     revalidatePath(`/exams/${encodeURIComponent(slug)}/candidates/assign`)

//     console.info(`${logPrefix} Cache revalidated`, { slug })

//     return { success: true, data: result }
//   } catch (error) {
//     console.error(`${logPrefix} Unexpected error`, {
//       publicationId,
//       source,
//       error: error instanceof Error
//         ? {
//             name: error.name,
//             message: error.message,
//             // stack: error.stack,
//           }
//         : error,
//     })

//     return {
//       success: false,
//       error: "Unable to provision access codes. Check server credential configuration.",
//     }
//   }
// }