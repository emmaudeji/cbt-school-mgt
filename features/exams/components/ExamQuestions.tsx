
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
  BookOpen,
  CircleHelp,
  FileUp,
  FolderOpen,
  GripVertical,
  Layers3,
  Loader2,
  PenLine,
  RotateCcw,
  Save,
} from "lucide-react"
import { toast } from "react-toastify"

import { urls } from "@/constants"
import { useOrgStore } from "@/store/org-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { getExamQuestions } from "../services/queries"
import { ExamSectionCard } from "./ExamSectionCard"
import { ExamSectionControls } from "./ExamSectionControls"
import { reorderExamQuestionsAction } from "../services/action.reorderExamQuestionsAction"

type ExamData = Awaited<ReturnType<typeof getExamQuestions>>
type Section = ExamData["sections"][number]

type Props = ExamData & {
  correctAnswers: Record<string, string[]>
  sectionTemplates: {
    id: string
    title: string
  }[]
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
      section =>
        `${section.id}:${section.cbt_exam_question_rules
          .map(rule => rule.id)
          .join(",")}`
    )
    .join("|")
}

function getLayout(sections: Section[]) {
  return sections.flatMap(section =>
    section.cbt_exam_question_rules.map(rule => ({
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

  const next = sections.map(section => ({
    ...section,
    cbt_exam_question_rules: [
      ...section.cbt_exam_question_rules,
    ],
  }))

  const source = next.find(section =>
    section.cbt_exam_question_rules.some(
      rule => rule.id === move.ruleId
    )
  )

  const destination = next.find(
    section => section.id === move.sectionId
  )

  if (!source || !destination) {
    return sections
  }

  if (
    move.targetRuleId &&
    !destination.cbt_exam_question_rules.some(
      rule => rule.id === move.targetRuleId
    )
  ) {
    return sections
  }

  const sourceIndex =
    source.cbt_exam_question_rules.findIndex(
      rule => rule.id === move.ruleId
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
        item => item.id === move.targetRuleId
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

export function ExamQuestions({
  exam,
  sections,
  correctAnswers,
  sectionTemplates,
}: Props) {
  const router = useRouter()

  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const [board, setBoard] = useState<Section[]>(sections)
  const [savedLayout, setSavedLayout] =
    useState<Section[]>(sections)

  const [draggingRuleId, setDraggingRuleId] =
    useState<string | null>(null)

  const [saving, startSaving] = useTransition()

  const editable =
    exam.status === "draft" ||
    exam.status === "active"

  const hasPendingChanges =
    layoutKey(board) !== layoutKey(savedLayout)

  // Accept refreshed server data only when no local
  // drag-and-drop arrangement is waiting to be saved.
  useEffect(() => {
    setBoard(current =>
      layoutKey(current) === layoutKey(savedLayout)
        ? sections
        : current
    )
    setSavedLayout(sections)
    // savedLayout is deliberately the previous baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  const totalQuestions = board.reduce(
    (total, section) =>
      total +
      section.cbt_exam_question_rules.reduce(
        (count, rule) => count + rule.count_required,
        0
      ),
    0
  )

  const fixedCount = board.reduce(
    (total, section) =>
      total +
      section.cbt_exam_question_rules.filter(
        rule => rule.kind === "fixed"
      ).length,
    0
  )

  const randomCount = totalQuestions - fixedCount

  const addQuestionUrl = urls.examAddQuestion(exam.slug)
  const uploadUrl =
    `${urls.uploadExamQuestions(exam.slug)}` +
    `?exam=${encodeURIComponent(exam.slug)}`

  const proposeMove = (
    sectionId: string,
    targetRuleId: string | null,
    after = false
  ) => {
    if (!editable || saving || !draggingRuleId) return

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

  const discardChanges = () => {
    if (saving) return

    setBoard(savedLayout)
    setDraggingRuleId(null)
  }

  const applyChanges = () => {
    if (!editable || !hasPendingChanges || saving) {
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
            result.error ?? "Unable to save question order."
          )
          return
        }

        setSavedLayout(nextLayout)
        toast.success("Question arrangement saved.")
        router.refresh()
      } catch (error) {
        console.error("[CBT:REORDER_QUESTIONS]", error)
        toast.error("Unable to save question arrangement.")
      }
    })
  }

  return (
    <section
      className={`space-y-4 ${
        hasPendingChanges ? "pb-28" : ""
      }`}
    >
      {/* Compact page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Exam Questions
          </h1>
          <p className="text-xs leading-5 text-foreground/75 sm:text-sm">
            Organize sections, questions and answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {exam.status === "active" && (
            <Badge className="border border-emerald-600/20 bg-emerald-500/10 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
              Published
            </Badge>
          )}

          {editable && (
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
          )}
        </div>
      </div>

      {/* Aside + article */}
      <div className="
        grid min-w-0 items-start gap-4
        md:grid-cols-[240px_minmax(0,1fr)]
        lg:grid-cols-[270px_minmax(0,1fr)]
        xl:grid-cols-[290px_minmax(0,1fr)]
      ">
        <aside className="
          min-w-0 self-start
          md:sticky md:top-4
          md:max-h-[calc(100dvh-2rem)]
          md:overflow-y-auto
          md:overscroll-contain
          md:pr-1
        ">
                <div className="space-y-3">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat
                      icon={<CircleHelp className="size-3.5" />}
                      label="Questions"
                      value={totalQuestions}
                      className="border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    />

                    <MiniStat
                      icon={<Layers3 className="size-3.5" />}
                      label="Sections"
                      value={board.length}
                      className="border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    />

                    <MiniStat
                      icon={<BookOpen className="size-3.5" />}
                      label="Fixed"
                      value={fixedCount}
                      className="border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    />
                  </div>

                  {/* Compact question selection summary */}
                  {randomCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs">
                      <span className="font-medium text-amber-900 dark:text-amber-200">
                        Random questions
                      </span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {randomCount}
                      </span>
                    </div>
                  )}

                  {/* Section control */}
                  {editable && (
                    <div className="space-y-2">
                      <ExamSectionControls
                        examId={exam.id}
                        templates={sectionTemplates}
                        usedTemplateIds={board.map(
                          section =>
                            section.section_template_id ?? null
                        )}
                        disabled={saving || hasPendingChanges}
                      />
                    </div>
                  )}

                  {/* Quick actions */}
                  {editable && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <FolderOpen className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">
                          Quick Actions
                        </h2>
                      </div>

                      <div className="grid gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-9 justify-start border-primary/25 bg-primary/5 font-  text-foreground shadow-none hover:bg-primary/10"
                        >
                          <Link href={addQuestionUrl}>
                            <PenLine className="size-4 text-primary" />
                            Write Question
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-9 justify-start border-emerald-600/25 bg-emerald-500/5 font-  text-foreground shadow-none hover:bg-emerald-500/10"
                        >
                          <Link href={uploadUrl}>
                            <FileUp className="size-4 text-emerald-600" />
                            Upload Questions
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="px-1 text-xs leading-5 text-foreground/70">
                    {isSchool
                      ? "Sections are reusable across tests in your school."
                      : "Sections are reusable across assessments in your organization."}
                  </p>
                </div>
              </aside>

              <article className="min-w-0 w-full space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3  border-b border-primary/20   px-4 py-3">
                  <div className="space-y-0.5">
                    <h2 className="flex items-center gap-2 text-lg font-  text-foreground">
                      <Layers3 className="size-4 text-primary" />
                      Examination Sections
                    </h2>
                    <p className="text-sm text-foreground/75">
                      Expand a section to review and manage its questions.
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="font-semibold"
                  >
                    {board.length}{" "}
                    {board.length === 1 ? "section" : "sections"}
                  </Badge>
                </div>

                {editable && totalQuestions > 0 && (
                  <div className="flex items-center gap-2 px-1 text-xs text-foreground/70">
                    <GripVertical className="size-3.5 shrink-0 text-primary" />
                    Drag questions within or between expanded sections.
                  </div>
                )}

                {board.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-6 py-12 text-center">
                    <Layers3 className="mx-auto size-8 text-primary" />
                    <h3 className="mt-3 text-sm font-bold text-foreground">
                      No sections added yet
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-foreground/75">
                      Use the section control to select or create
                      your first examination section.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {board.map(section => (
                      <ExamSectionCard
                        key={section.id}
                        section={section}
                        examId={exam.id}
                        slug={exam.slug}
                        examStatus={exam.status}
                        correctAnswers={correctAnswers}
                        sectionTemplates={sectionTemplates}
                        usedTemplateIds={board.map(
                          item => item.section_template_id ?? null
                        )}
                        draggingRuleId={draggingRuleId}
                        dragDisabled={saving || hasPendingChanges}
                        onStartDrag={id => {
                          if (!saving) setDraggingRuleId(id)
                        }}
                        onEndDrag={() => setDraggingRuleId(null)}
                        onDropOnRule={(targetSectionId, ruleId, after) =>
                          proposeMove(targetSectionId, ruleId, after)
                        }
                        onDropAtEnd={targetSectionId =>
                          proposeMove(targetSectionId, null)
                        }
                      />
                    ))}
                  </div>
                )}
              </article>
            </div>

      {/* Save pending question arrangement */}
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
                  Unsaved arrangement
                </p>
                <p className="text-xs text-foreground/75">
                  Save the new question order.
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
                {saving ? "Saving..." : "Save Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
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
      className={`min-w-0 rounded-lg border p-2.5 ${className}`}
    >
      <div className="flex items-center gap-1 text-[11px] font- ">
        {icon}
        <span className="truncate">{label}</span>
      </div>

      <p className="mt-1 text-xl font  tabular-nums">
        {value}
      </p>
    </div>
  )
}
