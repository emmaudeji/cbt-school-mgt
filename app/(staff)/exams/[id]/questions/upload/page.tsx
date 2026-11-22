
import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import { getQuestionEditorOptions } from "@/features/exams/services/queries"
import { QuestionImportProvider } from "@/features/exams/context/QuestionImportProvider"
import { UploadQuestions } from "@/features/exams/components/UploadQuestions"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    section_id?: string | string[]
  }>
}

export default function UploadQuestionsPage({
  params,
  searchParams,
}: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper
        params={params}
        searchParams={searchParams}
      />
    </Suspense>
  )
}

async function Wrapper({
  params,
  searchParams,
}: Props) {
  const [{ id: slug }, query] = await Promise.all([
    params,
    searchParams,
  ])

  const { exam, topics, sections } =
    await getQuestionEditorOptions(slug)

  const requestedSectionId =
    typeof query.section_id === "string"
      ? query.section_id
      : ""

  const initialSectionId = sections.some(
    section => section.id === requestedSectionId
  )
    ? requestedSectionId
    : sections.length === 1
      ? sections[0].id
      : ""

  return (
    <QuestionImportProvider examId={exam.id}>
      <UploadQuestions
        examId={exam.id}
        slug={exam.slug}
        title={exam.title}
        bankName={exam.bank?.name ?? "Not selected"}
        categoryName={exam.category?.name ?? "Not selected"}
        bankId={exam.default_bank_id ?? ""}
        categoryId={exam.default_category_id ?? ""}
        initialTopics={topics}
        initialSections={sections}
        initialSectionId={initialSectionId}
        editable={
          exam.status === "draft" ||
          exam.status === "active"
        }
      />
    </QuestionImportProvider>
  )
}
