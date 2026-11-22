import { Suspense } from "react"
import PageLoader from "@/components/common/PageLoader"
import { CandidatePerformanceReport } from "@/features/results/components/CandidatePerformanceReport"
import { getCandidatePerformance } from "@/features/results/services/candidate-performance"
import "./print.css"

type Props = {
  params: Promise<{ id: string; candidateId: string }>
  searchParams: Promise<{ attempt?: string | string[] }>
}

export default function CandidatePerformancePage(props: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PerformanceContent {...props} />
    </Suspense>
  )
}

async function PerformanceContent({ params, searchParams }: Props) {
  const [{ id: slug, candidateId }, query] = await Promise.all([params, searchParams])
  const result = await getCandidatePerformance(slug, candidateId)
  const requested = typeof query.attempt === "string" ? query.attempt : null
  const selected = result.data.attempts.find(a => a.attempt_id === requested)
    ?? result.data.attempts.find(a => a.result_id)
    ?? result.data.attempts[0]

  return <CandidatePerformanceReport {...result} selected={selected ?? null} />
}
