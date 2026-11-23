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

// 1. Fetch bank and subject options
export async function getExamSetupOptions(orgId?: string) {
  const context = await getStaffContext(orgId)

  if (!context) redirect(urls.login)

  const { supabase, organizationId } = context

  const [banksResult, categoriesResult] = await Promise.all([
    supabase
      .from(tables.cbt_question_banks)
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("name"),

    supabase
      .from(tables.cbt_categories)
      .select("id, name, bank_id")
      .eq("organization_id", organizationId)
      .order("name"),
  ])

  if (banksResult.error || categoriesResult.error) {
    console.error("[CBT:EXAM_OPTIONS]", {
      banks: banksResult.error,
      categories: categoriesResult.error,
    })

    return {
      banks: [],
      categories: [],
      error: "Unable to load question banks and subjects.",
    }
  }

  return {
    banks: banksResult.data ?? [],
    categories: categoriesResult.data ?? [],
    error: null,
  }
}

// 1b. isChool - Fetch school exam setup
export type SchoolExamSetupOptions = {
  sessions: {
    id: string
    name: string
    is_current: boolean
  }[]
  terms: {
    id: string
    session_id: string
    name: string
    position: number
    is_current: boolean
  }[]
  levels: {
    id: string
    name: string
    position: number
  }[]
  classes: {
    id: string
    session_id: string
    level_id: string
    name: string
  }[]
  subjects: {
    id: string
    name: string
  }[]
  offerings: {
    id: string
    session_id: string
    term_id: string
    class_id: string
    subject_id: string
  }[]
}

export type SchoolExamSetupResult = {
  options: SchoolExamSetupOptions
  error: string | null
}

const emptyOptions: SchoolExamSetupOptions = {
  sessions: [],
  terms: [],
  levels: [],
  classes: [],
  subjects: [],
  offerings: [],
}

export async function getSchoolExamSetupOptions():
  Promise<SchoolExamSetupResult> {
  const context = await getStaffContext()

  if (!context) {
    return {
      options: emptyOptions,
      error: "Your session has expired.",
    }
  }

  const db = context.supabase
  const org = context.organizationId

  const [
    sessionsResult,
    termsResult,
    levelsResult,
    classesResult,
    subjectsResult,
    offeringsResult,
  ] = await Promise.all([
    db
      .from("school_academic_sessions")
      .select("id, name, is_current")
      .eq("organization_id", org)
      .order("starts_on", { ascending: false }),

    db
      .from("school_terms")
      .select("id, session_id, name, position, is_current")
      .eq("organization_id", org)
      .order("position"),

    db
      .from("school_class_levels")
      .select("id, name, position")
      .eq("organization_id", org)
      .order("position"),

    db
      .from("school_classes")
      .select("id, session_id, level_id, name")
      .eq("organization_id", org)
      .order("name"),

    db
      .from("school_subjects")
      .select("id, name")
      .eq("organization_id", org)
      .order("name"),

    db
      .from("school_subject_offerings")
      .select(
        "id, session_id, term_id, class_id, subject_id"
      )
      .eq("organization_id", org),
  ])

  const errors = [
    sessionsResult.error,
    termsResult.error,
    levelsResult.error,
    classesResult.error,
    subjectsResult.error,
    offeringsResult.error,
  ].filter(Boolean)

  if (errors.length) {
    console.error("[SCHOOL:EXAM_SETUP_OPTIONS]", errors)

    return {
      options: emptyOptions,
      error: "Unable to load school academic options.",
    }
  }

  return {
    options: {
      sessions: sessionsResult.data ?? [],
      terms: termsResult.data ?? [],
      levels: levelsResult.data ?? [],
      classes: classesResult.data ?? [],
      subjects: subjectsResult.data ?? [],
      offerings: offeringsResult.data ?? [],
    },
    error: null,
  }
}


