
import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import { ExamSettingsForm } from "@/features/exams/components/ExamSettingsForm"
import { ExamPublishPanel } from "@/features/exams/components/publish/ExamPublishPanel"

import {
  getExamSettings,
  getExamPublicationOverview,
  getExamResultSettings,
} from "@/features/exams/services/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default function ExamSettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamSettingsContent params={params} />
    </Suspense>
  )
}

async function ExamSettingsContent({ params }: Props) {
  const { id: slug } = await params

  const exam = await getExamSettings(slug)

  const [overview, resultSettings] = await Promise.all([
    getExamPublicationOverview(exam.id),
    getExamResultSettings(exam.id),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-8">
      <ExamSettingsForm
        exam={exam}
        resultSettings={resultSettings}
      />

      <div className="rounded-xl border border-sky-300 bg-sky-50/50 p-1 dark:border-sky-800 dark:bg-sky-950/20">
        <ExamPublishPanel
          exam={exam}
          overview={overview}
        />
      </div>
    </main>
  )
}
