"use client"

import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { useQuestionImport } from "../context/QuestionImportProvider"
import { getImportIssues } from "../services/import-validation"
import type {
  ImportOption,
  ImportQuestion,
} from "@/types/question-import"
import { ImportedQuestionEditor } from "./ImportedQuestionEditor"

type Props = {
  sections: ImportOption[]
  topics: ImportOption[]
  disabled?: boolean
}

export function ImportedQuestionList({
  sections,
  topics,
  disabled = false,
}: Props) {
  const { questions, removeQuestion } = useQuestionImport()
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing =
    questions.find((question) => question.id === editingId) ?? null

  return (
    <>
      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionRow
            key={question.id}
            question={question}
            sectionName={
              sections.find(
                (section) => section.id === question.sectionId
              )?.name
            }
            topicName={
              topics.find(
                (topic) => topic.id === question.topicId
              )?.name
            }
            disabled={disabled}
            onEdit={() => setEditingId(question.id)}
            onRemove={() => {
              if (
                window.confirm(
                  `Remove question ${question.number} from this import?`
                )
              ) {
                removeQuestion(question.id)
              }
            }}
          />
        ))}
      </div>

      <ImportedQuestionEditor
        question={editing}
        sections={sections}
        topics={topics}
        onClose={() => setEditingId(null)}
      />
    </>
  )
}

function QuestionRow({
  question,
  sectionName,
  topicName,
  disabled,
  onEdit,
  onRemove,
}: {
  question: ImportQuestion
  sectionName?: string
  topicName?: string
  disabled: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const issues = getImportIssues(question)
  const isReady = issues.length === 0

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
            {question.number}
          </span>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {question.saved ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Saved
                  </Badge>
                ) : isReady ? (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="size-3" />
                    Needs Review
                  </Badge>
                )}

                {sectionName && (
                  <Badge variant="secondary">
                    {sectionName}
                  </Badge>
                )}

                {topicName && (
                  <Badge variant="outline">
                    {topicName}
                  </Badge>
                )}
              </div>

              {!question.saved && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    disabled={disabled}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled}
                    onClick={onRemove}
                    aria-label={`Remove question ${question.number}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <p className="whitespace-pre-wrap text-sm font-medium leading-6">
              {question.prompt}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option, index) => {
                const correct =
                  question.correctOption === option.key

                return (
                  <div
                    key={`${option.key}-${index}`}
                    className={
                      correct
                        ? "rounded-md border border-primary/40 bg-primary/5 p-3 text-xs"
                        : "rounded-md border bg-muted/10 p-3 text-xs"
                    }
                  >
                    <span className="font-semibold uppercase">
                      {option.key}.
                    </span>{" "}
                    <span className="whitespace-pre-wrap">
                      {option.body}
                    </span>

                    {correct && (
                      <CheckCircle2 className="ml-2 inline size-3.5 text-primary" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{question.points} mark(s)</span>
              <span className="capitalize">
                {question.difficulty}
              </span>
              {question.reviewed && <span>Reviewed</span>}
            </div>

            {!question.saved && issues.length > 0 && (
              <div className="rounded-md border border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                {issues.slice(0, 2).join(" · ")}
                {issues.length > 2 &&
                  ` · ${issues.length - 2} more`}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}