
"use server"

import { createHash, createHmac, randomBytes } from "node:crypto"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  examSessionCookieName,
  getCurrentExamSession,
} from "./exam-entry-access"

import { getPublicExamClient } from "./public-exam-client"
import { examCookieMaxAge } from "./exam-cookie-policy"

export type PublicExamPreview = {
  found: boolean
  publication_id?: string
  title?: string
  description?: string | null
  instructions?: string | null
  duration_seconds?: number
  available_from?: string
  available_until?: string
}

export type JoinPublicExamState = {
  error: string
}

function sha256(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex")
}

export async function getPublicExamPreview(
  code: string
): Promise<PublicExamPreview> {
  if (!/^[A-Z0-9]{6,32}$/.test(code)) {
    return { found: false }
  }

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_public_exam_preview",
    {
      p_entry_code: code,
    }
  )

  if (error) {
    console.error(
      "[CBT:PUBLIC_EXAM_PREVIEW]",
      error
    )

    return { found: false }
  }

  return (data ?? { found: false }) as PublicExamPreview
}

export async function joinPublicExamAction(
  _previous: JoinPublicExamState,
  formData: FormData
): Promise<JoinPublicExamState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()

  const firstName = String(
    formData.get("firstName") ?? ""
  ).trim()

  const lastName = String(
    formData.get("lastName") ?? ""
  ).trim()

  const errorState: JoinPublicExamState = {
    error:
      "Unable to join this examination. Check the details and try again.",
  }

  if (
    !/^[A-Z0-9]{6,32}$/.test(code) ||
    firstName.length < 1 ||
    firstName.length > 120 ||
    lastName.length > 120
  ) {
    return {
      error: "Enter valid candidate details.",
    }
  }

  const existing = await getCurrentExamSession(code)

  if (existing) {
    redirect(`/take/${code}/ready`)
  }

  const secret = process.env.CBT_PUBLIC_JOIN_SECRET

  if (!secret || secret.length < 32) {
    console.error(
      "[CBT:PUBLIC_JOIN] Missing server secret"
    )

    return errorState
  }

  const requestHeaders = await headers()

  // Configure the hosting proxy to provide
  // trustworthy IP headers.
  const ip =
    requestHeaders.get("x-real-ip") ??
    requestHeaders
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ??
    "unknown"

  const rateKey = createHmac("sha256", secret)
    .update(`public-exam:${code}:${ip}`)
    .digest("hex")

  const token = randomBytes(32).toString("hex")
  const tokenHash = sha256(token)

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_join_public_exam",
    {
      p_entry_code: code,
      p_first_name: firstName,
      p_last_name: lastName,
      p_token_hash: tokenHash,
      p_rate_key: rateKey,
    }
  )

  if (error || !data?.ok || !data.expires_at) {
    if (error) {
      console.error(
        "[CBT:PUBLIC_JOIN]",
        error
      )
    }

    return errorState
  }

  // Changed: use the shared completion grace policy.
  const maxAge = examCookieMaxAge(data.expires_at)

  if (!Number.isFinite(maxAge) || maxAge <= 0) {
    return errorState
  }

  const cookieStore = await cookies()

  cookieStore.set(examSessionCookieName(code), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/take/${code}`,
    maxAge,
  })

  redirect(`/take/${code}/ready`)
}


// "use server"

// import { createHash, createHmac, randomBytes } from "node:crypto"
// import { cookies, headers } from "next/headers"
// import { redirect } from "next/navigation"

// import { getPublicExamClient } from "./public-exam-client"
// import { getCurrentExamSession } from "./exam-entry-access"

// export type PublicExamPreview = {
//   found: boolean
//   publication_id?: string
//   title?: string
//   description?: string | null
//   instructions?: string | null
//   duration_seconds?: number
//   available_from?: string
//   available_until?: string
// }

// export type JoinPublicExamState = {
//   error: string
// }

// function sha256(value: string) {
//   return createHash("sha256").update(value).digest("hex")
// }

// function cookieName(code: string) {
//   return `cbt_open_${code}`
// }

// export async function getPublicExamPreview(
//   code: string
// ): Promise<PublicExamPreview> {
//   if (!/^[A-Z0-9]{6,32}$/.test(code)) {
//     return { found: false }
//   }

//   const client = getPublicExamClient()

//   const { data, error } = await client.rpc(
//     "cbt_public_exam_preview",
//     { p_entry_code: code }
//   )

//   if (error) {
//     console.error("[CBT:PUBLIC_EXAM_PREVIEW]", error)
//     return { found: false }
//   }

//   return (data ?? { found: false }) as PublicExamPreview
// }

// export async function joinPublicExamAction(
//   previous: JoinPublicExamState,
//   formData: FormData
// ): Promise<JoinPublicExamState> {
//   const code = String(formData.get("code") ?? "")
//     .trim()
//     .toUpperCase()

//   const firstName = String(formData.get("firstName") ?? "")
//     .trim()

//   const lastName = String(formData.get("lastName") ?? "")
//     .trim()

//   const errorState = {
//     error: "Unable to join this examination. Check the details and try again.",
//   }

//   if (
//     !/^[A-Z0-9]{6,32}$/.test(code) ||
//     firstName.length < 1 ||
//     firstName.length > 120 ||
//     lastName.length > 120
//   ) {
//     return { error: "Enter valid candidate details." }
//   }

//   const existing = await getCurrentExamSession(code)

//   if (existing) {
//     redirect(`/take/${code}/ready`)
//   }

//   const secret = process.env.CBT_PUBLIC_JOIN_SECRET

//   if (!secret || secret.length < 32) {
//     console.error("[CBT:PUBLIC_JOIN] Missing server secret")
//     return errorState
//   }

//   const requestHeaders = await headers()

//   // Configure your hosting proxy to supply a trustworthy IP header.
//   const ip =
//     requestHeaders.get("x-real-ip") ??
//     requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
//     "unknown"

//   const rateKey = createHmac("sha256", secret)
//     .update(`public-exam:${code}:${ip}`)
//     .digest("hex")

//   const token = randomBytes(32).toString("hex")
//   const tokenHash = sha256(token)

//   const client = getPublicExamClient()

//   const { data, error } = await client.rpc(
//     "cbt_join_public_exam",
//     {
//       p_entry_code: code,
//       p_first_name: firstName,
//       p_last_name: lastName,
//       p_token_hash: tokenHash,
//       p_rate_key: rateKey,
//     }
//   )

//   if (error || !data?.ok) {
//     if (error) {
//       console.error("[CBT:PUBLIC_JOIN]", error)
//     }

//     return errorState
//   }

//   const expiresAt = new Date(data.expires_at).getTime()
//   const maxAge = Math.floor(
//     (expiresAt - Date.now()) / 1000
//   )

//   if (maxAge <= 0) {
//     return errorState
//   }

//   const cookieStore = await cookies()

//   cookieStore.set(cookieName(code), token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: `/take/${code}`,
//     maxAge,
//   })

//   redirect(`/take/${code}/ready`)
// }
