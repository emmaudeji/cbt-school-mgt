import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"
import { SchoolAssessmentIntegration } from "@/features/school-integration/components/SchoolAssessmentIntegration"
import { urls } from "@/constants"
import { getSchoolAssessmentIntegrationOverview } from "@/features/school-integration/services/actions"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export default async function AssessmentIntegrationPage({ params }: Props) {
  const { id: slug } = await params

  const overview = await getSchoolAssessmentIntegrationOverview(slug)

if (!overview) {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      School assessment integration is currently unavailable.
    </div>
  )
}

const { exam, data } = overview

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 ">

      <SchoolAssessmentIntegration slug={slug} overview={data} exam={exam}/>
    </main>
  )
}
