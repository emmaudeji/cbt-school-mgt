
"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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

import type {
  CbtExamQuestionRuleDetails,
} from "@/types/exams"

import type { ImportOption } from "@/types/question-import"
import {
  getExamQuestionAnswerAction,
  updateExamQuestionAction,
} from "../services/action"
import { getImportIssues } from "../services/import-validation"
import {
  QuestionFormFields,
  type QuestionFormValue,
} from "./QuestionFormFields"

type Props = {
  rule: CbtExamQuestionRuleDetails | null
  sectionId: string
  slug: string
  sections: ImportOption[]
  topics: ImportOption[]
  onClose: () => void
}

export function ExamQuestionEditor({
  rule,
  sectionId,
  slug,
  sections,
  topics,
  onClose,
}: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<QuestionFormValue | null>(null)
  const [loading, startLoading] = useTransition()
  const [saving, startSaving] = useTransition()

  const version = rule?.version

  useEffect(() => {
    if (!rule || !version) {
      setDraft(null)
      return
    }

    let active = true

    setDraft(null)

    startLoading(async () => {
      try {
        const result = await getExamQuestionAnswerAction(
          rule.id,
          version.id
        )

        if (!active) return

        if (result.error) {
          toast.error(result.error)
          onClose()
          return
        }

        setDraft({
          prompt: version.prompt,
          options: version.cbt_question_options.map((option) => ({
            key: option.option_key,
            body: option.body,
          })),
          correctOption: result.answer,
          sectionId,
          topicId: version.cbt_questions?.topic_id ?? "",
          difficulty: version.difficulty,
          points: rule.points_override ?? version.default_points,
          explanation: version.explanation ?? "",
        })
      } catch (error) {
        console.error("[CBT:LOAD_EDITOR]", error)

        if (active) {
          toast.error("Unable to load question.")
          onClose()
        }
      }
    })

    return () => {
      active = false
    }
  }, [rule, version, sectionId, onClose])

  const save = () => {
    if (!rule || !version || !draft || saving) return

    const issues = getImportIssues(draft)

    if (issues.length) {
      toast.error(issues[0])
      return
    }

    startSaving(async () => {
      try {
        const response = await updateExamQuestionAction(
          rule.id,
          version.id,
          slug,
          draft
        )

        if (!response.success) {
          toast.error(response.error ?? "Unable to save changes.")
          return
        }

        toast.success("Question updated successfully.")
        onClose()
        router.refresh()
      } catch (error) {
        console.error("[CBT:UPDATE_QUESTION]", error)
        toast.error("Unable to update question.")
      }
    })
  }

  return (
    <Sheet
      open={!!rule}
      onOpenChange={(open) => {
        if (!open && !saving) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-5">
          <SheetTitle>Edit Exam Question</SheetTitle>
          <SheetDescription>
            Save this question to the examination. For published examinations,
            existing candidate sessions continue to use their original question
            until live correction synchronization is installed.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading || !draft ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading question...
            </div>
          ) : (
            <QuestionFormFields
              value={draft}
              onChange={setDraft}
              sections={sections}
              topics={topics}
              disabled={saving}
            />
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={save}
            disabled={!draft || loading || saving}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
