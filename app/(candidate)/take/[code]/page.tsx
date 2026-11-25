
import { notFound, redirect } from "next/navigation"

 

import {
  getExamEntryPreview,
  getCurrentExamSession,
  normalizeExamEntryCode,
} from "@/features/exams/public/services/exam-entry-access"
import { ExamEntryScreen } from "@/features/exams/attempts/components/ExamEntryScreen"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ code: string }>
}

export default async function TakeExamPage({ params }: Props) {
  // 1. Resolve the shared examination entry code.
  const { code: rawCode } = await params
  const code = normalizeExamEntryCode(rawCode)

  const exam = await getExamEntryPreview(code)

  if (
    !exam.found ||
    !exam.publication_id ||
    !exam.mode ||
    !exam.available_from ||
    !exam.available_until
  ) {
    notFound()
  }

  // 2. Reuse an existing authorized candidate session.
  // This is shared by registered, Exam Number and public entry.
  const session = await getCurrentExamSession(code)

  if (session) {
    redirect(`/take/${encodeURIComponent(code)}/ready`)
  }

  // 3. Determine exam availability for presentation.
  // The database also checks availability during authorization.
  const now = Date.now()
  const opensAt = Date.parse(exam.available_from)
  const closesAt = Date.parse(exam.available_until)

  if (
    !Number.isFinite(opensAt) ||
    !Number.isFinite(closesAt) ||
    closesAt <= opensAt
  ) {
    notFound()
  }

  const status =
    now < opensAt
      ? "upcoming"
      : now >= closesAt
        ? "closed"
        : "open"

  return (
    <ExamEntryScreen
      code={code}
      exam={exam}
      status={status}
    />
  )
}
 