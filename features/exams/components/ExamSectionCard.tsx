
"use client"

import type { DragEvent } from "react"
import {
  BookOpen,
  CheckCircle2,
  FileUp,
  GripVertical,
  Layers3,
  PenLine,
  Plus,
  Shuffle,
} from "lucide-react"

import { urls } from "@/constants"
import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/shared/LinkButton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import type {
  CbtExamSectionDetails,
  ExamStatus,
} from "@/types/exams"

import { ExamQuestionActions } from "./ExamQuestionActions"
import { RemoveExamSectionButton } from "./RemoveExamSectionButton"
import { EditExamSectionButton } from "./EditExamSectionButton"

type Template = {
  id: string
  title: string
}

type Props = {
  section: CbtExamSectionDetails
  examId: string
  slug: string
  examStatus: ExamStatus
  correctAnswers: Record<string, string[]>
  sectionTemplates: Template[]
  usedTemplateIds: (string | null)[]
  draggingRuleId?: string | null
  dragDisabled?: boolean
  onStartDrag?: (ruleId: string) => void
  onDropOnRule?: (
    sectionId: string,
    ruleId: string,
    after: boolean
  ) => void
  onDropAtEnd?: (sectionId: string) => void
  onEndDrag?: () => void
}

const typeLabels: Record<string, string> = {
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  free_text: "Written Answer",
}

