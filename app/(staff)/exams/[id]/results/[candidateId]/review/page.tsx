import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpenCheck } from "lucide-react"

import { getStaffAttemptReview } from "@/features/results/services/staff-attempt-review"
import { StaffReviewReport } from "@/features/results/components/StaffReviewReport"
import "./print.css"
import { urls } from "@/constants"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string; candidateId: string }>
  searchParams: Promise<{ attempt?: string | string[] }>
}

export default async function StaffAttemptReviewPage({ params, searchParams }: Props) {
  console.log("=================")
  const [{ id, candidateId }, query] = await Promise.all([params, searchParams])
  
  const attemptId = typeof query.attempt === "string" ? query.attempt : ""
  if (!attemptId) notFound()
    
    const { exam, snapshot } = await getStaffAttemptReview(id, candidateId, attemptId)
    console.log("=================", { id, candidateId, attemptId: query.attempt }, )
  const back = urls.examCandidateResultDetails(id,candidateId,attemptId)

  return (
    <main className="mx-auto min-h-screen max-w-5xl w-full space-y-4 px-4 py-6">
      <div className="staff-review-toolbar flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <BookOpenCheck className="size-5" /> Question review
          </h1>
          <p className="text-sm text-muted-foreground">
            {snapshot.isSchool ? "Student" : "Candidate"} answers, marking and corrections · Attempt #{snapshot.attempt_number}
          </p>
        </div>
        <Link href={back} className="text-sm underline underline-offset-4">
          Back to performance
        </Link>
      </div>
      <StaffReviewReport
        examTitle={exam.title}
        snapshot={snapshot}
      />
    </main>
  )
}
