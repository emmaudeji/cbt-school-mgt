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

export type ExamNumberLoginState = {
  error: string
}

const defaultError =
  "We couldn't confirm that Exam Number. Check it and try again."

export async function loginWithExamNumberAction(
  _previous: ExamNumberLoginState,
  formData: FormData
): Promise<ExamNumberLoginState> {
  const entryCode = normalizeExamEntryCode(
    String(formData.get("code") ?? "")
  )

  const examNumber = String(
    formData.get("examNumber") ?? ""
  )
    .trim()
    .toUpperCase()

  if (
    !isExamEntryCode(entryCode) ||
    !/^[A-Z0-9]{6}$/.test(examNumber)
  ) {
    return {
      error:
        "Enter the six-character Exam Number given by your teacher.",
    }
  }

  const preview = await getExamEntryPreview(entryCode)

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
      error: "This examination is not accepting entries right now.",
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
      "[CBT:EXAM_NUMBER_LOGIN] Server secrets are not configured"
    )

    return {
      error: "Examination access is temporarily unavailable.",
    }
  }

  // Matches the verifier used by your existing
  // access-code issuing and login workflows.
  const verifier = createHmac("sha256", pepper)
    .update("cbt-code:v1:")
    .update(examNumber)
    .digest("hex")

  // The reverse proxy must overwrite trusted IP headers.
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
    "cbt_login_with_exam_number",
    {
      p_entry_code: entryCode,
      p_verifier: verifier,
      p_token_hash: tokenHash,
      p_ip_key: rateKey(
        `exam-number-ip:${entryCode}:${ip}`
      ),
      p_number_key: rateKey(
        `exam-number-code:${entryCode}:${verifier}`
      ),
    }
  )

  if (error) {
    console.error(
      "[CBT:EXAM_NUMBER_LOGIN] RPC error",
      error.code
    )

    return { error: defaultError }
  }

  if (!data?.ok || !data.expires_at) {
    return { error: defaultError }
  }

  // Changed: retain the cookie for completion/review
  // recovery without extending database session access.
  const maxAge = examCookieMaxAge(data.expires_at)

  if (!Number.isFinite(maxAge) || maxAge <= 0) {
    return { error: defaultError }
  }

  const store = await cookies()

  store.set(examSessionCookieName(entryCode), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/take/${entryCode}`,
    maxAge,
  })

  redirect(`/take/${entryCode}/ready`)
}











// "use server"

// import { createHash, createHmac, randomBytes } from "node:crypto"
// import { cookies, headers } from "next/headers"
// import { redirect } from "next/navigation"

// import {
//   examSessionCookieName,
//   getExamEntryPreview,
//   isExamEntryCode,
//   normalizeExamEntryCode,
// } from "./exam-entry-access"
// import { getPublicExamClient } from "./public-exam-client"
// import { examCookieMaxAge } from "./exam-cookie-policy"

// export type ExamNumberLoginState = { error: string }
// const defaultError = "We couldn't confirm that Exam Number. Check it and try again."

// export async function loginWithExamNumberAction(
//   _previous: ExamNumberLoginState,
//   formData: FormData
// ): Promise<ExamNumberLoginState> {
//   const entryCode = normalizeExamEntryCode(String(formData.get("code") ?? ""))
//   const examNumber = String(formData.get("examNumber") ?? "").trim().toUpperCase()

//   if (!isExamEntryCode(entryCode) || !/^[A-Z0-9]{6}$/.test(examNumber)) {
//     return { error: "Enter the six-character Exam Number given by your teacher." }
//   }

//   const preview = await getExamEntryPreview(entryCode)
//   if (!preview.found || preview.mode !== "access_code" ||
//       !preview.available_from || !preview.available_until) {
//     return { error: defaultError }
//   }
//   const now = Date.now()
//   if (now < Date.parse(preview.available_from) || now >= Date.parse(preview.available_until)) {
//     return { error: "This examination is not accepting entries right now." }
//   }

//   const pepper = process.env.CBT_CREDENTIAL_PEPPER
//   const rateSecret = process.env.CBT_PUBLIC_JOIN_SECRET
//   if (!pepper || Buffer.byteLength(pepper, "utf8") < 32 ||
//       !rateSecret || Buffer.byteLength(rateSecret, "utf8") < 32) {
//     console.error("[CBT:EXAM_NUMBER_LOGIN] Server secrets are not configured")
//     return { error: "Examination access is temporarily unavailable." }
//   }

//   // Exactly matches the verifier used by issueAccessCode and existing login.
//   const verifier = createHmac("sha256", pepper)
//     .update("cbt-code:v1:").update(examNumber).digest("hex")

//   // Your reverse proxy MUST overwrite trusted IP headers. Do not allow a
//   // browser-supplied forwarded header to evade per-IP rate limits.
//   const h = await headers()
//   const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
//   const rateKey = (value: string) =>
//     createHmac("sha256", rateSecret).update(value).digest("hex")

//   const token = randomBytes(32).toString("hex")
//   const tokenHash = createHash("sha256").update(token).digest("hex")

//   const { data, error } = await getPublicExamClient().rpc(
//     "cbt_login_with_exam_number",
//     {
//       p_entry_code: entryCode,
//       p_verifier: verifier,
//       p_token_hash: tokenHash,
//       p_ip_key: rateKey(`exam-number-ip:${entryCode}:${ip}`),
//       p_number_key: rateKey(`exam-number-code:${entryCode}:${verifier}`),
//     }
//   )

//   if (error) {
//     console.error("[CBT:EXAM_NUMBER_LOGIN] RPC error", error.code)
//     return { error: defaultError }
//   }
//   if (!data?.ok || !data.expires_at) return { error: defaultError }

//   const maxAge = Math.floor((Date.parse(data.expires_at) - Date.now()) / 1000)
//   if (!Number.isFinite(maxAge) || maxAge <= 0) return { error: defaultError }

//   const store = await cookies()
//   store.set(examSessionCookieName(entryCode), token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: `/take/${entryCode}`,
//     maxAge,
//   })
//   redirect(`/take/${entryCode}/ready`)
// }
