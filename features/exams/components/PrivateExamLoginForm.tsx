"use client"

import { useActionState } from "react"
import { ArrowRight, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputField } from "@/components/shared/InputField"
import { loginWithExamAccessCodeAction, type PrivateExamLoginState } from "../public/services/private-exam-login-action"

export function PrivateExamLoginForm({ code }: { code: string }) {
  const initial: PrivateExamLoginState = { error: "" }
  const [state, action, pending] = useActionState(loginWithExamAccessCodeAction, initial)
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="code" value={code} />
      <InputField name="candidateCode" label="Candidate code"
        description="Use the candidate code given by your school or examination organizer."
        placeholder="e.g. GCE0013" required autoComplete="off" maxLength={64} disabled={pending} />
      <InputField name="personalCode" label="Personal access code"
        description="Enter your six-character code. It is unique to you."
        placeholder="e.g. 7KM4PX" required autoComplete="off" maxLength={6}
        minLength={6} pattern="[A-Za-z0-9]{6}" disabled={pending}
        className="font-mono tracking-widest uppercase" icon={KeyRound} />
      {state.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}
      <Button className="h-11 w-full shadow-none" disabled={pending} type="submit">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Checking access..." : "Continue to examination"}
      </Button>
    </form>
  )
}
