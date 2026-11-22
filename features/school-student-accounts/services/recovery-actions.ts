
"use server"

import { createClient } from "@/utils/supabase/server"

export type RecoveryResult = {
  ok: boolean
  message: string
}

export async function requestStudentPasswordReset(
  emailInput: string
): Promise<RecoveryResult> {
  const email = emailInput.trim().toLowerCase()

  const genericMessage =
    "If an account exists for this email, password recovery instructions will be sent."

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    }
  }

  const redirectTo =
    process.env.STUDENT_PASSWORD_RESET_REDIRECT_URL

  if (!redirectTo) {
    console.error(
      "[STUDENT:RECOVERY] Redirect not configured"
    )

    return {
      ok: false,
      message: "Password recovery is unavailable.",
    }
  }

  const db = await createClient()

  const { error } =
    await db.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    )

  if (error) {
    console.error(
      "[STUDENT:RECOVERY]",
      error.code
    )
  }

  // Avoid revealing whether an email is registered.
  return {
    ok: true,
    message: genericMessage,
  }
}
