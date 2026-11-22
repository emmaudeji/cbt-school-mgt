
import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import { ExamPublishPanel } from "@/features/exams/components/publish/ExamPublishPanel"
import {
  getExamSettings,
  getExamPublicationOverview,
} from "@/features/exams/services/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default function ExamSettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper params={params} />
    </Suspense>
  )
}

async function Wrapper({ params }: Props) {
  const { id: slug } = await params

  const exam = await getExamSettings(slug)
  const overview = await getExamPublicationOverview(exam.id)

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6">
      <ExamPublishPanel
        exam={exam}
        overview={overview}
      />
    </div>
  )
}
