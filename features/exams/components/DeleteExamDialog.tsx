"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "react-toastify"

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
import { deleteDraftExamAction } from "../services/deleteDraftExamAction"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam: { id: string; slug: string; title: string }
}

export function DeleteExamDialog({ open, onOpenChange, exam }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function setOpen(next: boolean) {
    if (pending) return
    if (!next) setError("")
    onOpenChange(next)
  }

  function confirmDelete() {
    if (pending) return
    setError("")
    startTransition(async () => {
      try {
        const result = await deleteDraftExamAction(exam.id, exam.slug)
        if (!result.success) {
          setError(result.error)
          return
        }
        setError("")
        onOpenChange(false)
        toast.success("Draft examination deleted.")
        router.refresh()
      } catch (cause) {
        console.error("[CBT:DELETE_EXAM]", cause)
        setError("Unable to confirm deletion. Refresh before retrying.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md border-primary/25 shadow-none">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10">
            <TriangleAlert className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle>Delete this draft examination?</AlertDialogTitle>
          <AlertDialogDescription className="leading-6 text-foreground/75">
            This permanently deletes the draft, its sections and its question selections.
            Questions in your question bank are not deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-semibold">
          {exam.title}
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep Examination</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive shadow-none"
            onClick={(event) => {
              event.preventDefault()
              confirmDelete()
            }}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {pending ? "Deleting..." : "Delete Draft"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
