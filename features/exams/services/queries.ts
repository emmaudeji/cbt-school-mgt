import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { tables, urls } from "@/constants"
import { getStaffContext } from "@/services/auth"

import type {
  CbtExamDetails,
  CbtExamQuestionVersion,
  ExamData,
  CbtExamSectionDetails,
  ExamStatus,
  GetExamQuestionsResult,
} from "@/types/exams"


// 1. Examination details
export const getExamBySlug = cache(async (slug: string) => {

  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const { data, error } = await context.supabase
    .from(tables.cbt_exams)
    .select(`
      id,
      organization_id,
      title,
      slug,
      description,
      status,
      created_by,
      created_at,
      updated_at,
      default_bank_id,
      default_category_id,
      bank:cbt_question_banks!cbt_exams_default_bank_fk (
        id,
        name
      ),
      category:cbt_categories!cbt_exams_default_category_fk (
        id,
        name
      ),
      cbt_exam_sections (
        id,
        cbt_exam_question_rules (
          kind,
          count_required
        )
      )
    `)
    .eq("organization_id", context.organizationId)
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("[CBT:GET_EXAM]", {
      slug,
      organizationId: context.organizationId,
      error,
    })

    throw new Error("Unable to load examination.")
  }

  if (!data) {
    console.warn("[CBT:EXAM_NOT_FOUND]", {
      slug,
      organizationId: context.organizationId,
      userId: context.userId,
    })

    notFound()
  }

  const sections = (data.cbt_exam_sections ?? []) as ExamData["cbt_exam_sections"]

  const questionCount = sections.reduce(
    (total, section) =>
      total +
      section.cbt_exam_question_rules.reduce(
        (count, rule) => count + rule.count_required,
        0
      ),
    0
  )

  return {
    ...data,
    bank: data.bank as unknown as ExamData["bank"],
    category: data.category as unknown as ExamData["category"],
    questionCount,
    sectionCount: sections.length,
  } satisfies ExamData
})