// 2. Create or reuse a question bank
export async function createQuestionBankAction(
  name: string,
  orgId?: string
): Promise<ActionResult> {
  const context = await getStaffContext(orgId)

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  name = name.trim()

  if (name.length < 2 || name.length > 200) {
    return {
      success: false,
      error: "Bank name must contain 2–200 characters.",
    }
  }

  const slug = toSlug(name)

  const { data, error } = await context.supabase
    .from(tables.cbt_question_banks)
    .upsert(
      {
        organization_id: context.organizationId,
        name,
        slug,
        created_by: context.userId,
      },
      {
        onConflict: "organization_id,slug",
        ignoreDuplicates: true,
      }
    )
    .select("id, name")
    .maybeSingle()

  if (error) {
    console.error("[CBT:CREATE_BANK]", error)
    return { success: false, error: "Unable to create question bank." }
  }

  if (data) return { success: true, data }

  // The bank already exists.
  const { data: existing, error: lookupError } = await context.supabase
    .from(tables.cbt_question_banks)
    .select("id, name")
    .eq("organization_id", context.organizationId)
    .eq("slug", slug)
    .single()

  if (lookupError) {
    console.error("[CBT:FETCH_BANK]", lookupError)
    return { success: false, error: "Unable to load question bank." }
  }

  return { success: true, data: existing }
}

// 3. Create or reuse a subject/category
export async function createCategoryAction(
  bankId: string,
  name: string,
  orgId?: string
): Promise<ActionResult> {
  const context = await getStaffContext(orgId)

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  name = name.trim()

  if (!bankId) {
    return { success: false, error: "Select a question bank first." }
  }

  if (name.length < 1 || name.length > 120) {
    return {
      success: false,
      error: "Subject name must contain 1–120 characters.",
    }
  }

  const slug = toSlug(name)

  const {data, error } = await context.supabase
    .from(tables.cbt_categories)
    .upsert(
      {
        organization_id: context.organizationId,
        bank_id: bankId,
        name,
        slug,
        created_by: context.userId,
      },
      {
        onConflict: "bank_id,slug",
        ignoreDuplicates: true,
      }
    )
    .select("id, name")
    .maybeSingle()

    if (error) {
      console.error("[CBT:CREATE_CATEGORY]", error)
      return {
        success: false,
        error: "Unable to create subject. Check the selected bank.",
      }
    }
    
    if (data) return { success: true, data }

    // The category already exists.
    const { data: existing, error: lookupError } = await context.supabase
      .from(tables.cbt_categories)
      .select("id, name")
      .eq("organization_id", context.organizationId)
      .eq("bank_id", bankId,)
      .eq("slug", slug)
      .single()

    if (lookupError) {
      console.error("[CBT:FETCH_CATEGORY]", lookupError)
      return { success: false, error: "Unable to load question category." }
    }

    return { success: true, data: existing }
}

// 4. Create examination

export type CreateExamState = {
  error: string | null
}

export async function createExamAction(
  _previousState: CreateExamState,
  formData: FormData
): Promise<CreateExamState> {
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const bankId = String(formData.get("default_bank_id") ?? "").trim()
  const categoryId = String(formData.get("default_category_id") ?? "").trim()

  if (title.length < 2 || title.length > 200) {
    return { error: "Test title must be between 2 and 200 characters." }
  }

  if (!bankId) {
    return { error: "Please select or create a question bank." }
  }

  if (!categoryId) {
    return { error: "Please select or create a subject." }
  }

  const slug = `${toSlug(title)}-${crypto.randomUUID().slice(0, 8)}`

  const { data, error } = await context.supabase
    .from(tables.cbt_exams)
    .insert({
      organization_id: context.organizationId,
      title,
      slug,
      description: description || null,
      default_bank_id: bankId,
      default_category_id: categoryId,
      status: "draft",
      created_by: context.userId,
    })
    .select("slug")
    .single()

  if (error) {
    console.error("[CBT:CREATE_EXAM]", error)

    if (error.code === "23503") {
      return {
        error: "The selected bank or subject is no longer valid. Please select them again.",
      }
    }

    return {
      error: "Unable to create the test. Please try again.",
    }
  }

  console.info("[CBT:CREATE_EXAM]", {
    organizationId: context.organizationId,
    slug: data.slug,
  })

  revalidatePath(urls.exams)
  redirect(urls.examDetails(data.slug))
}

