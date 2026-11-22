
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  CheckCircle2,
  ShieldAlert,
} from "lucide-react"

import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

export default async function ActivateStudentAccountPage() {
  const db = await createClient()

  const { data: auth } = await db.auth.getUser()

  if (!auth.user) {
    redirect("/login")
  }

  const { data, error } = await db.rpc(
    "school_activate_my_student_membership"
  )

  if (error) {
    console.error(
      "[STUDENT:ACCOUNT_ACTIVATION]",
      error
    )
  }

  const success = !error

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <div className="w-full space-y-4 rounded-xl border p-6">
        {success ? (
          <CheckCircle2 className="size-9 text-emerald-600" />
        ) : (
          <ShieldAlert className="size-9 text-amber-600" />
        )}

        <h1 className="text-xl font-semibold">
          {success
            ? "Student Account Ready"
            : "Account Activation Unavailable"}
        </h1>

        <p className="text-sm leading-6 text-muted-foreground">
          {success
            ? "Your verified sign-in has been processed. You can now continue to your account."
            : "We could not activate your school membership. Confirm your email and contact your school administrator if the problem continues."}
        </p>

        {success && Number(data ?? 0) === 0 && (
          <p className="text-xs text-muted-foreground">
            No pending school invitation needed activation.
            Your existing membership status was not changed.
          </p>
        )}

        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Continue
        </Link>
      </div>
    </main>
  )
}
