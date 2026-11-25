
"use server"

import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getPublicExamClient } from "./public-exam-client"

import {
  examSessionCookieName,
  isExamEntryCode,
  normalizeExamEntryCode,
} from "./exam-entry-access"

type LoginResult =
  | { success: true }
  | { success: false; error: string }

type LoginCredentials = {
  email?: string
  password?: string
}

function getAuthClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error("Supabase authentication is not configured.")
  }

  // Cookie-backed Supabase Auth client.
  // Never use the service-role client to validate passwords.
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },

      setAll(items) {
        for (const item of items) {
          cookieStore.set(
            item.name,
            item.value,
            item.options
          )
        }
      },
    },
  })
}

export async function enterRegisteredExamAction(
  rawCode: string,
  credentials?: LoginCredentials
): Promise<LoginResult> {
  try {
    const code = normalizeExamEntryCode(rawCode)

    if (!isExamEntryCode(code)) {
      return {
        success: false,
        error: "Invalid examination link.",
      }
    }

    const cookieStore = await cookies()
    const authClient = getAuthClient(cookieStore)

    // Optional sign-in:
    // If credentials were provided, authenticate them first.
    // Otherwise reuse an existing valid school session.
    if (credentials) {
      const email = credentials.email?.trim() ?? ""
      const password = credentials.password ?? ""

      if (!email || !password) {
        return {
          success: false,
          error: "Enter your school email and password.",
        }
      }

      const { error: signInError } =
        await authClient.auth.signInWithPassword({
          email,
          password,
        })

      if (signInError) {
        return {
          success: false,
          error: "Invalid email or password.",
        }
      }
    }

    // Always verify the authenticated user with Supabase Auth.
    // Do not trust a decoded cookie or browser-submitted user ID.
    const { data: auth, error: userError } =
      await authClient.auth.getUser()

    if (userError || !auth.user) {
      return {
        success: false,
        error:
          "Sign in with your registered school account to continue.",
      }
    }

    // Issue a cryptographically random candidate session token.
    const token = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex")

    // The service-role client is used only after getUser()
    // has verified the identity.
    const { data, error } =
      await getPublicExamClient().rpc(
        "cbt_login_with_registered_account",
        {
          p_entry_code: code,
          p_user_id: auth.user.id,
          p_token_hash: tokenHash,
        }
      )

    if (error) {
      console.error("[CBT:REGISTERED_ENTRY]", {
        code: error.code,
        message: error.message,
      })

      return {
        success: false,
        error:
          "Unable to authorize examination access. Please try again.",
      }
    }

    const result = data as {
      ok?: boolean
      reason?: string
      expires_at?: string
    } | null

    if (!result?.ok || !result.expires_at) {
      return {
        success: false,
        error:
          "Your account is not assigned to this examination, " +
          "or the examination is not available. " +
          "Please contact your school.",
      }
    }

    const expires = new Date(result.expires_at)

    if (
      Number.isNaN(expires.getTime()) ||
      expires.getTime() <= Date.now()
    ) {
      return {
        success: false,
        error: "The examination entry session has expired.",
      }
    }

    // Use the existing cookie name so getCurrentExamSession()
    // and the /ready page work without a separate player.
    cookieStore.set(
      examSessionCookieName(code),
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: `/take/${code}`,
        expires,
      }
    )

    return { success: true }
  } catch (error) {
    console.error("[CBT:REGISTERED_ENTRY_ACTION]", error)

    return {
      success: false,
      error:
        "Examination sign-in could not be completed. " +
        "Please try again.",
    }
  }
}
