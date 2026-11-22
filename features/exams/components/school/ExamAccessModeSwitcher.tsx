"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { changeExamAccessModeAction } from "../../services/assignment/change_access_mode_action"

type AccessMode = "registered" | "access_code" | "open_link"

export function ExamAccessModeSwitcher({
  examSlug,
  publicationId,
  accessMode,
}: {
  examSlug: string
  publicationId: string
  accessMode: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [warning, setWarning] = useState("")

  function changeToPrivateCodes() {
    startTransition(async () => {
      const result = await changeExamAccessModeAction(
        examSlug,
        publicationId,
        "access_code"
      )
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (result.assignedWithoutPrivateCodes > 0) {
        setWarning(
          `${result.assignedWithoutPrivateCodes} existing assigned candidate(s) do not yet have personal access codes. They must receive codes before they can use this sign-in method.`
        )
      }
      if (result.assignedWithoutPrivateCodes > 0) {
        toast.warning(`${result.assignedWithoutPrivateCodes} existing assignment(s) still need personal codes.`)
      }
      toast.success("Student access switched to Personal Access Codes.")
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
          <ShieldCheck className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Set up student access</h2>
          <p className="text-sm text-foreground/75">
            This examination currently uses {accessMode === "registered" ? "registered accounts" : "public-link access"}.
            To assign students without creating accounts, switch to Personal Access Codes.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-primary/20 bg-background p-3">
        <div className="flex items-center gap-2 font-medium">
          <KeyRound className="size-4 text-primary" /> Personal Access Codes
        </div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          Every newly assigned student receives a personal code. Exam questions and completed attempts remain unchanged.
        </p>
      </div>
      {warning && (
        <p role="alert" className="rounded-lg border border-amber-500/30 p-3 text-sm text-foreground/85">
          {warning}
        </p>
      )}
      <Button type="button" disabled={pending} onClick={changeToPrivateCodes}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {pending ? "Changing access…" : "Switch to Personal Access Codes"}
      </Button>
    </section>
  )
}
