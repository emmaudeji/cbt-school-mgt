
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputField } from "@/components/shared/InputField"
import { SCHOOL } from "@/constants/data"
import { signIn } from "@/services/auth/actions"

export function SignInForm() {
  const router = useRouter()

  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (loading) return

    const login = identifier.trim()

    if (!login || !password) {
      toast.error("Enter your login ID and password.")
      return
    }

    setLoading(true)

    try {
      const result = await signIn(login, password)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success("Welcome back!")

      router.replace(result.redirectTo ?? "/")
      router.refresh()
    } catch (error) {
      console.error("[signIn]", error)
      toast.error("Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-7">
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:size-12">
          <LockKeyhole className="size-5 sm:size-6" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Welcome back
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to access your {SCHOOL.name} account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          name="identifier"
          label="Email or admission number"
          placeholder="Enter your login ID"
          icon={UserRound}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={loading}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="signin-password"
            className="text-sm font-medium"
          >
            Password
          </label>

          <div className="flex h-11 items-center rounded-md border bg-background px-3 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
            <LockKeyhole className="mr-2 size-4 shrink-0 text-muted-foreground" />

            <input
              id="signin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:text-sm"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
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
          disabled={loading}
          className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Accounts are provided by the school administrator.
        </p>
      </form>
    </div>
  )
}
