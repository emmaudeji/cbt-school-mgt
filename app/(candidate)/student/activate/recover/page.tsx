
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  requestStudentPasswordReset,
} from "@/features/school-student-accounts/services/recovery-actions"

export default function StudentRecoveryPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return

    setMessage("")
    setError("")

    startTransition(async () => {
      try {
        const result =
          await requestStudentPasswordReset(email)

        if (result.ok) {
          setMessage(result.message)
        } else {
          setError(result.message)
        }
      } catch {
        setError("Unable to submit recovery request.")
      }
    })
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full space-y-5 rounded-xl border p-6"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>

        <div>
          <h1 className="text-xl font-semibold">
            Recover Your Account
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your account email. If it is
            registered, we will send instructions
            to reset your password.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recovery-email">
            Email Address
          </Label>

          <Input
            id="recovery-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={pending}
            autoComplete="email"
            className="shadow-none"
          />
        </div>

        {message && (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full shadow-none"
        >
          {pending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Send Recovery Instructions
        </Button>

        <Link
          href="/login"
          className="block text-center text-sm text-primary hover:underline"
        >
          Back to Sign In
        </Link>
      </form>
    </main>
  )
}
