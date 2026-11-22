
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { createClient } from "@/utils/supabase/client"

export default function StudentNewPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return

    if (password.length < 12) {
      setError("Use at least 12 characters.")
      return
    }

    if (password !== confirmation) {
      setError("Passwords do not match.")
      return
    }

    setError("")

    startTransition(async () => {
      try {
        const db = createClient()

        const { data: auth, error: authError } =
          await db.auth.getUser()

        if (authError || !auth.user) {
          setError(
            "Your recovery link has expired or is invalid. Request another link."
          )
          return
        }

        const { error: updateError } =
          await db.auth.updateUser({
            password,
          })

        if (updateError) {
          setError(updateError.message)
          return
        }

        setSuccess(true)
        setPassword("")
        setConfirmation("")
      } catch {
        setError(
          "Unable to update password. Try again."
        )
      }
    })
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-5 rounded-xl border p-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>

        <div>
          <h1 className="text-xl font-semibold">
            Set New Password
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong, unique password
            for your student account.
          </p>
        </div>

        {success ? (
          <div className="space-y-3">
            <p
              role="status"
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm"
            >
              Your password has been updated.
            </p>

            <Button
              className="w-full shadow-none"
              onClick={() => router.push("/login")}
            >
              Continue to Sign In
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">
                New Password
              </Label>

              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={password}
                onChange={e =>
                  setPassword(e.target.value)
                }
                disabled={pending}
                className="shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirm Password
              </Label>

              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={confirmation}
                onChange={e =>
                  setConfirmation(e.target.value)
                }
                disabled={pending}
                className="shadow-none"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
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
              Save New Password
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