// 4b. Create isSchool specific exams
export type SchoolCreateExamState = {
  error: string | null
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function read(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim()
}

export async function createSchoolExamAction(
  previousState: SchoolCreateExamState,
  formData: FormData
): Promise<SchoolCreateExamState> {
  const context = await getStaffContext()

  if (!context) redirect(urls.login)

  const mode = read(formData, "exam_mode")

  if (mode === "independent") {
    return createExamAction(previousState, formData)
  }

  if (mode !== "school") {
    return {
      error: "Select a valid examination type.",
    }
  }

  const title = read(formData, "title")
  const description = read(formData, "description")
  const bankId = read(formData, "default_bank_id")
  const categoryId = read(formData, "default_category_id")

  const targetScope = read(formData, "target_scope")
  const assignmentScope = read(
    formData,
    "assignment_scope"
  )

  const offeringIds = formData
    .getAll("school_offering_ids")
    .map(String)

  if (title.length < 2 || title.length > 200) {
    return {
      error: "Examination title must contain 2–200 characters.",
    }
  }

  if (description.length > 1000) {
    return {
      error: "Description cannot exceed 1,000 characters.",
    }
  }

  if (!UUID.test(bankId) || !UUID.test(categoryId)) {
    return {
      error: "Choose a valid question bank and topic.",
    }
  }

  if (
    offeringIds.length < 1 ||
    offeringIds.length > 100 ||
    !offeringIds.every((id) => UUID.test(id)) ||
    new Set(offeringIds).size !== offeringIds.length
  ) {
    return {
      error: "Select valid class arms with subject offerings.",
    }
  }

  if (!["level", "arms"].includes(targetScope)) {
    return {
      error: "Choose entire-level or selected-arm coverage.",
    }
  }

  if (!["class", "selected"].includes(assignmentScope)) {
    return {
      error: "Choose a valid student assignment scope.",
    }
  }

  const slug = [
    toSlug(title).slice(0, 190).replace(/-+$/, ""),
    crypto.randomUUID().slice(0, 8),
  ].join("-")

  const { data, error } = await context.supabase.rpc(
    "school_create_cbt_exam_for_classes",
    {
      p_title: title,
      p_description: description,
      p_slug: slug,
      p_bank_id: bankId,
      p_category_id: categoryId,
      p_offering_ids: offeringIds,
      p_target_scope: targetScope,
      p_assignment_scope: assignmentScope,
    }
  )

  if (error) {
    console.error("[SCHOOL:CREATE_MULTI_CLASS_EXAM]", {
      organizationId: context.organizationId,
      code: error.code,
      message: error.message,
    })

    return {
      error:
        error.code === "42501"
          ? "You do not have permission to create school examinations."
          : error.message ||
            "Unable to create the school examination.",
    }
  }

  if (typeof data !== "string" || !data) {
    return {
      error: "The new examination could not be confirmed.",
    }
  }

  revalidatePath(urls.exams)
  redirect(urls.examDetails(data))
}



// 5. Create Question Topics
export async function createTopicAction(
  bankId: string,
  categoryId: string,
  name: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  name = name.trim()

  if (!name || name.length > 120) {
    return { success: false, error: "Enter a valid topic name." }
  }

  const slug = toSlug(name)

  const { data, error } = await context.supabase
    .from(tables.cbt_topics)
    .upsert(
      {
        organization_id: context.organizationId,
        bank_id: bankId,
        category_id: categoryId,
        name,
        slug,
        created_by: context.userId,
      },
      {
        onConflict: "category_id,slug",
        ignoreDuplicates: true,
      }
    )
    .select("id, name")
    .maybeSingle()

  if (error) {
    console.error("[CBT:CREATE_TOPIC]", error)
    return { success: false, error: "Unable to create topic." }
  }

  if (data) return { success: true, data }

  const existing = await context.supabase
    .from(tables.cbt_topics)
    .select("id, name")
    .eq("organization_id", context.organizationId)
    .eq("category_id", categoryId)
    .eq("slug", slug)
    .single()

  if (existing.error || !existing.data) {
    console.error("[CBT:GET_TOPIC]", existing.error)
    return { success: false, error: "Unable to load topic." }
  }

  return { success: true, data: existing.data }
}

// Create Exam Sections
export async function createExamSectionAction(
  examId: string,
  name: string
): Promise<ActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  name = name.trim()

  if (!name) {
    return { success: false, error: "Enter a section name." }
  }

  const { data: exam, error: examError } = await context.supabase
    .from(tables.cbt_exams)
    .select("id, status, slug")
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

  const { data: sections, error: sectionsError } =
    await context.supabase
      .from(tables.cbt_exam_sections)
      .select("position")
      .eq("organization_id", context.organizationId)
      .eq("exam_id", examId)
      .order("position", { ascending: false })
      .limit(1)

  if (sectionsError) {
    console.error("[CBT:SECTION_POSITION]", sectionsError)
    return { success: false, error: "Unable to create section." }
  }

  const position = (sections?.[0]?.position ?? 0) + 1

  const { data, error } = await context.supabase
    .from(tables.cbt_exam_sections)
    .insert({
      organization_id: context.organizationId,
      exam_id: examId,
      title: name,
      position,
    })
    .select("id, title")
    .single()

  if (error) {
    console.error("[CBT:CREATE_SECTION]", error)
    return { success: false, error: "Unable to create section." }
  }

  revalidatePath(urls.examDetails(exam.slug))

  return {
    success: true,
    data: { id: data.id, name: data.title },
  }
}