export function ExamSectionCard({
  section,
  examId,
  slug,
  examStatus,
  correctAnswers,
  sectionTemplates,
  usedTemplateIds,
  draggingRuleId,
  dragDisabled = false,
  onStartDrag,
  onDropOnRule,
  onDropAtEnd,
  onEndDrag,
}: Props) {
  const rules = section.cbt_exam_question_rules
  const editable =
    examStatus === "draft" || examStatus === "active"

  const questionCount = rules.reduce(
    (total, rule) => total + rule.count_required,
    0
  )

  const fixedCount = rules.filter(
    rule => rule.kind === "fixed"
  ).length

  const randomCount = questionCount - fixedCount

  const query = new URLSearchParams({
    exam: slug,
    section_id: section.id,
  }).toString()

  const addQuestionUrl =
    `${urls.examAddQuestion(slug)}?${query}`

  const uploadUrl =
    `${urls.uploadExamQuestions(slug)}?${query}`

  const dragHandle = (ruleId: string) => {
    if (!editable || dragDisabled || !onStartDrag) {
      return null
    }

    return (
      <span
        role="button"
        tabIndex={0}
        draggable
        aria-label="Drag to reorder question"
        title="Drag to move or reorder question"
        className="inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary"
        onDragStart={event => {
          event.dataTransfer.effectAllowed = "move"
          event.dataTransfer.setData("text/plain", ruleId)
          onStartDrag(ruleId)
        }}
        onDragEnd={onEndDrag}
      >
        <GripVertical className="size-3.5" />
      </span>
    )
  }

  const dropProps = (ruleId: string) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!draggingRuleId || dragDisabled) return
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      if (!draggingRuleId || dragDisabled) return

      event.preventDefault()
      event.stopPropagation()

      const rect =
        event.currentTarget.getBoundingClientRect()

      onDropOnRule?.(
        section.id,
        ruleId,
        event.clientY > rect.top + rect.height / 2
      )
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Accordion
        type="single"
        collapsible
        defaultValue={rules.length === 0 ? "content" : undefined}
      >
        <AccordionItem value="content" className="border-b-0">
          <AccordionTrigger className="flex items-center gap-2 border-b bg-primary/5 px-3 py-2 sm:px-4 hover:no-">
            <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-background text-primary">
                <Layers3 className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <h6 className="truncate text-foreground">
                  {section.title}
                </h6>
                <p className="mt-0.5 truncate text-sm text-foreground/70">
                  {section.instructions ||
                    (questionCount
                      ? "View and manage questions"
                      : "Ready for questions")}
                </p>
              </div>

              {/* <div className="hidden shrink-0 gap-1.5 sm:flex">
                {fixedCount > 0 && (
                  <Badge className="bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300">
                    {fixedCount} fixed
                  </Badge>
                )}
                {randomCount > 0 && (
                  <Badge className="bg-amber-500/10 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300">
                    {randomCount} random
                  </Badge>
                )}
              </div> */}

              
            </div>

            <div className="flex items-center gap-2 ">

              <Badge variant="secondary" className="shrink-0">
                {questionCount}
              </Badge>


              <div className="flex">
                <LinkButton
                  href={uploadUrl}
                  variant="outline"
                  size="sm"
                  className="p-2 border-primary/30 bg-primary-500/5 shadow-none"
                >
                  <Plus className="size-4 text-primary" />
                </LinkButton>
              </div>

              
              {editable && (
                <div className="flex shrink-0 items-center gap-1.5 " onClick={(e)=>e.stopPropagation()}>
                  <EditExamSectionButton
                    examId={examId}
                    sectionId={section.id}
                    title={section.title}
                    instructions={section.instructions}
                    templateId={section.section_template_id ?? null}
                    templates={sectionTemplates}
                    usedTemplateIds={usedTemplateIds}
                    disabled={dragDisabled}
                  />

                  <RemoveExamSectionButton
                    examId={examId}
                    sectionId={section.id}
                    sectionTitle={section.title}
                    questionCount={questionCount}
                    disabled={dragDisabled}
                  />
                </div>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-0">
            {rules.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                  <BookOpen className="size-5" />
                </div>

                <h4 className="mt-3 text-sm font-semi">
                  No questions in this section
                </h4>
                <p className="mt-1 text-xs text-foreground/70">
                  Write or upload questions for this section.
                </p>

                {editable && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <LinkButton href={addQuestionUrl} size="sm" className="">
                      <PenLine className="size-4" />
                      Write Question
                    </LinkButton>

                    <LinkButton
                      href={uploadUrl}
                      variant="outline"
                      size="sm"
                      className="border-emerald-600/30 bg-emerald-500/5 shadow-none"
                    >
                      <FileUp className="size-4 text-emerald-600" />
                      Upload Questions
                    </LinkButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {rules.map((rule, index) => {
                  if (rule.kind === "random") {
                    return (
                      <div
                        key={rule.id}
                        className="flex items-start gap-3 px-4 py-4"
                        {...dropProps(rule.id)}
                      >
                        {dragHandle(rule.id)}

                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
                          <Shuffle className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semi">
                            Random Question Selection
                          </p>
                          <p className="mt-1 text-xs leading-5 text-foreground/75">
                            {rule.count_required} questions from the configured pool.
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {rule.difficulty && (
                              <Badge variant="outline">
                                {rule.difficulty}
                              </Badge>
                            )}
                            {rule.question_type && (
                              <Badge variant="outline">
                                {typeLabels[rule.question_type] ??
                                  rule.question_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const version = rule.version
                  const options =
                    version?.cbt_question_options ?? []

                  const correctKeys = (
                    correctAnswers[rule.id] ?? []
                  ).map(key => key.toLowerCase())

                  const correctLabels = options
                    .filter(option =>
                      correctKeys.includes(
                        option.option_key.toLowerCase()
                      )
                    )
                    .map(option =>
                      option.option_key.toUpperCase()
                    )

                  return (
                    <article
                      key={rule.id}
                      className="px-4 py-4"
                      {...dropProps(rule.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semi text-primary">
                            {index + 1}
                          </span>
                          {dragHandle(rule.id)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <p className="whitespace-pre-wrap text-sm font-semi leading-6">
                              {version?.prompt ?? "Question unavailable"}
                            </p>

                            {version && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant="secondary">
                                  {typeLabels[version.type] ??
                                    version.type}
                                </Badge>
                                <Badge variant="outline">
                                  {rule.points_override ??
                                    version.default_points} marks
                                </Badge>
                                <Badge variant="outline">
                                  {version.difficulty}
                                </Badge>
                                {version.cbt_questions
                                  ?.cbt_topics?.name && (
                                  <Badge variant="outline">
                                    {version.cbt_questions.cbt_topics.name}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {options.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {options.map(option => {
                                const isCorrect =
                                  correctKeys.includes(
                                    option.option_key.toLowerCase()
                                  )

                                return (
                                  <div
                                    key={option.id}
                                    className={
                                      isCorrect
                                        ? "flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
                                        : "flex gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                                    }
                                  >
                                    <span className="text-xs font-semi">
                                      {option.option_key.toUpperCase()}.
                                    </span>
                                    <span className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-5">
                                      {option.body}
                                    </span>
                                    {isCorrect && (
                                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {correctLabels.length > 0 && (
                            <p className="text-xs font-semi text-emerald-700 dark:text-emerald-300">
                              Correct: {correctLabels.join(", ")}
                            </p>
                          )}

                          {version?.explanation && (
                            <p className="text-xs text-foreground/70">
                              An answer explanation is available.
                            </p>
                          )}

                          {editable && version && (
                            <div className="flex justify-end gap-2 border-t pt-3">
                              <ExamQuestionActions
                                examId={examId}
                                slug={slug}
                                sectionId={section.id}
                                rule={rule}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {editable && draggingRuleId && !dragDisabled && (
              <div
                className="mx-4 mb-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center text-xs text-primary"
                onDragOver={event => event.preventDefault()}
                onDrop={event => {
                  event.preventDefault()
                  event.stopPropagation()
                  onDropAtEnd?.(section.id)
                }}
              >
                Drop here to place at the end of {section.title}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}