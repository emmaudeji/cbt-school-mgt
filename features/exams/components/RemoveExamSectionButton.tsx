
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

import { removeExamSectionAction } from "../services/action.examSections"

type Props = {
  examId: string
  sectionId: string
  sectionTitle: string
  questionCount: number
  disabled?: boolean
}

export function RemoveExamSectionButton({
  examId,
  sectionId,
  sectionTitle,
  questionCount,
  disabled = false,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const remove = () => {
    if (pending) return

    startTransition(async () => {
      const result = await removeExamSectionAction(
        examId,
        sectionId
      )

      if (!result.success) {
        toast.error(
          result.error ?? "Unable to remove section."
        )
        return
      }

      setOpen(false)
      toast.success("Section and its exam questions removed.")
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
        className="border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-none"
      >
        <Trash2 className="size-3.5" />
        Remove Section
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={value => {
          if (!pending) setOpen(value)
        }}
      >
        <AlertDialogContent className="shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {sectionTitle}?
            </AlertDialogTitle>

            <AlertDialogDescription className="leading-6 text-foreground/85">
              This will remove the section and its{" "}
              <strong className="text-foreground">
                {questionCount}{" "}
                {questionCount === 1
                  ? "question"
                  : "questions"}
              </strong>{" "}
              from this examination.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground/85">
            Questions saved in the question bank and
            previously published examination revisions
            will not be deleted.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={event => {
                event.preventDefault()
                remove()
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}

              {pending
                ? "Removing..."
                : "Remove Section & Questions"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
