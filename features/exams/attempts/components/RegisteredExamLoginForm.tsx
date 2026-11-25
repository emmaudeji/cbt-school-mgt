
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  enterRegisteredExamAction,
} from "@/features/exams/public/services/registered-exam-entry"

type Props = {
  code: string
}

export function RegisteredExamLoginForm({ code }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loginOpen, setLoginOpen] = useState(false)

  function continueToExam(
    credentials?: {
      email: string
      password: string
    }
  ) {
    if (pending) return

    setError("")

    startTransition(async () => {
      const result = await enterRegisteredExamAction(
        code,
        credentials
      )

      if (!result.success) {
        setError(result.error)

        // An existing portal session may be absent or
        // belong to a different account.
        if (!credentials) setLoginOpen(true)
        return
      }

      setPassword("")

      // The registered action issued the same candidate
      // session cookie used by the existing /ready route.
      router.replace(`/take/${encodeURIComponent(code)}/ready`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Existing registered school session */}
      {/* <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <UserRoundCheck className="size-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              Already signed in?
            </p>

            <p className="mt-1 text-xs leading-5 text-foreground/75">
              Continue using your school account.
              Your examination assignment will be checked
              before entry.
            </p>
          </div>
        </div>

        <Button
          type="button"
          disabled={pending}
          onClick={() => continueToExam()}
          className="mt-3 w-full shadow-none"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserRoundCheck className="size-4" />
          )}

          Continue with School Account
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </div> */}

      {/* Optional account login */}
      <div className="rounded-xl border bg-background">
        {/* <button
          type="button"
          disabled={pending}
          aria-expanded={loginOpen}
          onClick={() => setLoginOpen(value => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-blue-600" />
            Sign in with email and password
          </span>

          <span className="text-xs font-medium text-primary">
            {loginOpen ? "Hide" : "Open"}
          </span>
        </button> */}

       
          <form
            className="space-y-4   p-4"
            onSubmit={event => {
              event.preventDefault()
              continueToExam({ email, password })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="exam-login-email">
                School Email
              </Label>

              <Input
                id="exam-login-email"
                type="email"
                autoComplete="username"
                placeholder="student@school.edu"
                value={email}
                onChange={event =>
                  setEmail(event.target.value)
                }
                disabled={pending}
                required
                className="shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-login-password">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="exam-login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={event =>
                    setPassword(event.target.value)
                  }
                  disabled={pending}
                  required
                  className="pr-11 shadow-none"
                />

                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setShowPassword(value => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending || !email.trim() || !password}
              className="w-full shadow-none"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}

              {pending
                ? "Verifying Account..."
                : "Sign In & Continue"}
            </Button>
          </form>
       
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/5 p-3"
        >
          <span className="mt-0.5 text-rose-600">
            <KeyRound className="size-4" />
          </span>

          <p className="text-xs leading-5 text-rose-800 dark:text-rose-300">
            {error}
          </p>
        </div>
      )}

      <p className="text-center text-xs leading-5 text-foreground/80">
        Only candidates assigned to this examination can continue.
        Contact your school if your account has not been assigned.
      </p>
    </div>
  )
}
