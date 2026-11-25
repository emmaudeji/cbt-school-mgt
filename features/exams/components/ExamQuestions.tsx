
"use client"

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileUp,
  FolderOpen,
  GraduationCap,
  GripVertical,
  Layers3,
  Loader2,
  PenLine,
  RotateCcw,
  Save,
  Settings2,
  Users,
} from "lucide-react"

import { toast } from "react-toastify"

import { urls } from "@/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type {
  getExamQuestions,
  SchoolExamSummary,
} from "../services/queries"

import { ExamSectionCard } from "./ExamSectionCard"
import { ExamSectionControls } from "./ExamSectionControls"

import {
  reorderExamQuestionsAction,
} from "../services/action.reorderExamQuestionsAction"

type ExamData =
  Awaited<ReturnType<typeof getExamQuestions>>

type Section = ExamData["sections"][number]

type Props = ExamData & {
  correctAnswers: Record<string, string[]>
  sectionTemplates: {
    id: string
    title: string
  }[]
  schoolSummary?: SchoolExamSummary | null
}

type Move = {
  ruleId: string
  sectionId: string
  targetRuleId: string | null
  after: boolean
}

function layoutKey(sections: Section[]) {
  return sections
    .map(
      (section) =>
        `${section.id}:${section.cbt_exam_question_rules
          .map((rule) => rule.id)
          .join(",")}`
    )
    .join("|")
}

function getLayout(sections: Section[]) {
  return sections.flatMap((section) =>
    section.cbt_exam_question_rules.map((rule) => ({
      id: rule.id,
      section_id: section.id,
    }))
  )
}

function applyMove(
  sections: Section[],
  move: Move
): Section[] {
  if (move.ruleId === move.targetRuleId) {
    return sections
  }

  const next = sections.map((section) => ({
    ...section,
    cbt_exam_question_rules: [
      ...section.cbt_exam_question_rules,
    ],
  }))

  const source = next.find((section) =>
    section.cbt_exam_question_rules.some(
      (rule) => rule.id === move.ruleId
    )
  )

  const destination = next.find(
    (section) => section.id === move.sectionId
  )

  if (!source || !destination) {
    return sections
  }

  if (
    move.targetRuleId &&
    !destination.cbt_exam_question_rules.some(
      (rule) => rule.id === move.targetRuleId
    )
  ) {
    return sections
  }

  const sourceIndex =
    source.cbt_exam_question_rules.findIndex(
      (rule) => rule.id === move.ruleId
    )

  if (sourceIndex < 0) {
    return sections
  }

  const [rule] =
    source.cbt_exam_question_rules.splice(
      sourceIndex,
      1
    )

  if (!rule) {
    return sections
  }

  const targetIndex = move.targetRuleId
    ? destination.cbt_exam_question_rules.findIndex(
        (item) => item.id === move.targetRuleId
      )
    : destination.cbt_exam_question_rules.length

  if (targetIndex < 0) {
    return sections
  }

  destination.cbt_exam_question_rules.splice(
    targetIndex +
      (move.targetRuleId && move.after ? 1 : 0),
    0,
    rule
  )

  return layoutKey(next) === layoutKey(sections)
    ? sections
    : next
}

