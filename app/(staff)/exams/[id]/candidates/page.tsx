
import { Suspense } from "react"
import PageLoader from "@/components/common/PageLoader"
import { ExamCandidates } from "@/features/exams/components/ExamCandidates"
import { ExamCandidateList } from "@/features/exams/components/ExamCandidateList"

import type {
  ExamCandidateFilter,
} from "@/features/exams/services/exam-candidate-roster"

import { getExamCandidatesPage } from "@/features/exams/services/queries.exam-candidate-page"
import { getSchoolExamSummary } from "@/features/exams/services/queries"
import { CompleteSchoolAssignments } from "@/features/exams/components/ExamCompleteSchoolAssignments"
// import { SchoolAssignmentAttention } from "@/features/exams/components/school/SchoolAssignmentAttention"
import { SchoolAssignmentPanel } from "@/features/exams/components/school/SchoolAssignmentPanel"
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    page?: string
    status?: string
    q?: string
  }>
}

const filters: ExamCandidateFilter[] = [
  "all",
  "not_started",
  "in_progress",
  "submitted",
  "closed",
  "revoked",
]

export default function ExamCandidatesPage(props: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper {...props} />
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

  const page = Math.max(
    1,
    Number.parseInt(query.page ?? "1", 10) || 1
  )

  const filter = filters.includes(
    query.status as ExamCandidateFilter
  )
    ? query.status as ExamCandidateFilter
    : "all"

  const search = (query.q ?? "").trim().slice(0, 120)

  const { data, roster } = await getExamCandidatesPage(
    slug,
    { page, filter, search }
  )
 
  const schoolSummary = await getSchoolExamSummary(data.exam.id)
  const isSchoolExam = schoolSummary !== null
  const publication = data.publication

  const canAssignSchool =
    isSchoolExam &&
    publication !== null &&
    (
      data.accessMode === "registered" ||
      data.accessMode === "access_code"
    )

  const candidatesUrl = `/exams/${encodeURIComponent(data.exam.slug)}/candidates`

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-10 sm:px-5">
     {canAssignSchool && publication && (
      <SchoolAssignmentPanel
            examId={data.exam.id}
            slug={data.exam.slug}
            publicationId={publication.id}
            accessMode={data.accessMode as "registered" | "access_code"}
          />
        )}

      <ExamCandidates
        data={data}
        stats={roster.stats}
        schoolSummary={schoolSummary}
        candidateList={
          <>
          <ExamCandidateList
            roster={roster}
            search={search}
            filter={filter}
            isSchoolExam={isSchoolExam}
            accessMode={data.accessMode as "registered" | "access_code" | "open_link" | null}
            assignmentUrl={`${candidatesUrl}/assign`}
            />
   
            </>
        }
      />
    </main>
  )
}






// import { Suspense } from "react"

// import PageLoader from "@/components/common/PageLoader"
// import { ExamCandidates } from "@/features/exams/components/ExamCandidates"
// import { ExamCandidateList } from "@/features/exams/components/ExamCandidateList"

// import type { ExamCandidateFilter } from "@/features/exams/services/exam-candidate-roster"
// import { getExamCandidatesPage } from "@/features/exams/services/queries.exam-candidate-page"
// import { getSchoolExamSummary } from "@/features/exams/services/queries"

// type Props = {
//   params: Promise<{ id: string }>
//   searchParams: Promise<{
//     page?: string
//     status?: string
//     q?: string
//   }>
// }

// const filters: ExamCandidateFilter[] = [
//   "all", "not_started", "in_progress",
//   "submitted", "closed", "revoked",
// ]

// export default function ExamCandidatesPage(props: Props) {
//   return (
//     <Suspense fallback={<PageLoader />}>
//       <Wrapper {...props} />
//     </Suspense>
//   )
// }

// async function Wrapper({ params, searchParams }: Props) {
//   const [{ id: slug }, query] = await Promise.all([params, searchParams])
//   const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1)
//   const filter = filters.includes(query.status as ExamCandidateFilter)
//     ? query.status as ExamCandidateFilter : "all"
//   const search = (query.q ?? "").trim().slice(0, 120)

//   const { data, roster } = await getExamCandidatesPage(slug, {
//     page, filter, search,
//   })

//   const schoolSummary = await getSchoolExamSummary(data.exam.id)
//   const isSchoolExam = schoolSummary !== null

//   return (
//     <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-10 sm:px-5">
//       <ExamCandidates
//         data={data}
//         stats={roster.stats}
//         schoolSummary={schoolSummary}
//         candidateList={
//           <ExamCandidateList
//             roster={roster}
//             search={search}
//             filter={filter}
//             isSchoolExam={isSchoolExam}
//           />
//         }
//       />
//     </main>
//   )
// }
