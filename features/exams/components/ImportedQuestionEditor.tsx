
"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { useQuestionImport } from "../context/QuestionImportProvider"
import type {
  ImportOption,
  ImportQuestion,
} from "@/types/question-import"
import {
  QuestionFormFields,
  type QuestionFormValue,
} from "./QuestionFormFields"

type Props = {
  question: ImportQuestion | null
  sections: ImportOption[]
  topics: ImportOption[]
  onClose: () => void
}

export function ImportedQuestionEditor({
  question,
  sections,
  topics,
  onClose,
}: Props) {
  const { updateQuestion } = useQuestionImport()
  const [draft, setDraft] = useState<ImportQuestion | null>(null)

  useEffect(() => {
    setDraft(
      question
        ? {
            ...question,
            options: question.options.map((option) => ({
              ...option,
            })),
          }
        : null
    )
  }, [question])

  const applyChanges = () => {
    if (!draft || draft.saved) return

    updateQuestion(draft.id, {
      ...draft,
      reviewed: true,
      warnings: [],
    })

    toast.success("Question updated.")
    onClose()
  }

  const updateFields = (fields: QuestionFormValue) => {
    setDraft((current) =>
      current ? { ...current, ...fields } : null
    )
  }

  return (
    <Sheet
      open={!!question}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-5">
          <SheetTitle>
            Edit Question {question?.number ?? ""}
          </SheetTitle>

          <SheetDescription>
            Review the question and apply your changes to
            the import draft.
          </SheetDescription>
        </SheetHeader>

        {draft && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <QuestionFormFields
                value={draft}
                onChange={updateFields}
                sections={sections}
                topics={topics}
              />
            </div>

            <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={applyChanges}
                disabled={draft.saved}
              >
                Apply Changes
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
