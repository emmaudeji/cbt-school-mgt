
"use server"

import { revalidatePath } from "next/cache"

import { urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

type ActionResult = {
  success: boolean
  error?: string
  data?: { id: string; name: string }
}

function refreshExam(slug: string) {
  revalidatePath(urls.examDetails(slug))
  revalidatePath(urls.examAddQuestion(slug))
}

// Create globally and add to this exam.
export async function createExamSectionAction(
  examId: string,
  name: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  const title = name.trim()

  if (!title || title.length > 120) {
    return {
      success: false,
      error: "Enter a section name (maximum 120 characters).",
    }
  }

  const { data: exam } = await context.supabase
    .from("cbt_exams")
    .select("slug")
    .eq("id", examId)
    .eq("organization_id", context.organizationId)
    .maybeSingle()

  if (!exam) {
    return { success: false, error: "Examination not found." }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_create_and_add_exam_section",
    {
      p_exam_id: examId,
      p_title: title,
    }
  )

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Unable to create section.",
    }
  }

  const { data: section, error: sectionError } =
    await context.supabase
      .from("cbt_exam_sections")
      .select("id, title")
      .eq("organization_id", context.organizationId)
      .eq("exam_id", examId)
      .eq("id", data)
      .single()

  if (sectionError || !section) {
    return {
      success: false,
      error: "Section was created but could not be loaded. Refresh the page.",
    }
  }

  refreshExam(exam.slug)

  return {
    success: true,
    data: { id: section.id, name: section.title },
  }
}

// Add an existing organization template to this exam.
export async function addExistingExamSectionAction(
  examId: string,
  templateId: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  const { data: exam } = await context.supabase
    .from("cbt_exams")
    .select("slug")
    .eq("organization_id", context.organizationId)
    .eq("id", examId)
    .maybeSingle()

  if (!exam) {
    return { success: false, error: "Examination not found." }
  }

  const { data: existing } = await context.supabase
    .from("cbt_exam_sections")
    .select("id, title")
    .eq("organization_id", context.organizationId)
    .eq("exam_id", examId)
    .eq("section_template_id", templateId)
    .maybeSingle()

  if (existing) {
    return {
      success: true,
      data: { id: existing.id, name: existing.title },
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_add_section_from_template",
    {
      p_exam_id: examId,
      p_template_id: templateId,
    }
  )

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Unable to add section.",
    }
  }

  const { data: section } = await context.supabase
    .from("cbt_exam_sections")
    .select("id, title")
    .eq("organization_id", context.organizationId)
    .eq("exam_id", examId)
    .eq("id", data)
    .single()

  refreshExam(exam.slug)

  return {
    success: true,
    data: {
      id: data,
      name: section?.title ?? "Section",
    },
  }
}

// Removes the section AND its examination question rules.
// Existing question-bank records remain untouched.
export async function removeExamSectionAction(
  examId: string,
  sectionId: string
): Promise<{
  success: boolean
  removed: number
  error?: string
}> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      removed: 0,
      error: "Session expired.",
    }
  }

  const { data: exam } = await context.supabase
    .from("cbt_exams")
    .select("slug")
    .eq("organization_id", context.organizationId)
    .eq("id", examId)
    .maybeSingle()

  if (!exam) {
    return {
      success: false,
      removed: 0,
      error: "Examination not found.",
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_remove_exam_section",
    {
      p_exam_id: examId,
      p_section_id: sectionId,
    }
  )

  if (error) {
    return {
      success: false,
      removed: 0,
      error: error.message,
    }
  }

  refreshExam(exam.slug)

  return {
    success: true,
    removed: Number(data ?? 0),
  }
}

// Create a reusable organization topic and make it
// available to the current question bank/subject.
export async function createTopicAction(
  bankId: string,
  categoryId: string,
  name: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  const title = name.trim()

  if (!title || title.length > 120) {
    return {
      success: false,
      error: "Enter a valid topic name.",
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_create_and_use_org_topic",
    {
      p_bank_id: bankId,
      p_category_id: categoryId,
      p_name: title,
    }
  )

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Unable to create topic.",
    }
  }

  const { data: topic } = await context.supabase
    .from("cbt_topics")
    .select("id, name")
    .eq("id", data)
    .eq("organization_id", context.organizationId)
    .single()

  return {
    success: true,
    data: {
      id: data,
      name: topic?.name ?? title,
    },
  }
}


export async function useOrganizationTopicAction(
  catalogTopicId: string,
  bankId: string,
  categoryId: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_use_organization_topic",
    {
      p_catalog_topic_id: catalogTopicId,
      p_bank_id: bankId,
      p_category_id: categoryId,
    }
  )

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Unable to use topic.",
    }
  }

  const { data: topic } = await context.supabase
    .from("cbt_topics")
    .select("id, name")
    .eq("id", data)
    .eq("organization_id", context.organizationId)
    .single()

  if (!topic) {
    return {
      success: false,
      error: "Topic could not be loaded.",
    }
  }

  return {
    success: true,
    data: { id: topic.id, name: topic.name },
  }
}
