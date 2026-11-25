
export const schoolDomain = "methodistcollegeuzoakoli.com"

export const tables = {
  // ==========================================
  // SHARED PLATFORM
  // ==========================================
  profiles: "profiles",
  organizations: "organizations",
  organization_memberships: "organization_memberships",
  roles: "roles",
  permissions: "permissions",
  role_permissions: "role_permissions",
  membership_roles: "membership_roles",
  activity_logs: "activity_logs",

  // ==========================================
  // SCHOOL MANAGEMENT
  // ==========================================
  school_details: "school_details",

  // Academic structure
  school_academic_sessions: "school_academic_sessions",
  school_terms: "school_terms",
  school_class_levels: "school_class_levels",
  school_streams: "school_streams",
  school_arms: "school_arms",
  school_classes: "school_classes",

  // People and enrollment
  school_students: "school_students",
  school_staff: "school_staff",
  school_enrollments: "school_enrollments",
  school_student_details: "school_student_details",
  school_guardians: "school_guardians",
  school_student_guardians: "school_student_guardians",

  // Subjects and teaching
  school_subjects: "school_subjects",
  school_subject_offerings: "school_subject_offerings",
  school_teaching_assignments: "school_teaching_assignments",

  // Assessments and reports
  school_assessment_components: "school_assessment_components",
  school_assessment_scores: "school_assessment_scores",
  school_report_cards: "school_report_cards",
  school_report_card_subjects: "school_report_card_subjects",

  // CBT integration
  school_cbt_exam_links: "school_cbt_exam_links",
  school_cbt_score_imports: "school_cbt_score_imports",

  // ==========================================
  // STANDALONE CBT
  // ==========================================

  // Question bank
  cbt_question_banks: "cbt_question_banks",
  cbt_categories: "cbt_categories",
  cbt_topics: "cbt_topics",
  cbt_questions: "cbt_questions",
  cbt_question_versions: "cbt_question_versions",
  cbt_question_options: "cbt_question_options",
  cbt_question_media: "cbt_question_media",
  cbt_candidates: "cbt_candidates",
  cbt_exam_assignments: "cbt_exam_assignments",

  // Exams and publication
  cbt_exams: "cbt_exams",
  cbt_exam_sections: "cbt_exam_sections",
  cbt_exam_selection_rules: "cbt_exam_selection_rules",
  cbt_exam_publications: "cbt_exam_publications",
  cbt_candidate_assignments: "cbt_candidate_assignments",
  cbt_exam_question_rules: "cbt_exam_question_rules",
  cbt_exam_access_policies: "cbt_exam_access_policies",

  // Attempts and responses
  cbt_exam_attempts: "cbt_exam_attempts",
  cbt_attempt_questions: "cbt_attempt_questions",
  cbt_attempt_options: "cbt_attempt_options",
  cbt_attempt_answers: "cbt_attempt_answers",
  cbt_attempt_selections: "cbt_attempt_selections",
  cbt_attempt_events: "cbt_attempt_events",

  // Grading and results
  cbt_grading_runs: "cbt_grading_runs",
  cbt_question_grades: "cbt_question_grades",
  cbt_results: "cbt_results",
  cbt_result_publications: "cbt_result_publications",
} as const

export type TableName = keyof typeof tables



import type { AppAppearance } from "@/types/organization"

export const SCHOOL_SLUG = process.env.APP_ORGANIZATION_SLUG ??
  "excellence-schools-international"
export const ORGANIZATION_ID = process.env.APP_ORGANIZATION_ID  ?? "6cca9055-8885-418d-8907-fbfbd3553a4b"

// Default organization for this CBT deployment
export const CBT_ORGANIZATION_SLUG = process.env.APP_ORGANIZATION_SLUG ?? "excellence-schools-international";
export const CBT_ORGANIZATION_ID = process.env.APP_ORGANIZATION_ID ?? "6cca9055-8885-418d-8907-fbfbd3553a4b";

export const DEFAULT_APPEARANCE: AppAppearance = {
  primary: "#1D4ED8",
  accent: "#F59E0B",
  mode: "light",
}

