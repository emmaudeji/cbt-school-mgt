
import { Suspense } from "react"
import { notFound } from "next/navigation"

import PageLoader from "@/components/common/PageLoader"
import { PageShell } from "@/components/layout/PageShell"
import { CandidateBulkImport } from "@/features/candidates/components/import/CandidateBulkImport"
import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"

type Props = {
  searchParams: Promise<{ exam?: string }>
}

export default function CandidateImportPage({
  searchParams,
}: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ImportPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ImportPageContent({
  searchParams,
}: Props) {
  const { exam } = await searchParams

  if (!exam) {
    return (
      <PageShell>
        <CandidateBulkImport />
      </PageShell>
    )
  }

  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(exam)) {
    notFound()
  }

  const context = await getExamAssignmentContext(exam)

  if (!context.exam || !context.publication) {
    notFound()
  }

  if (context.accessMode !== "access_code") {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl rounded-xl border p-5">
          <h1 className="text-lg font-bold">
            Exam assignment unavailable
          </h1>
          <p className="mt-2 text-sm">
            This examination is not currently using
            individual Exam Numbers.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <CandidateBulkImport
        examSlug={context.exam.slug}
        examTitle={context.exam.title}
      />
    </PageShell>
  )
}
