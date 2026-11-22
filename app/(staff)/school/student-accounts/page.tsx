
import {
  StudentAccountsWorkspace,
} from "@/features/school-student-accounts/components/StudentAccountsWorkspace"

import {
  getStudentAccountData,
} from "@/features/school-student-accounts/services/queries"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{
    session?: string
    class?: string
    search?: string
    page?: string
  }>
}

export default async function StudentAccountsPage({
  searchParams,
}: Props) {
  const filters = await searchParams

  const data = await getStudentAccountData(filters)

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h1 className="font-semibold">
            Student accounts unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Unable to load student accounts.
            Please check your school access.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <StudentAccountsWorkspace data={data} />
    </main>
  )
}
