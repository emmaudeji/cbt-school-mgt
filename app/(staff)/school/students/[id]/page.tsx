
import { notFound } from "next/navigation"
import Link from "next/link"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  StudentProfile,
} from "@/features/school-students/components/StudentProfile"

import {
  getStudentProfileData,
} from "@/features/school-students/services/student-profile-queries"
import { LinkButton } from "@/components/shared/LinkButton"
import { PageShell } from "@/components/layout/PageShell"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function StudentProfilePage({
  params,
}: Props) {
  const { id } = await params

  const data = await getStudentProfileData(id)

  if (!data) {
    notFound()
  }

  return (
    <PageShell>
      
      <StudentProfile data={data} />
    </PageShell>
  )
}
