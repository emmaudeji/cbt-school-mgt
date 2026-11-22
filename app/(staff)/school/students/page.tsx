
 

 
import { StudentDirectoryByEnrollment } from "@/features/school-students/components/StudentDirectoryByEnrollment"
import {
  getStudentDirectoryData,
} from "@/features/school-students/services/directory-queries"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{
    session?: string
    class?: string
    term?: string
    search?: string
    page?: string
  }>
}

export default async function SchoolStudentsPage({
  searchParams,
}: Props) {
  const filters = await searchParams

  const data = await getStudentDirectoryData(
    filters
  )

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h1 className="font-semibold">
            Student Directory Unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Student records could not be loaded.
            Please check your school access
            and try again.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <StudentDirectoryByEnrollment data={data} />
    </main>
  )
}
