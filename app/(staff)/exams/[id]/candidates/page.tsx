import { Suspense } from "react"
import PageLoader from "@/components/common/PageLoader"
 import { ExamCandidateFilter } from "@/features/exams/services/exam-candidate-roster"
import { getExamCandidatesPage } from "@/features/exams/services/queries.exam-candidate-page"
import { ExamCandidates } from "@/features/exams/components/ExamCandidates"
import { ExamCandidateList } from "@/features/exams/components/ExamCandidateList"
 

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}

const filters: ExamCandidateFilter[] = [
  "all", "not_started", "in_progress", "submitted", "closed", "revoked",
]

export default function ExamCandidatesPage(props: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper {...props} />
    </Suspense>
  )
}

async function Wrapper({ params, searchParams }: Props) {
  const [{ id: slug }, query] = await Promise.all([params, searchParams])
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1)
  const filter = filters.includes(query.status as ExamCandidateFilter)
    ? query.status as ExamCandidateFilter
    : "all"
  const search = (query.q ?? "").trim().slice(0, 120)

  const { data, roster } = await getExamCandidatesPage(slug, {
    page,
    filter,
    search,
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-10 sm:px-5">
      <ExamCandidates
        data={data}
        stats={roster.stats}

        isSchool={true}
        candidateList={
          <ExamCandidateList
            roster={roster}
            search={search}
            filter={filter}
          />
        }
      />
    </div>
  )
}
