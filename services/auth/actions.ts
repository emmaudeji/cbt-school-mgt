
"use server"

import { revalidatePath } from "next/cache"

import type { AuthResult } from "@/types/auth"
import { createClient } from "@/utils/supabase/server"
import { CBT_ORGANIZATION_SLUG, urls } from "@/constants"
import { getMembership } from "."
import { getDashboardRoute } from "./helper"

export async function signIn(
  identifier: string,
  password: string
): Promise<AuthResult> {
  const email = identifier.trim().toLowerCase()

  if (!email || !password) {
    return {
      success: false,
      error: "Enter your email and password.",
    }
  }

  if (!email.includes("@")) {
    return {
      success: false,
      error: "Please sign in using your email address.",
    }
  }

  const supabase = await createClient()

  try {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error || !data.user) {
      return {
        success: false,
        error: "Invalid login credentials.",
      }
    }
    
    const context = await getMembership(
      data.user.id,
      CBT_ORGANIZATION_SLUG
    )

    const redirectTo = context
      ? getDashboardRoute(context.roles)
      : null

    if (!redirectTo) {
      await supabase.auth.signOut()

      return {
        success: false,
        error: "Your account has no assigned CBT access.",
      }
    }

    revalidatePath("/", "layout")

    return {
      success: true,
      redirectTo,
    }
  } catch (error) {
    console.error("[CBT:AUTH:LOGIN]", error)

    await supabase.auth.signOut()

    return {
      success: false,
      error: "Unable to sign in. Please try again.",
    }
  }
}


export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      error: "Unable to sign out.",
    }
  }

  revalidatePath("/", "layout")

  return {
    success: true,
    redirectTo: "/",
  }
}

// export async function registerUser(
//   input: RegisterUserInput
// ): Promise<AuthResult> {
//   const admin = await requireAdmin()

//   const firstName = input.firstName.trim()
//   const lastName = input.lastName.trim()
//   const email = input.email.trim().toLowerCase()
//   const admissionNumber = input.admissionNumber?.trim() || null
//   const staffNumber = input.staffNumber?.trim() || null

//   if (
//     !firstName ||
//     !lastName ||
//     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
//     !validPassword(input.password)
//   ) {
//     return {
//       success: false,
//       error: "Provide valid user details and a password of 8–72 characters.",
//     }
//   }

//   if (!["admin", "teacher", "student"].includes(input.role)) {
//     return { success: false, error: "Invalid user role." }
//   }

//   if (input.role === "student" && !admissionNumber) {
//     return {
//       success: false,
//       error: "Admission number is required for students.",
//     }
//   }

//   if (input.role !== "student" && !staffNumber) {
//     return {
//       success: false,
//       error: "Staff number is required for staff.",
//     }
//   }

//   const { data, error } =
//     await supabaseAdmin.auth.admin.createUser({
//       email,
//       password: input.password,
//       email_confirm: true,
//     })

//   if (error || !data.user) {
//     return {
//       success: false,
//       error: "Unable to create account. Check whether the email already exists.",
//     }
//   }

//   const { error: profileError } = await supabaseAdmin
//     .from(tables.profiles)
//     .insert({
//       id: data.user.id,
//       school_id: admin.school_id,
//       role: input.role,
//       first_name: firstName,
//       last_name: lastName,
//       admission_number:
//         input.role === "student" ? admissionNumber : null,
//       staff_number:
//         input.role !== "student" ? staffNumber : null,
//       is_active: true,
//     })

//   if (profileError) {
//     // Compensate for a failed profile insert.
//     const { error: rollbackError } =
//       await supabaseAdmin.auth.admin.deleteUser(data.user.id)

//     if (rollbackError) {
//       console.error(
//         "[auth] Account cleanup failed:",
//         data.user.id,
//         rollbackError.message
//       )
//     }

//     console.error(
//       "[auth] Profile creation failed:",
//       profileError.message
//     )

//     return {
//       success: false,
//       error: "Unable to complete account registration.",
//     }
//   }

//   revalidatePath("/admin/users")

//   return { success: true }
// }

// export async function changePassword(
//   currentPassword: string,
//   newPassword: string
// ): Promise<AuthResult> {
//   if (!validPassword(newPassword)) {
//     return {
//       success: false,
//       error: "Password must contain 8–72 characters.",
//     }
//   }

//   const supabase = await createClient()
//   const { data } = await supabase.auth.getUser()

//   if (!data.user?.email) {
//     return { success: false, error: "Please sign in again." }
//   }

//   const { error: verificationError } =
//     await supabase.auth.signInWithPassword({
//       email: data.user.email,
//       password: currentPassword,
//     })

//   if (verificationError) {
//     return {
//       success: false,
//       error: "Current password is incorrect.",
//     }
//   }

//   const { error } = await supabase.auth.updateUser({
//     password: newPassword,
//   })

//   if (error) {
//     return {
//       success: false,
//       error: "Unable to update password.",
//     }
//   }

//   return { success: true }
// }

// export async function resetUserPassword(
//   userId: string,
//   newPassword: string
// ): Promise<AuthResult> {
//   const admin = await requireAdmin()

//   if (!validPassword(newPassword)) {
//     return {
//       success: false,
//       error: "Password must contain 8–72 characters.",
//     }
//   }

//   const { data: target, error: lookupError } =
//     await supabaseAdmin
//       .from("profiles")
//       .select("id")
//       .eq("id", userId)
//       .eq("school_id", admin.school_id)
//       .maybeSingle()

//   if (lookupError || !target) {
//     return {
//       success: false,
//       error: "User not found.",
//     }
//   }

//   const { error } =
//     await supabaseAdmin.auth.admin.updateUserById(userId, {
//       password: newPassword,
//     })

//   if (error) {
//     return {
//       success: false,
//       error: "Unable to reset password.",
//     }
//   }

//   return { success: true }
// }