import type { ExtractedQuestion } from "./question-formatter"
import { extractDocxText } from "./document-extractor"
import { parseDocumentQuestions } from "./question-formatter"

export type ExtractQuestionsResult = {
  success: boolean
  error?: string
  questions: ExtractedQuestion[]
  warnings: string[]
}

export async function extractQuestionsAction(
  slug: string,
  formData: FormData
): Promise<ExtractQuestionsResult> {
  const fail = (error: string): ExtractQuestionsResult => ({
    success: false,
    error,
    questions: [],
    warnings: [],
  })

  const context = await getStaffContext()

  if (!context) return fail("Your session has expired.")

  const file = formData.get("file")

  if (
    !(file instanceof File) ||
    !file.name.toLowerCase().endsWith(".docx")
  ) {
    return fail("Please upload a Word document (.docx).")
  }

  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return fail("Document must be between 1 byte and 5 MB.")
  }

  const { data: exam, error: examError } = await context.supabase
    .from(tables.cbt_exams)
    .select("id, status")
    .eq("organization_id", context.organizationId)
    .eq("slug", slug)
    .maybeSingle()

  if (examError || !exam  ) {
    console.error("[CBT:UPLOAD_EXAM]", examError)
    return fail("This examination is not available for editing.")
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const extracted = await extractDocxText(buffer)
    const questions = parseDocumentQuestions(extracted.text)

    if (!questions.length) {
      return fail(
        "No questions were identified. Check the document formatting and try again."
      )
    }

    console.info("[CBT:EXTRACT_QUESTIONS]", {
      examId: exam.id,
      filename: file.name,
      extracted: questions.length,
      needsReview: questions.filter(
        (question) => question.warnings.length > 0
      ).length,
    })

    return {
      success: true,
      questions,
      warnings: extracted.warnings,
    }
  } catch (error) {
    console.error("[CBT:EXTRACT_QUESTIONS]", error)

    return fail(
      "Unable to read this document. Check that it is a valid .docx file."
    )
  }
}

import type { ImportQuestionInput } from "@/types/question-import"
import { getImportIssues } from "./import-validation"

export type SaveImportedQuestionsResult = {
  savedIds: string[]
  error?: string
}

