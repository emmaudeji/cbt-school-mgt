
"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react"

import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function StudentLoginPage() {
  const router = useRouter()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (pending) return

    const email = login.trim().toLowerCase()

    if (!email || !password) {
      setError(
        "Enter your school login and password."
      )
      return
    }

    setPending(true)
    setError("")

    try {
      const supabase = createClient()

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (loginError) {
        setError(
          "Incorrect login or password. Contact your school administrator if you need help."
        )
        return
      }

      router.replace("/student/dashboard")
      router.refresh()
    } catch {
      setError(
        "Unable to sign in. Please try again."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Student Login
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Sign in using the school login and
              password issued by your administrator.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="student-login">
              School Login
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="student-login"
                type="email"
                autoComplete="username"
                placeholder="firstname.lastname@school.com"
                value={login}
                onChange={(event) =>
                  setLogin(event.target.value)
                }
                disabled={pending}
                required
                className="pl-10 shadow-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-password">
              Password
            </Label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="student-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={pending}
                required
                className="pl-10 pr-11 shadow-none"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2 shadow-none"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full shadow-none"
          >
            {pending && (
              <Loader2 className="size-4 animate-spin" />
            )}

            {pending
              ? "Signing in..."
              : "Sign In"}
          </Button>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            Forgotten your password? Contact
            your school administrator for a reset.
          </p>
        </form>
      </div>
    </main>
  )
}
