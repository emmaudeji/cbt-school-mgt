"use client"

import { useActionState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  loginWithExamNumberAction,
  type ExamNumberLoginState,
} from "../../public/services/exam-number-login-action"

export function ExamNumberLoginForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<ExamNumberLoginState, FormData>(
    loginWithExamNumberAction,
    { error: "" }
  )

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />

      <div className="space-y-1.5">
        <Label htmlFor="examNumber">Exam Number</Label>
        <Input
          id="examNumber"
          name="examNumber"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          maxLength={6}
          pattern="[A-Za-z0-9]{6}"
          title="Enter your six-character Exam Number"
          placeholder="e.g. 7KM4PX"
          className="h-12 font-mono text-lg uppercase tracking-widest"
          required
          disabled={pending}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Find your Exam Number beside your name on the sheet from your teacher.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Checking Exam Number…" : "Continue"}
      </Button>
    </form>
  )
}
