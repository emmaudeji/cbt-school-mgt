"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { tables, urls } from "@/constants"
import { getStaffContext } from "@/services/auth"
import { toSlug } from "@/lib"

type ActionResult = {
  success: boolean
  error?: string
  data?: { id: string; name: string }
}


type DuplicateExamResult =
  | { success: true; slug: string; sections: number; rules: number }
  | { success: false; error: string }

export async function duplicateExamAction(
  examId: string,
  title: string
): Promise<DuplicateExamResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(examId)) {
    return { success: false, error: "Invalid examination." }
  }

  const trimmed = title.trim()
  if (trimmed.length < 2 || trimmed.length > 200) {
    return { success: false, error: "Enter a title containing 2–200 characters." }
  }

  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { data, error } = await context.supabase.rpc("cbt_duplicate_exam", {
    p_exam_id: examId,
    p_title: trimmed,
  })

  if (error) {
    console.error("[CBT:DUPLICATE_EXAM]", { examId, error })
    return { success: false, error: "Unable to duplicate this examination. Check your access and try again." }
  }

  if (!data || typeof data !== "object" || typeof data.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return { success: false, error: "The copied examination could not be confirmed." }
  }

  revalidatePath("/exams")
  return {
    success: true,
    slug: data.slug,
    sections: Number(data.sections ?? 0),
    rules: Number(data.rules ?? 0),
  }
}