export const urls = {
  // Public
  home: "/",
  login: "/login",
  register: "/register",
  setup: "/setup",
  help: "/help",
  candidateInstructions: "/help/candidates",
  examinerInstructions: "/help/examiners",

  // Public examination access
  examEntry: "/exam",
  examLink: (code: string) =>
    `/exam/${encodeURIComponent(code)}`,

  // Staff workspace (owner, admin, examiner)
  dashboard: "/dashboard",

  // Question bank
  questions: "/questions",
  questionNew: "/questions/new",
  questionDetails: (id: string) =>
    `/questions/${encodeURIComponent(id)}`,

  // Examinations
  exams: "/exams",
  examNew: "/exams/new",

  examDetails: (id: string) => `/exams/${encodeURIComponent(id)}`,
  examQuestions: (id: string) => `/exams/${encodeURIComponent(id)}`,
  uploadExamQuestions: (slug:string) => `/exams/${encodeURIComponent(slug)}/questions/upload`,

  examAddQuestion: (slug: string) =>
  `/exams/${encodeURIComponent(slug)}/questions`,

  examSettings: (slug: string) =>
    `/exams/${encodeURIComponent(slug)}/settings`,

  examPublish: (slug: string) =>
    `/exams/${encodeURIComponent(slug)}/publish-exam`,

  examCandidates: (slug: string) =>
    `/exams/${encodeURIComponent(slug)}/candidates`,
  examCandidtatesImport: (examSlug:string)=>`/candidates/import?exam=${encodeURIComponent(examSlug)}`,
  examCandidtatesSelectFromDirectory: (examSlug:string)=>`/candidates?exam=${encodeURIComponent(examSlug)}`,

  examAssessmentIntegration: (slug: string) => `/exams/${encodeURIComponent(slug)}/assessment-integration`,
  examManualGrading: (slug: string) => `/exams/${encodeURIComponent(slug)}/grading`,
  
  examMonitor: (slug: string) => `/exams/${encodeURIComponent(slug)}/monitor`,

  examResults: (slug: string) => `/exams/${encodeURIComponent(slug)}/results`,
  examCandidateResultDetails: (slug: string, candidateId:string, attempt_id:string) => `/exams/${encodeURIComponent(slug)}/results/${encodeURIComponent(candidateId)}?attempt=${encodeURIComponent(attempt_id)}`,
  examCandidateResultReview: (slug: string, candidateId:string, attempt_id:string) => `/exams/${encodeURIComponent(slug)}/results/${candidateId}/review?attempt=${encodeURIComponent(attempt_id)}`,
  
  examResultsImport: (slug: string) => `/exams/${encodeURIComponent(slug)}/sync-results`,
  

  // Candidate management
  candidates: "/candidates",
  candidatesImport: "/candidates/import",
  candidateDetails: (id: string) => `/candidates/${encodeURIComponent(id)}`,

  // Results and reporting
  results: "/results",

  // school setup and management
  schoolInformation: "/school",
  sessionSetup: "/school/session-setup",
  // academicPeriods: "/school/academics-periods",
  // schoolCalendar: "/calendar",

  // Students and enrollment
  students: "/school/students",
  studentsDirectoryByEnrollment: "/school/students",
  studentDetails: (id: string) => `/school/students/${id}`,
  
  enrollments: "/school/enrollment", // enroll students
  studentRegistration: "/school/students/register",
  studentRegistrationEdit: (id: string) => `/school/students/register?edit=${id}`,
  studentsDirectoryByAdmission: "/school/students/directory",

  
  // admissions: "/school/admissions",
  // Staff
  // staff: "/admin/staff",
  // staffDetails: (id: string) => `/admin/staff/${id}`,

  // Classes
  // classes: "/school/classes",
  // classDetails: (id: string) => `/school/classes/${id}`,
  // sessionClasses: (session: string) =>
  //   `/school/classes?session=${encodeURIComponent(session)}`,

  // Registered candidate portal
  myExams: "/my-exams",
  myResults: "/my-results",

  // Examination-taking (access-code, open-link, registered)
  takeExam: (examCode: string) => `/take/${encodeURIComponent(examCode)}`,

  submitExam: (attemptId: string) => `/take/${encodeURIComponent(attemptId)}/submit`,

  // School-only CBT conveniences
  school: "/school",
  schoolAcademicSetup: "/school/setup",
  // school: "/school",

  // Organization administration
  studentAccounts:" /school/student-accounts",
  settings: "/settings",

  // CBT API routes
  api: {
    candidateImport: "/api/cbt/candidates/import",
    accessLogin: "/api/cbt/access/login",
    accessSession: "/api/cbt/access/session",

    attempt: (id: string) =>
      `/api/cbt/attempts/${encodeURIComponent(id)}`,

    attemptAnswers: (id: string) =>
      `/api/cbt/attempts/${encodeURIComponent(id)}/answers`,

    attemptSubmit: (id: string) =>
      `/api/cbt/attempts/${encodeURIComponent(id)}/submit`,
  },
} as const;

export const OPTION_KEYS = ["a", "b", "c", "d"] as const
export const RECENT_REGISTRATION_KEY = "school:recent-student-registration"
export const RECENT_REGISTRATION_MAX_AGE = 2 * 60 * 60 * 1000