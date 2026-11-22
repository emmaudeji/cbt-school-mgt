
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { CbtExamQuestionRuleDetails } from "@/types/exams"
import {
  duplicateExamQuestionAction,
  removeExamQuestionAction,
} from "../services/action"
import { ExamQuestionEditButton } from "../context/ExamQuestionEditingProvider"

type Props = {
  examId: string
  slug: string
  sectionId: string
  rule: CbtExamQuestionRuleDetails
}

export function ExamQuestionActions({
  examId,
  slug,
  sectionId,
  rule,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [operation, setOperation] = useState<"duplicate" | "remove" | null>(
    null
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  const duplicate = () => {
    if (pending) return

    setOperation("duplicate")

    startTransition(async () => {
      try {
        const result = await duplicateExamQuestionAction({
          examId,
          slug,
          sectionId,
          rule,
        })

        if (!result.success) {
          toast.error(result.error ?? "Unable to duplicate question.")
          return
        }

        toast.success("Question duplicated successfully.")
        router.refresh()
      } catch (error) {
        console.error("[CBT:DUPLICATE_QUESTION]", error)
        toast.error("Unable to duplicate question.")
      } finally {
        setOperation(null)
      }
    })
  }

  const remove = () => {
    if (pending) return

    setOperation("remove")

    startTransition(async () => {
      try {
        const result = await removeExamQuestionAction(
          examId,
          rule.id,
          slug
        )

        if (!result.success) {
          toast.error(result.error ?? "Unable to remove question.")
          return
        }

        setConfirmOpen(false)
        toast.success("Question removed from examination.")
        router.refresh()
      } catch (error) {
        console.error("[CBT:REMOVE_EXAM_QUESTION]", error)
        toast.error("Unable to remove question.")
      } finally {
        setOperation(null)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExamQuestionEditButton
        rule={rule}
        sectionId={sectionId}
      />

        {/* Duplicate button */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending || rule.version?.type !== "single_choice"}
        onClick={duplicate}
      >
        {pending && operation === "duplicate" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Copy className="size-3.5" />
        )}
        Duplicate
      </Button>

      {/* Remove confirmation dialog */}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) setConfirmOpen(open)
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Remove
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove question from examination?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This question will be removed from the current
              examination only. It will remain available in
              the question bank and other examinations that
              use it.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                remove()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending && operation === "remove" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Remove Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
