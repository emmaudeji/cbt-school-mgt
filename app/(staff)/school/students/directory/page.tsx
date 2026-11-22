
import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import ErrorState from "@/components/common/ErrorState"
import { PageShell } from "@/components/layout/PageShell"
import { getStudentDirectory, StudentStatusFilter } from "@/features/school-students/services/student-queries"
 
import StudentDirectoryByAdmissions from "@/features/school-students/components/StudentDirectoryByAdmissions"

type Props = {
  searchParams: Promise<{
    q?: string
    status?: string
    page?: string
  }>
}

const statuses: StudentStatusFilter[] = [
  "all",
  "active",
  "inactive",
  "graduated",
  "transferred",
]

export default function StudentsPage({ searchParams }: Props) {
  return (
    <PageShell className="max-w-4xl">
      <Suspense fallback={<PageLoader text="Loading students..." />}>
        <Wrapper searchParams={searchParams} />
      </Suspense>
    </PageShell>
  )
}

async function Wrapper({ searchParams }: Props) {
  const params = await searchParams

  const status: StudentStatusFilter = statuses.includes(
    params.status as StudentStatusFilter
  )
    ? (params.status as StudentStatusFilter)
    : "all"

  const search = params.q ?? ""

  try {
    const directory = await getStudentDirectory({
      q: search,
      status,
      page: Number(params.page ?? 1),
    })

    return (
      <StudentDirectoryByAdmissions
        directory={directory}
        search={search}
        status={status}
      />
    )
  } catch (error) {
    return (
      <ErrorState
        header="Unable to load students"
        text={
          error instanceof Error
            ? error.message
            : "Student records are currently unavailable."
        }
      />
    )
  }
}
