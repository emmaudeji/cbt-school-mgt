
"use client"
 

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { createClient } from "@/utils/supabase/client"
import { useSchoolBranding } from "@/store/branding-store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const studentImage =
  "https://images.pexels.com/photos/34162709/pexels-photo-34162709/free-photo-of-group-of-nigerian-schoolchildren-in-classroom.jpeg?auto=compress&cs=tinysrgb&w=1200"

export default function StudentLoginPage() {
  const router = useRouter()
  const branding = useSchoolBranding()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending) return

    const email = login.trim().toLowerCase()

    if (!email || !password) {
      setError("Enter your school login and password.")
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
      setError("Unable to sign in. Please try again.")
    } finally {
      setPending(false)
    }
  }

  const schoolName = branding.name || "Your School"

  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <div className="mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-2">

       
        {/* Welcome section */}
        <section className="flex flex-col justify- ">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>

            <div>
              <p className="text-sm font-bold">{schoolName}</p>
              <p className="text-xs text-muted-foreground">
                Student Portal
              </p>
            </div>
          </Link>
          
          
          <div>

          <div className="max-w-lg">
            <p className="mb-3 text-sm font-medium text-primary">
              Your education, all in one place
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome to your
              <span className="text-primary"> learning space.</span>
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Access your examinations, view your results and
              keep track of your academic progress.
            </p>
          </div>

          {/* Student photograph */}
          <div className="mt-7 overflow-hidden rounded-2xl border bg-muted">
            <img
              src={studentImage}
              alt="Nigerian secondary school students learning in a classroom"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
          </div>

          {/* Portal benefits */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="border-l-2 border-primary pl-3">
              <BookOpen className="mb-2 size-4 text-primary" />
              <p className="text-xs font-semibold">Learning</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Academic resources
              </p>
            </div>

            <div className="border-l-2 border-primary pl-3">
              <ClipboardCheck className="mb-2 size-4 text-primary" />
              <p className="text-xs font-semibold">Examinations</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Online assessments
              </p>
            </div>

            <div className="border-l-2 border-primary pl-3">
              <GraduationCap className="mb-2 size-4 text-primary" />
              <p className="text-xs font-semibold">Results</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Academic progress
              </p>
            </div>
          </div>
        </section>


        {/* Login section */}
        <section className="flex min-h-sm items-center justify-center px-5 py-12 sm:px-10 lg:min-h-dvh lg:px-14">
          <div className="w-full max-w-[400px]">

            <div className="mb-9">
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden">
                <GraduationCap className="size-6" />
              </div>

              <p className="mb-2 text-sm font-medium text-primary">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Student sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter your school credentials to access your
                student portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* School login */}
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
                    placeholder="student@school.com"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    disabled={pending}
                    required
                    className="h-11 pl-10 shadow-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="student-password">
                  Password
                </Label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={pending}
                    required
                    className="h-11 pl-10 pr-11 shadow-none"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 shadow-none"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full shadow-none"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to portal
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                Forgotten your password? Contact your school
                administrator for assistance.
              </p>
            </form>

            {/* Help and security */}
            <div className="mt-9 border-t pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Secure student access
                </div>

                <Link
                  href="/help"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Need help?
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {schoolName}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