function MiniStat({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode
  label: string
  value: number
  className: string
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        {/* {icon} */}
        <span className="truncate">
          {label}
        </span>
      </div>

      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function ExamQuestions({
  exam,
  sections,
  correctAnswers,
  sectionTemplates,
  schoolSummary = null,
}: Props) {
  const router = useRouter()

  const [board, setBoard] =
    useState<Section[]>(sections)

  const [savedLayout, setSavedLayout] =
    useState<Section[]>(sections)

  const [
    draggingRuleId,
    setDraggingRuleId,
  ] = useState<string | null>(null)

  const [saving, startSaving] =
    useTransition()

  const editable =
    exam.status === "draft" ||
    exam.status === "active"

  const hasPendingChanges =
    layoutKey(board) !== layoutKey(savedLayout)

  useEffect(() => {
    setBoard((current) =>
      layoutKey(current) === layoutKey(savedLayout)
        ? sections
        : current
    )

    setSavedLayout(sections)

    // Use the previous saved layout as the
    // comparison baseline for refreshed data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  const totalQuestions = board.reduce(
    (total, section) =>
      total +
      section.cbt_exam_question_rules.reduce(
        (count, rule) =>
          count + rule.count_required,
        0
      ),
    0
  )

  const fixedCount = board.reduce(
    (total, section) =>
      total +
      section.cbt_exam_question_rules.filter(
        (rule) => rule.kind === "fixed"
      ).length,
    0
  )

  const randomCount =
    totalQuestions - fixedCount

  const addQuestionUrl =
    urls.examAddQuestion(exam.slug)

  const uploadUrl =
    `${urls.uploadExamQuestions(exam.slug)}` +
    `?exam=${encodeURIComponent(exam.slug)}`

  const settingsUrl =
    urls.examSettings(exam.slug)

  const isSchoolExam =
    schoolSummary !== null

  const statusLabel =
    exam.status === "draft"
      ? "Draft"
      : exam.status === "active"
        ? "Published"
        : exam.status

  function proposeMove(
    sectionId: string,
    targetRuleId: string | null,
    after = false
  ) {
    if (
      !editable ||
      saving ||
      !draggingRuleId
    ) {
      return
    }

    const next = applyMove(board, {
      ruleId: draggingRuleId,
      sectionId,
      targetRuleId,
      after,
    })

    setDraggingRuleId(null)

    if (next !== board) {
      setBoard(next)
    }
  }

  function discardChanges() {
    if (saving) return

    setBoard(savedLayout)
    setDraggingRuleId(null)
  }

  function applyChanges() {
    if (
      !editable ||
      !hasPendingChanges ||
      saving
    ) {
      return
    }

    const nextLayout = board

    startSaving(async () => {
      try {
        const result =
          await reorderExamQuestionsAction(
            exam.id,
            exam.slug,
            getLayout(nextLayout)
          )

        if (!result.success) {
          toast.error(
            result.error ??
              "Unable to save question order."
          )
          return
        }

        setSavedLayout(nextLayout)

        toast.success(
          "Question arrangement saved."
        )

        router.refresh()
      } catch (error) {
        console.error(
          "[CBT:REORDER_QUESTIONS]",
          error
        )

        toast.error(
          "Unable to save question arrangement."
        )
      }
    })
  }

  return (
    <section
      className={`space-y-4 ${
        hasPendingChanges ? "pb-28" : ""
      }`}
    >
      {/* NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={urls.exams}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Examinations
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              isSchoolExam
                ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
            }
          >
            {isSchoolExam
              ? "School Examination"
              : "Independent Test"}
          </Badge>

          <Badge
            className={
              exam.status === "active"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
            }
          >
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* EXAMINATION HEADER */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-primary/5 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white ${
                isSchoolExam
                  ? "bg-blue-600"
                  : "bg-violet-600"
              }`}
            >
              {isSchoolExam ? (
                <GraduationCap className="size-6" />
              ) : (
                <ClipboardList className="size-6" />
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/70">
                Question Management
              </p>

              <h1 className="break-words text-xl font-semibold tracking-tight ">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="max-w-2xl text-sm leading-5 text-foreground/75">
                  {exam.description}
                </p>
              )}
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 bg-background shadow-none"
          >
            <Link href={settingsUrl}>
              <Settings2 className="size-4" />
              Settings
            </Link>
          </Button>
        </div>

        {/* SCHOOL ACADEMIC CONTEXT */}
        {schoolSummary && (
          <div className="border-b border-blue-500/15 bg-blue-500/[0.035] px-4 py-3 sm:px-5">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap className="size-4 text-blue-600" />

              <span className="text-xs font-bold uppercase tracking-wide">
                Academic Coverage
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-background px-2.5 py-1.5 text-xs font-semibold">
                <CalendarDays className="size-3.5 text-blue-600" />
                {schoolSummary.sessionName}
              </span>

              <span className="rounded-md border border-blue-500/20 bg-background px-2.5 py-1.5 text-xs font-semibold">
                {schoolSummary.termName}
              </span>

              <span className="rounded-md border border-blue-500/20 bg-background px-2.5 py-1.5 text-xs font-semibold">
                {schoolSummary.levelName}
              </span>

              <span className="rounded-md border border-blue-500/20 bg-background px-2.5 py-1.5 text-xs font-semibold">
                {schoolSummary.subjectName}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Users className="size-4 text-blue-600" />

              <span className="text-xs font-semibold">
                {schoolSummary.targetScope === "level"
                  ? "Entire Level"
                  : "Selected Arms"}
                :
              </span>

              {schoolSummary.classNames.map(
                (className) => (
                  <Badge
                    key={className}
                    variant="outline"
                    className="border-blue-500/25 bg-blue-500/5 font-medium"
                  >
                    {className}
                  </Badge>
                )
              )}
            </div>

            <p className="mt-2 text-xs text-foreground/75">
              Student assignment:{" "}
              <strong className="text-foreground">
                {schoolSummary.assignmentScope ===
                "class"
                  ? "All eligible students"
                  : "Selected students"}
              </strong>
            </p>
          </div>
        )}

        {/* COMPACT WORKFLOW ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground/75">
            <BookOpen className="size-4 text-emerald-600" />
            <span>
              {exam.bank?.name ?? "Question Bank"}
            </span>

            <span className="text-foreground/40">
              /
            </span>

            <span>
              {exam.category?.name ?? "Category"}
            </span>
          </div>

          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 border-emerald-500/30 bg-emerald-500/5 font-semibold text-foreground shadow-none hover:bg-emerald-500/10"
              >
                <Link href={uploadUrl}>
                  <FileUp className="size-4 text-emerald-600" />
                  Upload Questions
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-9 shadow-none"
              >
                <Link href={addQuestionUrl}>
                  <PenLine className="size-4" />
                  Add Question
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="grid min-w-0 items-start gap-4 md:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* SIDEBAR */}
        <aside className="min-w-0 self-start space-y-3 md:sticky md:top-4 md:max-h-[calc(100dvh-2rem)] md:overflow-y-auto md:overscroll-contain">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat
              icon={
                <CircleHelp className="size-3.5" />
              }
              label="Questions"
              value={totalQuestions}
              className="border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300"
            />

            <MiniStat
              icon={
                <Layers3 className="size-3.5" />
              }
              label="Sections"
              value={board.length}
              className="border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300"
            />

            <MiniStat
              icon={
                <BookOpen className="size-3.5" />
              }
              label="Fixed"
              value={fixedCount}
              className="border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            />
          </div>

          {randomCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Random questions
              </span>

              <span className="font-bold text-amber-900 dark:text-amber-200">
                {randomCount}
              </span>
            </div>
          )}

          {/* SECTION CONTROL */}
          {editable && (
            <ExamSectionControls
              examId={exam.id}
              templates={sectionTemplates}
              usedTemplateIds={board.map(
                (section) =>
                  section.section_template_id ?? null
              )}
              disabled={
                saving || hasPendingChanges
              }
            />
          )}

          {/* QUICK ACTIONS */}
          {editable && (
            <div className="rounded-xl border bg-card p-3">
              <div className="mb-3 flex items-center gap-2">
                <FolderOpen className="size-4 text-primary" />

                <h2 className="text-sm font-bold">
                  Quick Actions
                </h2>
              </div>

              <div className="grid gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 justify-start border-primary/25 bg-primary/5 font-semibold shadow-none hover:bg-primary/10"
                >
                  <Link href={addQuestionUrl}>
                    <PenLine className="size-4 text-primary" />
                    Write Question
                    <ArrowRight className="ml-auto size-3.5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 justify-start border-emerald-500/25 bg-emerald-500/5 font-semibold shadow-none hover:bg-emerald-500/10"
                >
                  <Link href={uploadUrl}>
                    <FileUp className="size-4 text-emerald-600" />
                    Upload Questions
                    <ArrowRight className="ml-auto size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <p className="px-1 text-xs leading-5 text-foreground/75">
            Sections organize the question paper.
            You can add, edit and reorder questions
            within them.
          </p>
        </aside>

        {/* QUESTIONS AREA */}
        <article className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3  border-b pb-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Layers3 className="size-4 text-primary" />
                Examination Sections
              </h2>

              <p className="text-xs text-foreground/75">
                Review the sections and questions
                in this examination.
              </p>
            </div>

            <Badge
              variant="secondary"
              className="font-semibold"
            >
              {board.length}{" "}
              {board.length === 1
                ? "section"
                : "sections"}
            </Badge>
          </div>

          {editable && totalQuestions > 0 && (
            <div className="flex items-center gap-2 px-1 text-xs text-foreground/75">
              <GripVertical className="size-3.5 shrink-0 text-primary" />
              Drag questions within or between
              expanded sections.
            </div>
          )}

          {board.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Layers3 className="size-6 text-primary" />
              </div>

              <h3 className="mt-3 font-bold">
                Set Up Your First Section
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-foreground/75">
                Add a section using the section
                control, then write questions or
                upload a question document.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {board.map((section) => (
                <ExamSectionCard
                  key={section.id}
                  section={section}
                  examId={exam.id}
                  slug={exam.slug}
                  examStatus={exam.status}
                  correctAnswers={correctAnswers}
                  sectionTemplates={sectionTemplates}
                  usedTemplateIds={board.map(
                    (item) =>
                      item.section_template_id ?? null
                  )}
                  draggingRuleId={
                    draggingRuleId
                  }
                  dragDisabled={
                    saving || hasPendingChanges
                  }
                  onStartDrag={(id) => {
                    if (!saving) {
                      setDraggingRuleId(id)
                    }
                  }}
                  onEndDrag={() =>
                    setDraggingRuleId(null)
                  }
                  onDropOnRule={(
                    targetSectionId,
                    ruleId,
                    after
                  ) =>
                    proposeMove(
                      targetSectionId,
                      ruleId,
                      after
                    )
                  }
                  onDropAtEnd={(
                    targetSectionId
                  ) =>
                    proposeMove(
                      targetSectionId,
                      null
                    )
                  }
                />
              ))}
            </div>
          )}

          {/* EMPTY QUESTIONS IN EXISTING SECTIONS */}
          {editable &&
            board.length > 0 &&
            totalQuestions === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />

                  <div>
                    <p className="text-sm font-bold">
                      Sections are ready
                    </p>

                    <p className="text-xs text-foreground/75">
                      Add your first question.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="shadow-none"
                >
                  <Link href={addQuestionUrl}>
                    Add Question
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
        </article>
      </div>

      {/* SAVE REORDERED QUESTIONS */}
      {editable && hasPendingChanges && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl rounded-xl border border-primary/30 bg-background/95 p-3 backdrop-blur-md sm:bottom-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-primary" />

              <div>
                <p className="text-sm font-bold">
                  Unsaved Arrangement
                </p>

                <p className="text-xs text-foreground/75">
                  Save your new question order.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={discardChanges}
                className="shadow-none"
              >
                <RotateCcw className="size-4" />
                Discard
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={applyChanges}
                className="shadow-none"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