export async function saveImportedQuestionsAction(
  examId: string,
  slug: string,
  questions: ImportQuestionInput[]
): Promise<SaveImportedQuestionsResult> {
  const context = await getStaffContext()

  if (!context) {
    return {
      savedIds: [],
      error: "Your session has expired.",
    }
  }

  if (!questions.length) {
    return {
      savedIds: [],
      error: "No questions selected for saving.",
    }
  }

  if (questions.length > 100) {
    return {
      savedIds: [],
      error: "Save a maximum of 100 questions at a time.",
    }
  }

  // Validate the entire batch before the first database write.
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index]

    if (getImportIssues(question).length) {
      return {
        savedIds: [],
        error: `Question ${index + 1} is incomplete.`,
      }
    }
  }

  if (new Set(questions.map((q) => q.id)).size !== questions.length) {
    return {
      savedIds: [],
      error: "Duplicate import entries detected.",
    }
  }

  const savedIds: string[] = []

  for (const question of questions) {
    const { error } = await context.supabase.rpc(
      "cbt_save_exam_question",
      {
        p_exam_id: examId,
        p_section_id: question.sectionId,
        p_topic_id: question.topicId || null,
        p_prompt: question.prompt.trim(),
        p_options: question.options.map((option) => ({
          key: option.key,
          body: option.body.trim(),
        })),
        p_correct_key: question.correctOption,
        p_explanation: question.explanation.trim() || null,
        p_points: question.points,
        p_difficulty: question.difficulty,
      }
    )

    if (error) {
      console.error("[CBT:SAVE_IMPORTED_QUESTION]", {
        examId,
        importQuestionId: question.id,
        error,
      })

      if (savedIds.length) {
        revalidatePath(urls.examDetails(slug))
      }

      return {
        savedIds,
        error: `Import stopped after saving ${savedIds.length} question(s): ${error.message}`,
      }
    }

    savedIds.push(question.id)
  }

  revalidatePath(urls.examDetails(slug))

  return { savedIds }
}


import type { QuestionFormValue } from "../components/QuestionFormFields"

export async function getExamQuestionAnswerAction(
  ruleId: string,
  versionId: string
): Promise<{ answer: string | null; error?: string }> {
  const context = await getStaffContext()

  if (!context) {
    return { answer: null, error: "Session expired." }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_get_exam_question_answer",
    {
      p_rule_id: ruleId,
      p_version_id: versionId,
    }
  )

  if (error) {
    console.error("[CBT:GET_QUESTION_ANSWER]", error)
    return { answer: null, error: "Unable to load answer." }
  }

  return { answer: data ?? null }
}


export async function updateExamQuestionAction(
  ruleId: string,
  versionId: string,
  slug: string,
  value: QuestionFormValue
): Promise<{ success: boolean; error?: string }> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Session expired." }
  }

  const issues = getImportIssues(value)

  if (issues.length) {
    return { success: false, error: issues[0] }
  }

  const { error } = await context.supabase.rpc(
    "cbt_update_exam_question",
    {
      p_rule_id: ruleId,
      p_version_id: versionId,
      p_section_id: value.sectionId,
      p_topic_id: value.topicId || null,
      p_prompt: value.prompt.trim(),
      p_options: value.options.map((option) => ({
        key: option.key,
        body: option.body.trim(),
      })),
      p_correct_key: value.correctOption,
      p_explanation: value.explanation.trim() || null,
      p_points: value.points,
      p_difficulty: value.difficulty,
    }
  )

  if (error) {
    console.error("[CBT:UPDATE_EXAM_QUESTION]", {
      ruleId,
      error,
    })

    return {
      success: false,
      error: error.message ?? "Unable to update question.",
    }
  }

  revalidatePath(urls.examDetails(slug))

  return { success: true }
}


import type { CbtExamQuestionRuleDetails } from "@/types/exams"

type QuestionActionResult = {
  success: boolean
  error?: string
}

type DuplicateQuestionInput = {
  examId: string
  slug: string
  sectionId: string
  rule: CbtExamQuestionRuleDetails
}

