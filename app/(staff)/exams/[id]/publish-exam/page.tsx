
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"

import { urls } from "@/constants"
import PageLoader from "@/components/common/PageLoader"
import { ExamPublishPanel } from "@/features/exams/components/publish/ExamPublishPanel"
import {
  getExamSettings,
  getExamPublicationOverview,
  getSchoolExamSummary,
} from "@/features/exams/services/queries"
 
type Props = { params: Promise<{ id: string }> }

export default function ExamPublishPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper params={params} />
    </Suspense>
  )
}

async function Wrapper({ params }: Props) {
  const { id: slug } = await params
  const exam = await getExamSettings(slug)

  const [overview, schoolSummary] = await Promise.all([
    getExamPublicationOverview(exam.id),
    getSchoolExamSummary(exam.id),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-8">
      <Link
        href={urls.examSettings(exam.slug)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Examination Settings
      </Link>

      <ExamPublishPanel
        exam={exam}
        overview={overview}
        schoolSummary={schoolSummary}
      />
    </main>
  )
}
