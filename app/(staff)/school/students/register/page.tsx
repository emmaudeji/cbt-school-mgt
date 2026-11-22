
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PageShell } from "@/components/layout/PageShell"
import { LinkButton } from "@/components/shared/LinkButton"
import { urls } from "@/constants"

import StudentRegistrationWorkspace from "@/features/school-students/components/StudentRegistrationWorkspace"
import { getStudentRegistrationEditData } from "@/features/school-students/services/student-edit-queries"

 

type Props = {
  searchParams: Promise<{
    edit?: string
  }>
}

export default async function StudentRegistrationPage({
  searchParams,
}: Props) {
  const { edit } = await searchParams
  const isEditing = Boolean(edit)

  const editData = edit
    ? await getStudentRegistrationEditData(edit)
    : null

  if (isEditing && !editData) {
    notFound()
  }

  const backUrl = editData
    ? urls.studentDetails(editData.studentId)
    : urls.students

  return (
    <PageShell className="max-w-5xl">
      <div className="space-y-5 pb-8">
        <div className="space-y-3">
          <LinkButton
            href={backUrl}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="size-4" />
            {editData
              ? "Student Profile"
              : "Students"}
          </LinkButton>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {editData
                ? "Edit Admission Details"
                : "Student Registration"}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {editData
                ? `Update the registered information for ${editData.studentName}.`
                : "Register a new student or upload multiple student records in one operation."}
            </p>
          </div>
        </div>

        <StudentRegistrationWorkspace
          editData={editData ?? undefined}
        />
      </div>
    </PageShell>
  )
}