export async function duplicateExamQuestionAction({
  examId,
  slug,
  sectionId,
  rule,
}: DuplicateQuestionInput): Promise<QuestionActionResult> {
  const context = await getStaffContext()

  if (!context) {
    return { success: false, error: "Your session has expired." }
  }

  const version = rule.version

  if (rule.kind !== "fixed" || !version || version.type !== "single_choice") {
    return {
      success: false,
      error: "Only fixed single-choice questions can be duplicated.",
    }
  }

  // Correct answers are private, so obtain the source answer
  // through our existing authorized RPC.
  const { data: correctKey, error: answerError } =
    await context.supabase.rpc(
      "cbt_get_exam_question_answer",
      {
        p_rule_id: rule.id,
        p_version_id: version.id,
      }
    )

  if (answerError || !correctKey) {
    console.error("[CBT:DUPLICATE_ANSWER]", answerError)

    return {
      success: false,
      error: "Unable to retrieve the source question's answer.",
    }
  }

  const options = [...version.cbt_question_options]
    .sort((a, b) => a.display_order - b.display_order)
    .map((option) => ({
      key: option.option_key,
      body: option.body,
    }))

  if (
    options.length !== 4 ||
    !["a", "b", "c", "d"].every((key) =>
      options.some((option) => option.key === key && option.body.trim())
    )
  ) {
    return {
      success: false,
      error: "The source question has unsupported answer options.",
    }
  }

  // This RPC creates a new logical question, version, private
  // answer key and fixed exam rule in one transaction.
  const { error } = await context.supabase.rpc(
    "cbt_save_exam_question",
    {
      p_exam_id: examId,
      p_section_id: sectionId,
      p_topic_id: version.cbt_questions?.topic_id ?? null,
      p_prompt: version.prompt,
      p_options: options,
      p_correct_key: correctKey,
      p_explanation: version.explanation ?? null,
      p_points: rule.points_override ?? version.default_points,
      p_difficulty: version.difficulty,
    }
  )

  if (error) {
    console.error("[CBT:DUPLICATE_QUESTION]", error)

    return {
      success: false,
      error: error.message || "Unable to duplicate question.",
    }
  }

  revalidatePath(urls.examDetails(slug))

  return { success: true }
}

export async function removeExamQuestionAction(
  examId: string,
  ruleId: string,
  slug: string
): Promise<QuestionActionResult> {
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Your session has expired." }

  const { data: exam, error: examError } = await context.supabase
    .from(tables.cbt_exams)
    .select("slug, status")
    .eq("organization_id", context.organizationId)
    .eq("id", examId)
    .maybeSingle()

  if (examError || !exam || exam.slug !== slug) {
    return { success: false, error: "Examination not found." }
  }
  if (exam.status !== "draft" && exam.status !== "active") {
    return { success: false, error: "This examination cannot be edited." }
  }

  const { data, error } = await context.supabase
    .from(tables.cbt_exam_question_rules)
    .delete()
    .eq("organization_id", context.organizationId)
    .eq("exam_id", examId)
    .eq("id", ruleId)
    .eq("kind", "fixed")
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[CBT:REMOVE_EXAM_QUESTION]", error)
    return { success: false, error: "Unable to remove question." }
  }
  if (!data) return { success: false, error: "Question not found or removal not permitted." }

  revalidatePath(urls.examDetails(slug))
  return { success: true }
}



import type {
  ExamSettingsInput,
  SaveExamSettingsResult,
} from "@/types/exam-settings"

