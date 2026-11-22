import { Suspense } from "react"
import PageLoader from "@/components/common/PageLoader"
import { getResultsPage } from "@/features/results/services/results"
import { ResultsDashboard } from "@/features/results/components/ResultsDashboard"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    search?: string | string[]
    status?: string | string[]
    page?: string | string[]
  }>
}

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}

export default function ExamResultsPage(props: Props) {
  return <Suspense fallback={<PageLoader />}><ResultsContent {...props} /></Suspense>
}

async function ResultsContent({ params, searchParams }: Props) {
  const [{ id: slug }, query] = await Promise.all([params, searchParams])
  const page = Number(single(query.page) ?? "1")
  const results = await getResultsPage(slug, {
    search: single(query.search),
    status: single(query.status),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  })
  return <ResultsDashboard {...results} />
}
