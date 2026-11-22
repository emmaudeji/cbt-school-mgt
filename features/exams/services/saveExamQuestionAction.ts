
"use server"

import { revalidatePath } from "next/cache"

import { urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

export type SaveQuestionResult = {
  success: boolean
  error?: string
}

export async function saveExamQuestionAction(
  examId: string,
  slug: string,
  formData: FormData
): Promise<SaveQuestionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Your session has expired." }
  }

  const prompt = String(formData.get("prompt") ?? "").trim()
  const sectionId = String(formData.get("section_id") ?? "")
  const topicId = String(formData.get("topic_id") ?? "")
  const correctKey = String(formData.get("correct_option") ?? "")
  const explanation = String(formData.get("explanation") ?? "").trim()
  const difficulty = String(formData.get("difficulty") ?? "medium")
  const points = Number(formData.get("points") ?? 1)


  const options = ["a", "b", "c", "d"].map((key) => ({
    key,
    body: String(formData.get(`option_${key}`) ?? "").trim(),
  }))

    console.log({
      p_exam_id: examId,
      p_section_id: sectionId,
      p_topic_id: topicId || null,
      p_prompt: prompt,
      p_options: options,
      p_correct_key: correctKey,
      p_explanation: explanation || null,
      p_points: points,
      p_difficulty: difficulty,
    })


  if (!sectionId || !prompt || options.some((option) => !option.body)) {
    return {
      success: false,
      error: "Complete the question, answer options and section.",
    }
  }

  if (!["a", "b", "c", "d"].includes(correctKey)) {
    return { success: false, error: "Select the correct answer." }
  }

  if (!Number.isFinite(points) || points < 0) {
    return { success: false, error: "Enter valid marks." }
  }

  const { error } = await context.supabase.rpc(
    "cbt_save_exam_question",
    {
      p_exam_id: examId,
      p_section_id: sectionId,
      p_topic_id: topicId || null,
      p_prompt: prompt,
      p_options: options,
      p_correct_key: correctKey,
      p_explanation: explanation || null,
      p_points: points,
      p_difficulty: difficulty,
    }
  )

  if (error) {
    console.error("[CBT:SAVE_QUESTION]", {
      examId,
      error,
    })

    return {
      success: false,
      error: error.message || "Unable to save question.",
    }
  }

  console.info("[CBT:SAVE_QUESTION]", {
    examId,
    sectionId,
  })

  revalidatePath(urls.examDetails(slug))

  return { success: true }
}
