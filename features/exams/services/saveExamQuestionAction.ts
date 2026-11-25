
"use server"

import { revalidatePath } from "next/cache"

import { urls, tables } from "@/constants"
import { getStaffContext } from "@/services/auth"

export type SaveQuestionResult = {
  success: boolean
  error?: string
}

const ANSWER_KEYS = [
  "a",
  "b",
  "c",
  "d",
] as const

const DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
] as const

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function read(
  formData: FormData,
  key: string
): string {
  const value = formData.get(key)

  return typeof value === "string"
    ? value.trim()
    : ""
}

function fail(
  error: string
): SaveQuestionResult {
  return {
    success: false,
    error,
  }
}

export async function saveExamQuestionAction(
  examId: string,
  slug: string,
  formData: FormData
): Promise<SaveQuestionResult> {
  const context = await getStaffContext()

  if (!context) {
    return fail("Your session has expired.")
  }

  if (!UUID.test(examId) || !slug) {
    return fail("Invalid examination.")
  }

  const prompt = read(formData, "prompt")
  const sectionId = read(formData, "section_id")
  const topicId = read(formData, "topic_id")

  const correctKey = read(
    formData,
    "correct_option"
  ).toLowerCase()

  const explanation = read(
    formData,
    "explanation"
  )

  const difficulty = read(
    formData,
    "difficulty"
  ) || "medium"

  const pointsText = read(
    formData,
    "points"
  )

  const points = Number(pointsText)

  // The RPC expects stable lowercase identifiers.
  // Do not prefix the answer text with A., B., etc.
  const options = ANSWER_KEYS.map((key) => ({
    key,
    body: read(formData, `option_${key}`),
  }))

  if (!prompt) {
    return fail("Enter the question.")
  }

  if (prompt.length > 10000) {
    return fail(
      "The question is too long. Maximum 10,000 characters."
    )
  }

  if (!UUID.test(sectionId)) {
    return fail(
      "Select a valid examination section."
    )
  }

  if (topicId && !UUID.test(topicId)) {
    return fail("Select a valid question topic.")
  }

  for (const option of options) {
    if (!option.body) {
      return fail(
        `Enter answer option ${option.key.toUpperCase()}.`
      )
    }

    if (option.body.length > 2000) {
      return fail(
        `Option ${option.key.toUpperCase()} is too long.`
      )
    }
  }

  if (
    !ANSWER_KEYS.some(
      (key) => key === correctKey
    )
  ) {
    return fail(
      "Select the correct answer from A, B, C or D."
    )
  }

  if (
    !pointsText ||
    !Number.isFinite(points) ||
    points < 0 ||
    points > 1000
  ) {
    return fail(
      "Marks must be between 0 and 1,000."
    )
  }

  if (
    !DIFFICULTIES.some(
      (value) => value === difficulty
    )
  ) {
    return fail("Select a valid difficulty.")
  }

  // Validate ownership and editability before
  // allowing the question-creation RPC.
  const { data: exam, error: examError } =
    await context.supabase
      .from(tables.cbt_exams)
      .select(
        "id, slug, status, default_bank_id, default_category_id"
      )
      .eq("organization_id", context.organizationId)
      .eq("id", examId)
      .eq("slug", slug)
      .maybeSingle()

  if (examError || !exam) {
    console.error(
      "[CBT:QUESTION_EXAM_LOOKUP]",
      examError
    )

    return fail(
      "Examination not found or access denied."
    )
  }

  if (
    exam.status !== "draft" &&
    exam.status !== "active"
  ) {
    return fail(
      "This examination is no longer editable."
    )
  }

  if (
    !exam.default_bank_id ||
    !exam.default_category_id
  ) {
    return fail(
      "Configure a question bank and category before adding questions."
    )
  }

  const { data: section, error: sectionError } =
    await context.supabase
      .from(tables.cbt_exam_sections)
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("exam_id", exam.id)
      .eq("id", sectionId)
      .maybeSingle()

  if (sectionError || !section) {
    console.error(
      "[CBT:QUESTION_SECTION_LOOKUP]",
      sectionError
    )

    return fail(
      "The selected section does not belong to this examination."
    )
  }

  // An optional topic must belong to the
  // examination's default bank and category.
  if (topicId) {
    const { data: topic, error: topicError } =
      await context.supabase
        .from(tables.cbt_topics)
        .select("id")
        .eq(
          "organization_id",
          context.organizationId
        )
        .eq(
          "bank_id",
          exam.default_bank_id
        )
        .eq(
          "category_id",
          exam.default_category_id
        )
        .eq("id", topicId)
        .maybeSingle()

    if (topicError || !topic) {
      console.error(
        "[CBT:QUESTION_TOPIC_LOOKUP]",
        topicError
      )

      return fail(
        "The selected topic does not belong to this question bank and category."
      )
    }
  }

  const { error } = await context.supabase.rpc(
    "cbt_save_exam_question",
    {
      p_exam_id: exam.id,
      p_section_id: section.id,
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
    console.error(
      "[CBT:SAVE_QUESTION]",
      {
        examId,
        organizationId: context.organizationId,
        code: error.code,
        message: error.message,
      }
    )

    return fail(
      error.message ||
        "Unable to save question."
    )
  }

  revalidatePath(urls.examDetails(slug))
  revalidatePath(urls.examQuestions(slug))

  return {
    success: true,
  }
}
