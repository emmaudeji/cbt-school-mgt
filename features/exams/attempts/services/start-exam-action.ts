
"use server"

import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getPublicExamClient } from "../../public/services/public-exam-client"
import { getCurrentExamSession } from "../../public/services/exam-entry-access"

export type StartExamState = {
  error: string
}

export async function startPublicExamAction(
  previousState: StartExamState,
  formData: FormData
): Promise<StartExamState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()

  if (!/^[A-Z0-9]{6,32}$/.test(code)) {
    return { error: "Invalid examination link." }
  }

  // Verify identity and link-to-publication ownership
  // before using the privileged database client.
  const session = await getCurrentExamSession(code)

  if (!session) {
    return {
      error: "Your examination session has expired. Please sign in again.",
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(`cbt_open_${code}`)?.value

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return {
      error: "Unable to validate examination access.",
    }
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex")

  const client = getPublicExamClient()

  const { data, error } = await client.rpc(
    "cbt_start_exam_attempt",
    {
      p_token_hash: tokenHash,
    }
  )

  if (error) {
    console.error("[CBT:START_ATTEMPT]", error)

    if (error.message.includes("Maximum examination attempts")) {
      return { error: "You have used all permitted attempts." }
    }

    if (error.message.includes("availability")) {
      return { error: "This examination is not currently available." }
    }

    return {
      error: "Unable to start the examination. Please try again.",
    }
  }

  if (!data?.ok || !data.attempt_id) {
    return {
      error: "The examination could not be started.",
    }
  }

  redirect(`/take/${code}/attempt/${data.attempt_id}`)
}
