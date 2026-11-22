import type { ExamSettings } from "@/types/exam-settings"
import type { ExamPublicationOverview } from "./queries"

export type ReadinessIssue = {
  id: string
  severity: "blocker" | "warning"
  title: string
  description: string
  action?: { label: string; href: string }
}

export function checkExamPublicationReadiness(
  exam: ExamSettings,
  overview: ExamPublicationOverview,
  now: number
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = []
  const settings = `/exams/${encodeURIComponent(exam.slug)}/settings`
  const questions = `/exams/${encodeURIComponent(exam.slug)}`
  const add = (issue: ReadinessIssue) => issues.push(issue)

  if (!(["draft", "active"] as string[]).includes(exam.status)) {
    add({
      id: "status",
      severity: "blocker",
      title: "This examination cannot be published in its current state",
      description: `Current database status: ${exam.status}. Only draft and active examinations support publication.`,
    })
  }

  if (!Number.isFinite(exam.duration_seconds) || Number(exam?.duration_seconds) < 60 || Number(exam.duration_seconds) > 86400) {
    add({
      id: "duration",
      severity: "blocker",
      title: "Examination duration needs attention",
      description: "Set a duration between 1 minute and 24 hours.",
      action: { label: "Edit duration", href: settings },
    })
  }

  if (!Number.isInteger(exam.max_attempts) || Number(exam.max_attempts) < 1 || Number(exam.max_attempts) > 100) {
    add({
      id: "attempts",
      severity: "blocker",
      title: "Maximum attempts are invalid",
      description: "Allow between 1 and 100 attempts per candidate.",
      action: { label: "Edit attempts", href: settings },
    })
  }

  if (!exam.available_from || !exam.available_until) {
    add({
      id: "schedule-missing",
      severity: "blocker",
      title: "Examination schedule is incomplete",
      description: "Specify both the opening date/time and closing date/time.",
      action: { label: "Set schedule", href: settings },
    })
  } else {
    const from = Date.parse(exam.available_from)
    const until = Date.parse(exam.available_until)
    if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) {
      add({
        id: "schedule-invalid",
        severity: "blocker",
        title: "Examination dates are invalid",
        description: "The closing time must be later than the opening time.",
        action: { label: "Fix schedule", href: settings },
      })
    } else if (until <= now) {
      add({
        id: "schedule-expired",
        severity: "blocker",
        title: "The examination has already closed",
        description: "Extend the closing time into the future before publishing.",
        action: { label: "Change closing time", href: settings },
      })
    } else {
      if (from < now) {
        add({
          id: "schedule-open",
          severity: "warning",
          title: "The examination opening time has already passed",
          description: "Candidates may be able to start immediately when you publish, subject to the access policy.",
          action: { label: "Review schedule", href: settings },
        })
      }
      if (until - now < 60 * 60 * 1000) {
        add({
          id: "schedule-soon",
          severity: "warning",
          title: "The examination closes within an hour",
          description: "Check that candidates will have sufficient time to start and complete their attempts.",
          action: { label: "Review closing time", href: settings },
        })
      }
    }
  }

  if (!overview.sections.length) {
    add({
      id: "sections",
      severity: "blocker",
      title: "No examination sections",
      description: "Create at least one section and add questions to it.",
      action: { label: "Manage questions", href: questions },
    })
  }

  for (const section of overview.sections) {
    if (section.questionCount <= 0) {
      add({
        id: `section-${section.id}`,
        severity: "blocker",
        title: `Section has no questions: ${section.title}`,
        description: "Add at least one question or remove the empty section.",
        action: { label: "Fix section", href: questions },
      })
    }
  }

  if (!overview.questionCount) {
    add({
      id: "questions",
      severity: "blocker",
      title: "No examination questions",
      description: "Add questions before creating a publication.",
      action: { label: "Add questions", href: questions },
    })
  }

  return issues
}
