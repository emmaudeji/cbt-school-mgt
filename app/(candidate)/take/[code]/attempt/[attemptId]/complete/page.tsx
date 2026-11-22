import Link from "next/link"
import { BookOpen, CheckCircle2, Clock3, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCandidateReviewSnapshot } from "@/features/exams/results/services/candidate-review-snapshot"
import { claimReviewReceiptAction } from "@/features/exams/results/services/claim-review-receipt-action"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ code: string, attemptId: string }>
  searchParams: Promise<{ receipt?: string }>
}

export default async function ExamCompletePage({ params, searchParams }: Props) {
  const { code: rawCode, attemptId } = await params
  const code = rawCode.toUpperCase()
  const { receipt } = await searchParams
  const snapshot = await getCandidateReviewSnapshot(code, attemptId)
  const result = snapshot?.result
  const percentage = result && result.total_max_points > 0
    ? (100 * result.awarded_points / result.total_max_points).toFixed(1)
    : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <Card className="w-full max-w-lg gap-0 py-0 shadow-none">
        <CardContent className="space-y-4 p-5 text-center sm:p-6">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            {result?.status === "expired"
              ? <Clock3 className="size-6 text-primary" />
              : <CheckCircle2 className="size-6 text-primary" />}
          </div>
          <h1 className="text-xl font-semibold">Examination completed</h1>
          <p className="text-sm text-muted-foreground">
            Your responses have been recorded. You can leave this page safely.
          </p>

          {snapshot?.result_enabled && result && (
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="rounded-xl border p-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {result.awarded_points} / {result.total_max_points}
                </p>
                <p className="text-xs text-muted-foreground">Your score</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {percentage ?? "—"}{percentage ? "%" : ""}
                </p>
                <p className="text-xs text-muted-foreground">Percentage</p>
              </div>
            </div>
          )}

          {snapshot?.review_ready && (
            <Button asChild className="w-full">
              <Link href={`/take/${code}/attempt/${attemptId}/review`}>
                <BookOpen className="size-4" /> Review my answers
              </Link>
            </Button>
          )}

          {snapshot?.review_enabled && !snapshot.review_ready && (
            <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Corrections will become available when the examination closes.
              Keep this browser's review receipt until then.
            </p>
          )}

          {!snapshot && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-center">
                <ShieldCheck className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your result may be awaiting manual grading, hidden by exam settings,
                or your temporary review receipt may be unavailable.
              </p>
              {receipt === "unavailable" && (
                <p role="alert" className="text-xs text-destructive">
                  Access could not be restored. Your examination session may have ended,
                  or the result has not been released. Contact your examiner if needed.
                </p>
              )}
              <form action={claimReviewReceiptAction.bind(null, code, attemptId)}>
                <Button type="submit" variant="outline" className="w-full">
                  Check result availability
                </Button>
              </form>
            </div>
          )}

          {snapshot && !snapshot.result_enabled && !snapshot.review_enabled && (
            <p className="text-sm text-muted-foreground">
              This examination does not release scores or corrections to candidates.
            </p>
          )}

          <p className="border-t pt-3 text-xs text-muted-foreground">
            Results and reviews follow the examination's published release settings.
            Review receipts expire automatically.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
