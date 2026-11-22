
export type ExamStatus = "draft" | "active" | "archived"
export type BankStatus = "active" | "archived"
export type QuestionStatus = "active" | "archived"
export type QuestionVersionStatus = "draft" | "published"

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "free_text"

export type QuestionDifficulty = "easy" | "medium" | "hard"

// Question bank / collection
export interface CbtQuestionBank {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  status: BankStatus
  created_by: string
  created_at: string
  updated_at: string
}

// Subject / category within a bank
export interface CbtCategory {
  id: string
  organization_id: string
  bank_id: string
  name: string
  slug: string
  created_by: string
  created_at: string
  updated_at: string
}

// Optional topic within a subject
export interface CbtTopic {
  id: string
  organization_id: string
  bank_id: string
  category_id: string
  name: string
  slug: string
  created_by: string
  created_at: string
  updated_at: string
}

// Examination
export interface CbtExam {
  id: string
  organization_id: string
  title: string
  slug: string
  description: string | null
  status: ExamStatus

  default_bank_id: string | null
  default_category_id: string | null

  created_by: string
  created_at: string
  updated_at: string
}

// Sections within an examination
export interface CbtExamSection {
  id: string
  organization_id: string
  exam_id: string
  title: string
  position: number
  instructions: string | null
  created_at: string
  updated_at: string
}

// Reusable question identity
export interface CbtQuestion {
  id: string
  organization_id: string
  bank_id: string
  category_id: string
  topic_id: string | null
  status: QuestionStatus
  created_by: string
  created_at: string
  updated_at: string
}

// Question content
export interface CbtQuestionVersion {
  id: string
  organization_id: string
  question_id: string
  version_number: number
  type: QuestionType
  prompt: string
  explanation: string | null
  difficulty: QuestionDifficulty
  default_points: number
  status: QuestionVersionStatus
  created_by: string
  created_at: string
  published_at: string | null
}

// Multiple-choice options
export interface CbtQuestionOption {
  id: string
  organization_id: string
  version_id: string
  option_key: string
  body: string
  display_order: number
  created_at: string
}

// Question selection within an examination
export interface CbtExamQuestionRule {
  id: string
  organization_id: string
  exam_id: string
  section_id: string
  bank_id: string
  category_id: string
  kind: "fixed" | "random"
  question_version_id: string | null
  difficulty: QuestionDifficulty | null
  question_type: QuestionType | null
  count_required: number
  points_override: number | null
  position: number
  created_at: string
  updated_at: string
}
 

export interface CbtQuestionDetails extends CbtQuestion {
  cbt_question_versions?: (
    CbtQuestionVersion & {
      cbt_question_options?: CbtQuestionOption[]
    }
  )[]
}

// Lightweight select options for your shared components
export interface CbtSelectOption {
  label: string
  value: string
}

// ==========
// export interface CbtExamDetails extends CbtExam {
//   bank: Pick<CbtQuestionBank, "id" | "name"> | null
//   category: Pick<CbtCategory, "id" | "name"> | null
//   cbt_exam_sections: Pick<CbtExamSection, "id">[]
//   questionCount: number
//   sectionCount: number
// }

export interface CbtExamDetails extends CbtExam {
  bank: Pick<CbtQuestionBank, "id" | "name"> | null
  category: Pick<CbtCategory, "id" | "name"> | null

  cbt_exam_sections: {
    id: string
    cbt_exam_question_rules: Pick<
      CbtExamQuestionRule,
      "kind" | "count_required"
    >[]
  }[]

  questionCount: number
  sectionCount: number
}

export   type ExamData = {
    id: string
    organization_id: string
    title: string
    slug: string
    description: string | null
    status: ExamStatus
    created_by: string
    created_at: string
    updated_at: string
    default_bank_id: string | null
    default_category_id: string | null
    bank: {
      id: string
      name: string
    } | null
    category: {
      id: string
      name: string
    } | null
    cbt_exam_sections: {
      id: string
      cbt_exam_question_rules: {
        kind: "fixed" | "random"
        count_required: number
      }[]
    }[]
    questionCount: number
    sectionCount: number
  }

export interface CbtExamQuestionVersion
  extends Pick<
    CbtQuestionVersion,
    | "id"
    | "question_id"
    | "type"
    | "prompt"
    | "explanation"
    | "difficulty"
    | "default_points"
    | "status"
  > {
  cbt_question_options: CbtQuestionOption[]
  cbt_questions: (
    Pick<CbtQuestion, "id" | "topic_id"> & {
      cbt_topics: Pick<CbtTopic, "id" | "name"> | null
    }
  ) | null
}

export interface CbtExamQuestionRuleDetails
  extends Pick<
    CbtExamQuestionRule,
    | "id"
    | "kind"
    | "position"
    | "count_required"
    | "points_override"
    | "bank_id"
    | "category_id"
    | "question_version_id"
    | "difficulty"
    | "question_type"
  > {
  version: CbtExamQuestionVersion | null
}

export interface CbtExamSectionDetails
  extends Pick<
    CbtExamSection,
    "id" | "title" | "position" | "instructions"
  > {
  cbt_exam_question_rules: CbtExamQuestionRuleDetails[],
  section_template_id: string

}

export interface GetExamQuestionsResult {
  exam: CbtExamDetails
  sections: CbtExamSectionDetails[]
  topics: {
    id: string
    name: string
  }[]
  questionCount: number
}