export const getExamQuestions = cache(
  async (slug: string): Promise<GetExamQuestionsResult> => {
    const exam = await getExamBySlug(slug)
    const context = await getStaffContext()

    if (!context) notFound()

    const [sectionsResult, topicsResult] = await Promise.all([
      context.supabase
        .from(tables.cbt_exam_sections)
        .select(`
          id,
          title,
          position,
          instructions,
          section_template_id,
          cbt_exam_question_rules (
            id,
            kind,
            position,
            count_required,
            points_override,
            bank_id,
            category_id,
            question_version_id,
            difficulty,
            question_type,
            version:cbt_question_versions (
              id,
              question_id,
              type,
              prompt,
              explanation,
              difficulty,
              default_points,
              status,
              cbt_question_options (
                id,
                option_key,
                body,
                display_order
              ),
              cbt_questions (
                id,
                topic_id,
                cbt_topics (
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq("organization_id", context.organizationId)
        .eq("exam_id", exam.id)
        .order("position"),

      context.supabase
        .from(tables.cbt_topics)
        .select("id, name")
        .eq("organization_id", context.organizationId)
        .eq("bank_id", exam.default_bank_id ?? "")
        .eq("category_id", exam.default_category_id ?? "")
        .order("name"),
    ])

    if (sectionsResult.error || topicsResult.error) {
      console.error("[CBT:GET_EXAM_QUESTIONS]", {
        sections: sectionsResult.error,
        topics: topicsResult.error,
      })

      throw new Error("Unable to load examination questions.")
    }

    const sectionData = (
      sectionsResult.data ?? []
    ) as unknown as CbtExamSectionDetails[]

    const sections: CbtExamSectionDetails[] = sectionData.map(
      (section) => ({
        ...section,
        section_template_id: section.section_template_id ?? null,
        cbt_exam_question_rules: section.cbt_exam_question_rules
          .map((rule) => ({
            ...rule,
            version: rule.version
              ? {
                  ...rule.version,
                  cbt_question_options: [
                    ...rule.version.cbt_question_options,
                  ].sort(
                    (a, b) => a.display_order - b.display_order
                  ),
                }
              : null,
          }))
          .sort((a, b) => a.position - b.position),
      })
    )

    return {
      exam,
      sections,
      topics: topicsResult.data ?? [],
      questionCount: exam.questionCount,
    }
  }
)



export async function getOrganizationSectionTemplates() {
  const context = await getStaffContext()

  if (!context) notFound()

  const { data, error } = await context.supabase
    .from("cbt_section_templates")
    .select("id, title")
    .eq("organization_id", context.organizationId)
    .order("title")

  if (error) {
    console.error("[CBT:SECTION_TEMPLATES]", error)
    throw new Error("Unable to load organization sections.")
  }

  return data ?? []
}

export async function getOrganizationTopicCatalog() {
  const context = await getStaffContext()
  if (!context) notFound()

  const { data, error } = await context.supabase
    .from("cbt_topic_catalog")
    .select("id, name")
    .eq("organization_id", context.organizationId)
    .order("name")

  if (error) {
    throw new Error("Unable to load organization topics.")
  }

  return data ?? []
}

export const getQuestionEditorOptions = cache(async (slug: string) => {
  const exam = await getExamBySlug(slug)
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const [topicsResult, sectionsResult] = await Promise.all([
    context.supabase
      .from(tables.cbt_topics)
      .select("id, name")
      .eq("organization_id", context.organizationId)
      .eq("bank_id", exam.default_bank_id ?? "")
      .eq("category_id", exam.default_category_id ?? "")
      .order("name"),

    context.supabase
      .from(tables.cbt_exam_sections)
      .select("id, title, position")
      .eq("organization_id", context.organizationId)
      .eq("exam_id", exam.id)
      .order("position"),
  ])

  if (topicsResult.error || sectionsResult.error) {
    console.error("[CBT:QUESTION_EDITOR_OPTIONS]", {
      topics: topicsResult.error,
      sections: sectionsResult.error,
    })

    throw new Error("Unable to load question editor.")
  }

  return {
    exam,
    topics: topicsResult.data ?? [],
    sections: sectionsResult.data ?? [],
  }
})


import type { ExamSettings } from "@/types/exam-settings"

export const getExamSettings = cache(
  async (slug: string): Promise<ExamSettings> => {
    const context = await getStaffContext()

    if (!context) notFound()

    const { data, error } = await context.supabase
      .from(tables.cbt_exams)
      .select(`
        id,
        slug,
        title,
        description,
        status,
        instructions,
        duration_seconds,
        available_from,
        available_until,
        max_attempts,
        shuffle_questions,
        shuffle_options
      `)
      .eq("organization_id", context.organizationId)
      .eq("slug", slug)
      .maybeSingle()

    if (error) {
      console.error("[CBT:GET_EXAM_SETTINGS]", error)
      throw new Error("Unable to load examination settings.")
    }

    if (!data) notFound()

    return data as ExamSettings
  }
)

type ResultSettings = {
  show_result_after_submission: boolean
  allow_exam_review: boolean
  review_release: "after_close" | "after_submission"
}

export const getExamResultSettings = cache(
  async (examId: string): Promise<ResultSettings> => {
    const context = await getStaffContext()

    if (!context) notFound()

    const { data, error } = await context.supabase.rpc(
      "cbt_get_exam_result_settings",
      {
        p_exam_id: examId,
      }
    )

    if (error) {
      console.error("[CBT:GET_EXAM_RESULT_SETTINGS]", error)
      throw new Error(
        "Unable to load examination result settings."
      )
    }

    if (
      !data ||
      typeof data.show_result_after_submission !== "boolean" ||
      typeof data.allow_exam_review !== "boolean" ||
      !["after_close", "after_submission"].includes(
        data.review_release
      )
    ) {
      throw new Error(
        "Invalid examination result settings response."
      )
    }

    return data as ResultSettings
  }
)


export type ExamAccessMode =
  | "access_code"
  | "open_link"
  | "registered"

export type ExamPublicationOverview = {
  sections: {
    id: string
    title: string
    questionCount: number
  }[]
  latestPublication: {
    id: string
    revision: number
    published_at: string
    accessMode: ExamAccessMode | null
  } | null
  questionCount: number
}


export const getExamPublicationOverview = cache(
  async (examId: string): Promise<ExamPublicationOverview> => {
    const context = await getStaffContext()

    if (!context) notFound()

    const [sectionsResult, publicationResult] =
      await Promise.all([
        context.supabase
          .from(tables.cbt_exam_sections)
          .select(`
            id,
            title,
            cbt_exam_question_rules (
              count_required
            )
          `)
          .eq("organization_id", context.organizationId)
          .eq("exam_id", examId)
          .order("position"),

        context.supabase
          .from(tables.cbt_exam_publications)
          .select("id, revision, published_at")
          .eq("organization_id", context.organizationId)
          .eq("exam_id", examId)
          .order("revision", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

    if (sectionsResult.error || publicationResult.error) {
      console.error("[CBT:PUBLICATION_OVERVIEW]", {
        sections: sectionsResult.error,
        publication: publicationResult.error,
      })

      throw new Error("Unable to load publication overview.")
    }

    const sections = (sectionsResult.data ?? []).map(
      section => ({
        id: section.id,
        title: section.title,
        questionCount:
          section.cbt_exam_question_rules.reduce(
            (total, rule) =>
              total + rule.count_required,
            0
          ),
      })
    )

    const publication = publicationResult.data

    let latestPublication:
      ExamPublicationOverview["latestPublication"] = null

    if (publication) {
      const { data: accessPolicy, error: accessError } =
        await context.supabase
          .from(tables.cbt_exam_access_policies)
          .select("mode")
          .eq("organization_id", context.organizationId)
          .eq("publication_id", publication.id)
          .maybeSingle()

      if (accessError) {
        console.error(
          "[CBT:PUBLICATION_ACCESS_POLICY]",
          accessError
        )

        throw new Error(
          "Unable to load examination access settings."
        )
      }

      const mode = accessPolicy?.mode

      const accessMode: ExamAccessMode | null =
        mode === "access_code" ||
        mode === "open_link" ||
        mode === "registered"
          ? mode
          : null

      latestPublication = {
        id: publication.id,
        revision: publication.revision,
        published_at: publication.published_at,
        accessMode,
      }
    }

    return {
      sections,
      latestPublication,
      questionCount: sections.reduce(
        (total, section) =>
          total + section.questionCount,
        0
      ),
    }
  }
)


// Add to features/exams/services/queries.ts
// Uses the existing getStaffContext import.
export async function getExamCorrectAnswers(
  examId: string
): Promise<Record<string, string[]>> {
  const context = await getStaffContext()

  if (!context) return {}

  const { data, error } = await context.supabase.rpc(
    "cbt_get_exam_correct_answers",
    { p_exam_id: examId }
  )

  if (error) {
    console.error("[CBT:GET_EXAM_CORRECT_ANSWERS]", error)
    return {}
  }

  const answers: Record<string, string[]> = {}

  for (const row of data ?? []) {
    if (
      typeof row.rule_id === "string" &&
      Array.isArray(row.correct_keys)
    ) {
      answers[row.rule_id] = row.correct_keys.filter(
        (key: unknown): key is string => typeof key === "string"
      )
    }
  }

  return answers
}
