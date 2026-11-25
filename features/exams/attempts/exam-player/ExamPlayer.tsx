"use client"

import type {
  ExamPlayerData,
} from "../services/attempt-player"
import { ExamPlayerHeader } from "./ExamPlayerHeader"
import { ExamPlayerNotices } from "./ExamPlayerNotices"
import { ExamQuestionCard } from "./ExamQuestionCard"
import { ExamQuestionNavigator } from "./ExamQuestionNavigator"
import { useExamPlayerController } from "./useExamPlayerController"

 

type Props = {
  code: string
  attemptId: string
  candidateName: string
  data: ExamPlayerData
}

export function ExamPlayer({
  code,
  attemptId,
  candidateName,
  data,
}: Props) {
  const player = useExamPlayerController({
    code,
    attemptId,
    data,
  })

  const {
    questions,
    current,
    currentIndex,
    drafts,
    remaining,
    summary,
    isActive,
    canSubmit,
    submitting,
    expiring,
    submissionError,
    correctionNotice,
  } = player

  return (
    <main className="min-h-screen bg-muted/20 px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-6xl space-y-3 sm:space-y-4">
        <ExamPlayerHeader
          candidateName={candidateName}
          attemptNumber={data.attempt_number}
          status={data.status}
          remaining={remaining}
          answered={summary.answered}
          totalQuestions={questions.length}
          unsaved={summary.unsaved}
          saveErrors={summary.errors}
        />

        <ExamPlayerNotices
          isActive={isActive}
          status={data.status}
          remaining={remaining}
          expiring={expiring}
          submitting={submitting}
          submissionError={submissionError}
          correctionNotice={correctionNotice}
          onDismissCorrection={
            player.dismissCorrectionNotice
          }
          onRetryExpiry={player.retryExpiry}
          onViewCompletion={player.viewCompletion}
        />

        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-4">
          <section
            aria-label="Examination question"
            className="order-2 min-w-0 lg:order-1"
          >
            <ExamQuestionCard
              question={current}
              draft={
                current
                  ? drafts[current.id] ?? null
                  : null
              }
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              isActive={isActive}
              submitting={submitting}
              onUpdate={player.updateDraft}
              onToggle={player.toggleOption}
              onRetrySave={player.retrySave}
              onNavigate={player.setCurrentIndex}
            />
          </section>

          <aside
            aria-label="Examination navigation"
            className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-4"
          >
            <ExamQuestionNavigator
              questions={questions}
              drafts={drafts}
              currentIndex={currentIndex}
              isActive={isActive}
              canSubmit={canSubmit}
              submitting={submitting}
              answered={summary.answered}
              unsaved={summary.unsaved}
              errors={summary.errors}
              submissionError={submissionError}
              onNavigate={player.setCurrentIndex}
              onSubmit={player.submitExamination}
            />
          </aside>
        </div>

        <footer className="pb-3 text-center text-[11px] leading-5 text-muted-foreground">
          Answers are saved automatically while your
          examination is active. Only answers saved
          before the deadline are graded.
        </footer>
      </div>
    </main>
  )
}