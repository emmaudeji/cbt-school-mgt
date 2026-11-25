
"use client"

import { useActionState } from "react"
import { Loader2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinPublicExamAction, JoinPublicExamState } from "../../public/services/public-exam-access"

 

export function PublicExamJoinForm({
  code,
}: {
  code: string
}) {
  const initialState: JoinPublicExamState = {
    error: "",
  }

  const [state, formAction, pending] = useActionState(
    joinPublicExamAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="code" value={code} />

      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name
        </Label>

        <Input
          id="firstName"
          name="firstName"
          maxLength={120}
          required
          autoComplete="given-name"
          disabled={pending}
          placeholder="Enter your first name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name
        </Label>

        <Input
          id="lastName"
          name="lastName"
          maxLength={120}
          autoComplete="family-name"
          disabled={pending}
          placeholder="Enter your last name"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}

        {pending ? "Registering..." : "Join Examination"}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Your details will be used for examination participation
        and result administration.
      </p>
    </form>
  )
}
