"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { duplicateExamAction } from "../services/duplicateExamAction"

type Props = {
  source: { id: string; title: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DuplicateExamDialog({ source, open, onOpenChange }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(() => `Copy of ${source.title}`.slice(0, 200))

  const confirm = () => {
    const name = title.trim()
    if (pending || name.length < 2 || name.length > 200) return

    startTransition(async () => {
      try {
        const result = await duplicateExamAction(source.id, name)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        onOpenChange(false)
        toast.success("Editable examination copy created.")
        router.push(`/exams/${encodeURIComponent(result.slug)}/settings`)
        router.refresh()
      } catch (error) {
        console.error("[CBT:DUPLICATE_EXAM]", error)
        toast.error("Unable to duplicate examination.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
      <AlertDialogContent className="max-w-lg border-primary/25 shadow-none">
        <AlertDialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Copy className="size-5 text-primary" />
          </div>
          <AlertDialogTitle>Reuse this examination?</AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/75">
            Create a separate, editable draft from the current question blueprint. Your original examination and its candidates stay unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="duplicate-exam-title">New examination title</Label>
            <Input
              id="duplicate-exam-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              disabled={pending}
              className="border-primary/25"
            />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-foreground/85">
            <p><strong>Included:</strong> sections, selected question versions, random question rules, instructions and delivery settings.</p>
            <p><strong>Reset:</strong> schedule, results visibility and review permissions.</p>
            <p><strong>Not copied:</strong> candidates, attempts, grades, links or past publications.</p>
            <p className="mt-1 font-medium">Review your questions, set new dates, save and publish when ready.</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || title.trim().length < 2 || title.trim().length > 200}
            onClick={(event) => { event.preventDefault(); confirm() }}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
            {pending ? "Creating copy..." : "Create editable copy"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
