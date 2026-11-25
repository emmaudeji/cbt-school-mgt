import { notFound, redirect } from "next/navigation"

import { getPublicExamPlayer } from "@/features/exams/attempts/services/attempt-player"
import { getCurrentExamSession } from "@/features/exams/public/services/exam-entry-access"
import { ExamPlayer } from "@/features/exams/attempts/exam-player/ExamPlayer"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ code: string, attemptId: string }>
}

export default async function ExamAttemptPage({ params }: Props) {
  const { code: rawCode, attemptId } = await params
  const code = rawCode.toUpperCase()

  const session = await getCurrentExamSession(code)
  if (!session) redirect(`/take/${code}`)

  const player = await getPublicExamPlayer(code, attemptId)
  if (!player) notFound()

  return (
    <ExamPlayer
      code={code}
      attemptId={attemptId}
      candidateName={[session.first_name, session.last_name].filter(Boolean).join(" ")}
      data={player}
    />
  )
}
