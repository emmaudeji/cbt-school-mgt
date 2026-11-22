
"use server"

import { revalidatePath } from "next/cache"

import { urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

type Input = {
  examId: string
  sectionId: string
  title: string
  instructions: string
  templateId: string | null
}

type Result = {
  success: boolean
  error?: string
}

export async function updateExamSectionAction(
  input: Input
): Promise<Result> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      error: "Your session has expired.",
    }
  }

  const {
    examId,
    sectionId,
    templateId,
    instructions,
  } = input

  const title = input.title.trim()

  if (!templateId && (!title || title.length > 120)) {
    return {
      success: false,
      error: "Enter a section name of up to 120 characters.",
    }
  }

  const { data: exam, error: examError } =
    await context.supabase
      .from("cbt_exams")
      .select("slug, status")
      .eq("id", examId)
      .eq("organization_id", context.organizationId)
      .maybeSingle()

  if (
    examError ||
    !exam ||
    !["draft", "active"].includes(exam.status)
  ) {
    return {
      success: false,
      error: "This examination cannot be edited.",
    }
  }

  const { error } = await context.supabase.rpc(
    "cbt_update_exam_section",
    {
      p_exam_id: examId,
      p_section_id: sectionId,
      p_title: title,
      p_instructions: instructions.trim() || null,
      p_template_id: templateId,
    }
  )

  if (error) {
    console.error("[CBT:UPDATE_SECTION]", {
      examId,
      sectionId,
      error,
    })

    return {
      success: false,
      error: error.message ?? "Unable to update section.",
    }
  }

  revalidatePath(urls.examQuestions(exam.slug))
  revalidatePath(urls.examAddQuestion(exam.slug))
  revalidatePath(urls.examDetails(exam.slug))

  return { success: true }
}
