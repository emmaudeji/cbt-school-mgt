
import { Suspense } from "react"
import { notFound } from "next/navigation"

import PageLoader from "@/components/common/PageLoader"
import { PageShell } from "@/components/layout/PageShell"
import { CandidateDirectory } from "@/features/candidates/components/CandidateDirectory"
import { getCandidateDirectory } from "@/features/candidates/services/directory-queries"
import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"

type Props = {
  searchParams: Promise<{
    exam?: string
    from?: string
  }>
}

export default function CandidateDirectoryPage({
  searchParams,
}: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper searchParams={searchParams} />
    </Suspense>
  )
}

async function Wrapper({ searchParams }: Props) {
  const params = await searchParams

  const examSlug =
    params.exam &&
    /^[a-zA-Z0-9_-]{1,200}$/.test(params.exam)
      ? params.exam
      : undefined

  const from =
    params.from &&
    /^\/exams\/[a-zA-Z0-9_-]+\/candidates$/.test(params.from)
      ? params.from
      : undefined

  let publicationId: string | undefined

  if (params.exam && !examSlug) {
    notFound()
  }

  if (examSlug) {
    const context = await getExamAssignmentContext(examSlug)

    if (!context.exam || !context.publication) {
      notFound()
    }

    // Only Exam Number mode supports this assignment action.
    if (context.accessMode !== "access_code") {
      return (
        <PageShell>
          <div className="mx-auto max-w-3xl space-y-3 rounded-xl border p-6">
            <h1 className="text-xl font-bold">
              Candidate assignment unavailable
            </h1>

            <p className="text-sm">
              This examination is not currently using
              individual Exam Numbers. Choose the appropriate
              access method in its examination settings.
            </p>
          </div>
        </PageShell>
      )
    }

    publicationId = context.publication.id
  }

  const initial = await getCandidateDirectory({
    search: "",
    status: "all",
    page: 1,
    publicationId,
  })

  const returnTo = examSlug
    ? `/exams/${encodeURIComponent(examSlug)}/candidates`
    : from

  return (
    <PageShell>
      <CandidateDirectory
        initial={initial}
        examSlug={examSlug}
        publicationId={publicationId}
        returnTo={returnTo}
      />
    </PageShell>
  )
}
