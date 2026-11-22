import { Suspense } from "react"

import PageLoader from "@/components/common/PageLoader"
import { ExaminationsHub } from "@/features/exams/components/ExaminationsHub"
import { getOrganizationExamIndex } from "@/features/exams/services/exam-index-query"
import { PageShell } from "@/components/layout/PageShell"

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default function ExaminationsPage({ searchParams }: Props) {
  return (
    <PageShell>

    <Suspense fallback={<PageLoader />}>
      <ExaminationsContent searchParams={searchParams} />
    </Suspense>
    </PageShell>
  )
}

async function ExaminationsContent({ searchParams }: Props) {
  const params = await searchParams
  const result = await getOrganizationExamIndex({
    query: params.q,
    status: params.status,
    page: Number(params.page ?? 1),
  })

  return <ExaminationsHub result={result} />
}
