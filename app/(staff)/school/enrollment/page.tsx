
import {
  EnrollmentWorkspace,
} from "@/features/school-enrollment/components/EnrollmentWorkspace"

import {
  getEnrollmentWorkspaceData,
} from "@/features/school-enrollment/services/queries"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{
    session?: string
    class?: string

    sourceSession?: string
    sourceClass?: string

    rosterSearch?: string
    candidateSearch?: string
    search?: string

    page?: string
    candidatePage?: string
  }>
}

export default async function SchoolEnrollmentPage({
  searchParams,
}: Props) {
  const filters = await searchParams

  const data = await getEnrollmentWorkspaceData(
    filters
  )

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h1 className="font-semibold">
            Student enrollment unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your school's enrollment information
            could not be loaded. Please check
            your access and try again.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
      <EnrollmentWorkspace data={data} />
    </main>
  )
}