export async function saveExamSettingsAction(
  examId: string,
  slug: string,
  input: ExamSettingsInput
): Promise<SaveExamSettingsResult> {
  const fail = (error: string): SaveExamSettingsResult => ({
    success: false,
    error,
  })

  const context = await getStaffContext()
  if (!context) return fail("Your session has expired.")

  const title = input.title.trim()
  const durationSeconds = input.durationMinutes * 60

  if (title.length < 2 || title.length > 200) {
    return fail("Examination title must contain 2–200 characters.")
  }

  if (!Number.isInteger(durationSeconds) || durationSeconds < 60 || durationSeconds > 86400) {
    return fail("Duration must be between 1 minute and 24 hours.")
  }

  if (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 1 || input.maxAttempts > 100) {
    return fail("Maximum attempts must be between 1 and 100.")
  }

  if (
    typeof input.shuffleQuestions !== "boolean" ||
    typeof input.shuffleOptions !== "boolean" ||
    typeof input.showResultAfterSubmission !== "boolean" ||
    typeof input.allowExamReview !== "boolean" ||
    !["after_close", "after_submission"].includes(input.reviewRelease)
  ) {
    return fail("Invalid examination or result preferences.")
  }

  const parseDate = (value: string | null) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const availableFrom = parseDate(input.availableFrom)
  const availableUntil = parseDate(input.availableUntil)

  if (
    (input.availableFrom && !availableFrom) ||
    (input.availableUntil && !availableUntil)
  ) {
    return fail("Enter valid availability dates.")
  }

  if (
    availableFrom &&
    availableUntil &&
    new Date(availableUntil) <= new Date(availableFrom)
  ) {
    return fail("The end date must be later than the start date.")
  }

  const { data, error } = await context.supabase
    .from(tables.cbt_exams)
    .update({
      title,
      description: input.description.trim() || null,
      instructions: input.instructions.trim() || null,
      duration_seconds: durationSeconds,
      available_from: availableFrom,
      available_until: availableUntil,
      max_attempts: input.maxAttempts,
      shuffle_questions: input.shuffleQuestions,
      shuffle_options: input.shuffleOptions,
    })
    .eq("id", examId)
    .eq("slug", slug)
    .eq("organization_id", context.organizationId)
    .in("status", ["draft", "active"])
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[CBT:SAVE_EXAM_SETTINGS]", error)
    return fail("Unable to save examination settings.")
  }

  if (!data) {
    return fail("Examination not found, archived, or you do not have permission to edit it.")
  }

  // The V1 result-policy RPC persists blueprint preferences.
  // An active exam remains on its original sealed revision until a new revision is published.
  // The seal trigger copies it into the immutable publication policy.
  const { error: resultError } = await context.supabase.rpc(
    "cbt_set_exam_result_settings",
    {
      p_exam_id: examId,
      p_show_result: input.showResultAfterSubmission,
      p_allow_review: input.allowExamReview,
      p_review_release: input.reviewRelease,
    }
  )

  // These are two database operations, not an atomic transaction.
  // Make partial success explicit so the examiner does not publish
  // assuming that both settings groups were saved.
  if (resultError) {
    console.error("[CBT:SAVE_EXAM_RESULT_SETTINGS]", resultError)
    revalidatePath(urls.examDetails(slug))
    revalidatePath(`/exams/${slug}/settings`)
    return fail(
      "General examination settings were saved, but Results & Review preferences were not. Please retry before publishing."
    )
  }

  revalidatePath(urls.examDetails(slug))
  revalidatePath(`/exams/${slug}/settings`)

  return { success: true }
}


export type PublishExamResult = {
  success: boolean
  error?: string
  publicationId?: string
  revision?: number
  questionCount?: number
}



export async function publishExamAction(
  examId: string,
  slug: string,
  accessMode: "access_code" | "open_link" | "registered"
): Promise<PublishExamResult> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      error: "Your session has expired.",
    }
  }

  if (
    !["access_code", "open_link", "registered"].includes(
      accessMode
    )
  ) {
    return {
      success: false,
      error: "Select a valid examination access method.",
    }
  }

  const { data: exam, error: examError } =
    await context.supabase
      .from(tables.cbt_exams)
      .select("id, status")
      .eq("id", examId)
      .eq("slug", slug)
      .eq("organization_id", context.organizationId)
      .maybeSingle()

  if (examError || !exam) {
    return {
      success: false,
      error: "Examination not found.",
    }
  }

  if (!["draft", "active"].includes(exam.status)) {
    return {
      success: false,
      error:
        "Only draft or active examinations can be published.",
    }
  }

  const { data, error } = await context.supabase.rpc(
    "cbt_publish_exam_with_access_mode",
    {
      p_exam_id: examId,
      p_access_mode: accessMode,
    }
  )

  if (error) {
    console.error("[CBT:PUBLISH_EXAM]", {
      examId,
      accessMode,
      error,
    })

    return {
      success: false,
      error:
        error.message ||
        "Unable to publish examination.",
    }
  }

  const publication = data?.[0]

  if (!publication) {
    return {
      success: false,
      error:
        "The publication result could not be confirmed.",
    }
  }

  revalidatePath(urls.examDetails(slug))
  revalidatePath(urls.examSettings(slug))
  revalidatePath(urls.examCandidates(slug))
  revalidatePath(urls.exams)

  return {
    success: true,
    publicationId: publication.publication_id,
    revision: publication.revision,
    questionCount: publication.question_count,
  }
}


 
