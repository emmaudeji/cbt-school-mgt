"use server"

import { createHash, createHmac, randomBytes } from "node:crypto"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  examSessionCookieName,
  getExamEntryPreview,
  isExamEntryCode,
  normalizeExamEntryCode,
} from "./exam-entry-access"

import { getPublicExamClient } from "./public-exam-client"
import { examCookieMaxAge } from "./exam-cookie-policy"

export type PrivateExamLoginState = {
  error: string
}

const defaultError =
  "Unable to sign in. Check your details and try again."

export async function loginWithExamAccessCodeAction(
  _previous: PrivateExamLoginState,
  formData: FormData
): Promise<PrivateExamLoginState> {
  const code = normalizeExamEntryCode(
    String(formData.get("code") ?? "")
  )

  const candidateCode = String(
    formData.get("candidateCode") ?? ""
  ).trim()

  const personalCode = String(
    formData.get("personalCode") ?? ""
  )
    .trim()
    .toUpperCase()

  // Preserve legacy candidate identifiers.
  // Newly issued personal codes remain six characters.
  if (
    !isExamEntryCode(code) ||
    candidateCode.length < 1 ||
    candidateCode.length > 64 ||
    !/^[A-Z0-9]{6}$/.test(personalCode)
  ) {
    return {
      error:
        "Enter your candidate code and six-character personal access code.",
    }
  }

  const preview = await getExamEntryPreview(code)

  if (
    !preview.found ||
    preview.mode !== "access_code" ||
    !preview.available_from ||
    !preview.available_until
  ) {
    return { error: defaultError }
  }

  const now = Date.now()

  if (
    now < Date.parse(preview.available_from) ||
    now >= Date.parse(preview.available_until)
  ) {
    return {
      error:
        "This examination is not accepting entries right now.",
    }
  }

  const pepper = process.env.CBT_CREDENTIAL_PEPPER
  const rateSecret = process.env.CBT_PUBLIC_JOIN_SECRET

  if (
    !pepper ||
    Buffer.byteLength(pepper, "utf8") < 32 ||
    !rateSecret ||
    Buffer.byteLength(rateSecret, "utf8") < 32
  ) {
    console.error(
      "[CBT:PRIVATE_LOGIN] Missing credential or rate-limit secret"
    )

    return {
      error: "Examination access is temporarily unavailable.",
    }
  }

  // Matches the existing /api/cbt/login HMAC scheme.
  const verifier = createHmac("sha256", pepper)
    .update("cbt-code:v1:")
    .update(personalCode)
    .digest("hex")

  // Trust only headers overwritten by the hosting proxy.
  const h = await headers()

  const ip =
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"

  const rateKey = (value: string) =>
    createHmac("sha256", rateSecret)
      .update(value)
      .digest("hex")

  const token = randomBytes(32).toString("hex")

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex")

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_login_with_access_code",
    {
      p_entry_code: code,
      p_candidate_code: candidateCode,
      p_verifier: verifier,
      p_token_hash: tokenHash,
      p_ip_key: rateKey(
        `private-ip:${code}:${ip}`
      ),
      p_candidate_key: rateKey(
        `private-candidate:${code}:${candidateCode.toLowerCase()}`
      ),
    }
  )

  if (error) {
    console.error(
      "[CBT:PRIVATE_LOGIN]",
      error.code ?? "unknown"
    )

    return { error: defaultError }
  }

  if (!data?.ok || !data.expires_at) {
    return { error: defaultError }
  }

  // Changed: extend cookie retention only.
  const maxAge = examCookieMaxAge(data.expires_at)

  if (!Number.isFinite(maxAge) || maxAge <= 0) {
    return { error: defaultError }
  }

  const store = await cookies()

  store.set(examSessionCookieName(code), token, {
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
// import { examSessionCookieName, getExamEntryPreview, isExamEntryCode, normalizeExamEntryCode } from "./exam-entry-access"
// import { getPublicExamClient } from "./public-exam-client"

// export type PrivateExamLoginState = { error: string }
// const defaultError = "Unable to sign in. Check your details and try again."

// export async function loginWithExamAccessCodeAction(
//   _previous: PrivateExamLoginState,
//   formData: FormData
// ): Promise<PrivateExamLoginState> {
//   const code = normalizeExamEntryCode(String(formData.get("code") ?? ""))
//   const candidateCode = String(formData.get("candidateCode") ?? "").trim()
//   const personalCode = String(formData.get("personalCode") ?? "").trim().toUpperCase()

//   // Accept legacy candidate identifiers, but require 6-character newly issued personal codes.
//   if (!isExamEntryCode(code) || candidateCode.length < 1 || candidateCode.length > 64 ||
//       !/^[A-Z0-9]{6}$/.test(personalCode)) {
//     return { error: "Enter your candidate code and six-character personal access code." }
//   }

//   const preview = await getExamEntryPreview(code)
//   if (!preview.found || preview.mode !== "access_code" ||
//       !preview.available_from || !preview.available_until) return { error: defaultError }

//   const now = Date.now()
//   if (now < Date.parse(preview.available_from) || now >= Date.parse(preview.available_until)) {
//     return { error: "This examination is not accepting entries right now." }
//   }

//   const pepper = process.env.CBT_CREDENTIAL_PEPPER
//   const rateSecret = process.env.CBT_PUBLIC_JOIN_SECRET
//   if (!pepper || Buffer.byteLength(pepper, "utf8") < 32 ||
//       !rateSecret || Buffer.byteLength(rateSecret, "utf8") < 32) {
//     console.error("[CBT:PRIVATE_LOGIN] Missing credential or rate-limit secret")
//     return { error: "Examination access is temporarily unavailable." }
//   }
//   // Must match the existing /api/cbt/login HMAC scheme.
//   const verifier = createHmac("sha256", pepper)
//     .update("cbt-code:v1:").update(personalCode).digest("hex")

//   // IMPORTANT: trust only headers inserted by your hosting proxy. Never trust a
//   // client-supplied x-forwarded-for unless the proxy reliably overwrites it.
//   const h = await headers()
//   const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
//   const rateKey = (value: string) => createHmac("sha256", rateSecret).update(value).digest("hex")
//   const token = randomBytes(32).toString("hex")
//   const tokenHash = createHash("sha256").update(token).digest("hex")

//   const { data, error } = await getPublicExamClient().rpc("cbt_login_with_access_code", {
//     p_entry_code: code,
//     p_candidate_code: candidateCode,
//     p_verifier: verifier,
//     p_token_hash: tokenHash,
//     p_ip_key: rateKey(`private-ip:${code}:${ip}`),
//     p_candidate_key: rateKey(`private-candidate:${code}:${candidateCode.toLowerCase()}`),
//   })
//   if (error) {
//     console.error("[CBT:PRIVATE_LOGIN]", error.code ?? "unknown")
//     return { error: defaultError }
//   }
//   if (!data?.ok || !data.expires_at) return { error: defaultError }
//   const expiresAt = Date.parse(data.expires_at)
//   const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
//   if (!Number.isFinite(maxAge) || maxAge <= 0) return { error: defaultError }

//   const store = await cookies()
//   store.set(examSessionCookieName(code), token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: `/take/${code}`,
//     maxAge,
//   })
//   redirect(`/take/${code}/ready`)
// }
