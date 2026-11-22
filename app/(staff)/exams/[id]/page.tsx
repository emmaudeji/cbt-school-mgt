
import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import { ExamQuestions } from "@/features/exams/components/ExamQuestions"
import { ExamQuestionEditingProvider } from "@/features/exams/context/ExamQuestionEditingProvider"
import {
  getExamCorrectAnswers,
  getExamQuestions,
  getOrganizationSectionTemplates,
} from "@/features/exams/services/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default function ExamPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper params={params} />
    </Suspense>
  )
}

async function Wrapper({ params }: Props) {
  const { id: slug } = await params

  const [result, sectionTemplates] = await Promise.all([
    getExamQuestions(slug),
    getOrganizationSectionTemplates(),
  ])

  const { exam, sections, questionCount, topics } = result

  const correctAnswers = await getExamCorrectAnswers(exam.id)

  return (
    <ExamQuestionEditingProvider
      slug={exam.slug}
      sections={sections.map(section => ({
        id: section.id,
        name: section.title,
      }))}
      topics={topics}
    >
      <ExamQuestions
        exam={exam}
        sections={sections}
        questionCount={questionCount}
        topics={topics}
        correctAnswers={correctAnswers}
        sectionTemplates={sectionTemplates}
      />
    </ExamQuestionEditingProvider>
  )
}
