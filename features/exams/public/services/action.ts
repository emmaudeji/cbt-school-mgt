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

export async function createPublicExamLinkAction(
  examId: string,
  slug: string,
  availableFrom: string,
  availableUntil: string
): Promise<{
  success: boolean
  error?: string
  entryCode?: string
}> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      error: "Your session has expired.",
    }
  }

  const start = new Date(availableFrom)
  const end = new Date(availableUntil)

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start ||
    end <= new Date()
  ) {
    return {
      success: false,
      error: "Select a valid examination availability period.",
    }
  }

  const { data: exam, error: examError } = await context.supabase
    .from(tables.cbt_exams)
    .select("id")
    .eq("id", examId)
    .eq("slug", slug)
    .eq("organization_id", context.organizationId)
    .eq("status", "active")
    .maybeSingle()

  if (examError || !exam) {
    return {
      success: false,
      error: "A published examination is required.",
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_create_public_link_revision",
    {
      p_exam_id: examId,
      p_available_from: start.toISOString(),
      p_available_until: end.toISOString(),
    }
  )

  if (error) {
    console.error("[CBT:CREATE_PUBLIC_LINK]", error)

    return {
      success: false,
      error: error.message || "Unable to create a public link.",
    }
  }

  revalidatePath(urls.examCandidates(slug)  )
  revalidatePath(urls.examSettings(slug)  )

  return {
    success: true,
    entryCode: data.entry_code,
  }
}
