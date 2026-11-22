import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpenCheck } from "lucide-react"

import { ExamReview } from "@/features/exams/results/components/ExamReview"
import { getCandidateReviewSnapshot } from "@/features/exams/results/services/candidate-review-snapshot"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ code: string, attemptId: string }> }

export default async function ExamReviewPage({ params }: Props) {
  const { code: rawCode, attemptId } = await params
  const code = rawCode.toUpperCase()
  const snapshot = await getCandidateReviewSnapshot(code, attemptId, true)
  if (!snapshot) notFound()

  const back = `/take/${code}/attempt/${attemptId}/complete`

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <BookOpenCheck className="size-5" /> My examination review
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore your answers, see the corrections and learn at your own pace.
          </p>
        </div>
        <Link href={back} className="text-sm underline underline-offset-4">
          Back to my result
        </Link>
      </div>
      {snapshot.review_ready ? (
        <ExamReview questions={snapshot.questions} />
      ) : (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          Corrections have not been released for this examination yet.
        </div>
      )}
    </main>
  )
}
