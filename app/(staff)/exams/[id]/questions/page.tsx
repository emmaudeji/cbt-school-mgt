
import Link from "next/link"
import { Suspense } from "react"
import {
  ArrowLeft,
  ClipboardPenLine,
  FileUp,
} from "lucide-react"

import PageLoader from "@/components/common/PageLoader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { NewQuestionForm } from
  "@/features/exams/components/NewQuestionForm"

import {
  getOrganizationSectionTemplates,
  getOrganizationTopicCatalog,
  getQuestionEditorOptions,
} from "@/features/exams/services/queries"

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

  const initialSectionId = sections.some(
    (section) => section.id === requestedSectionId
  )
    ? requestedSectionId
    : ""

  const uploadParams = new URLSearchParams({
    exam: exam.slug,
  })

  if (initialSectionId) {
    uploadParams.set(
      "section_id",
      initialSectionId
    )
  }

  const uploadUrl =
    `${urls.uploadExamQuestions(exam.slug)}` +
    `?${uploadParams.toString()}`

  const editable =
    exam.status === "draft" ||
    exam.status === "active"

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={urls.examDetails(exam.slug)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Exam Questions
        </Link>

        {editable && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/5 font-semibold shadow-none hover:bg-emerald-500/10"
          >
            <Link href={uploadUrl}>
              <FileUp className="size-4 text-emerald-600" />
              Upload Questions
            </Link>
          </Button>
        )}
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
            <ClipboardPenLine className="size-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold tracking-tight">
              Write Question
            </h1>

            <p className="break-words text-sm font-medium text-foreground/80">
              {exam.title}
            </p>
          </div>
        </div>

        <Badge
          className={
            exam.status === "draft"
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
              : exam.status === "active"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"
                : ""
          }
          variant={
            exam.status === "draft" ||
            exam.status === "active"
              ? "default"
              : "secondary"
          }
        >
          {exam.status === "draft"
            ? "Draft"
            : exam.status === "active"
              ? "Published"
              : exam.status}
        </Badge>
      </header>

      <NewQuestionForm
        exam={exam}
        initialTopics={topics}
        initialSections={sections}
        initialSectionId={initialSectionId}
        organizationTopics={organizationTopics}
        organizationSections={organizationSections}
      />
    </main>
  )
}
