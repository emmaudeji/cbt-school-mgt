import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { getExamSyncResults } from "@/features/school-integration/services/exam-sync-results"
import { ExamSyncResults } from "@/features/school-integration/components/ExamSyncResults"
import { urls } from "@/constants"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export default async function SyncResultsPage({ params }: Props) {
  const { id: slug } = await params
  const result = await getExamSyncResults(slug)
  if (!result) {
    return (
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <Link href={urls.examAssessmentIntegration(slug)}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" /> Check Assessment Integration
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <h1 className="font-semibold">School score sync is unavailable</h1>
            <p className="mt-1 text-sm">Confirm that the examination belongs to a school, the sync SQL is installed, and your staff account has permission. See server logs for details.</p>
          </div>
        </div>
      </main>
    )
  }
  return <ExamSyncResults slug={slug} examTitle={result.exam.title} snapshot={result.snapshot} />
}
