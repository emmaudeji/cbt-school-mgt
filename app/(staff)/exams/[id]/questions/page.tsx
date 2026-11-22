
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"

import PageLoader from "@/components/common/PageLoader"
import { NewQuestionForm } from "@/features/exams/components/NewQuestionForm"
import {
  getOrganizationSectionTemplates,
  getOrganizationTopicCatalog,
  getQuestionEditorOptions,
} from "@/features/exams/services/queries"
import { LinkButton } from "@/components/shared/LinkButton"
import { urls } from "@/constants"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    section_id?: string | string[]
    exam?: string | string[]
  }>
}

export default function NewQuestionPage({
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

  const [
    editorOptions,
    organizationTopics,
    organizationSections,
  ] = await Promise.all([
    getQuestionEditorOptions(slug),
    getOrganizationTopicCatalog(),
    getOrganizationSectionTemplates(),
  ])

  const { exam, topics, sections } = editorOptions

  const requestedSectionId =
    typeof query.section_id === "string"
      ? query.section_id
      : ""

  // Only preselect a section belonging to this exam.
  const initialSectionId = sections.some(
    section => section.id === requestedSectionId
  )
    ? requestedSectionId
    : ""

  const uploadParams = new URLSearchParams({
    exam: exam.slug,
  })

  if (initialSectionId) {
    uploadParams.set("section_id", initialSectionId)
  }

  const uploadUrl =
    `${urls.uploadExamQuestions(exam.slug)}?${uploadParams.toString()}`

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link
            href={urls.examQuestions(exam.slug)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Test Questions
          </Link>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              Write Question
            </h1>

            <p className="text-sm text-foreground/80">
              Add a question to {exam.title}.
            </p>
          </div>
        </div>

        <LinkButton href={uploadUrl}>
          Upload Questions
        </LinkButton>
      </header>

      <NewQuestionForm
        exam={exam}
        initialTopics={topics}
        initialSections={sections}
        initialSectionId={initialSectionId}
        organizationTopics={organizationTopics}
        organizationSections={organizationSections}
      />
    </div>
  )
}
