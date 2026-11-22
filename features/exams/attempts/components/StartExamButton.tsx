
"use client"

import { useActionState } from "react"
import { Loader2, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  startPublicExamAction,
  type StartExamState,
} from "../services/start-exam-action"

export function StartExamButton({
  code,
}: {
  code: string
}) {
  const initialState: StartExamState = { error: "" }

  const [state, action, pending] = useActionState(
    startPublicExamAction,
    initialState
  )

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="code" value={code} />

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}

        {pending ? "Preparing examination..." : "Start Examination"}
      </Button>

      {state.error && (
        <p
          role="alert"
          className="text-center text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
    </form>
  )
}
