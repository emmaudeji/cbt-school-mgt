"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExamReview } from "@/features/exams/results/components/ExamReview"
import type { StaffAttemptReview, StaffReviewQuestion } from "../services/staff-attempt-review"

function printedDate(value: string | null) {
  return value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"
}

function answerStatus(question: StaffReviewQuestion) {
  if (question.awarded_points === null) return "Pending grading"
  if (question.awarded_points === question.max_points) return "Full marks"
  return question.awarded_points > 0 ? "Partial marks" : "No marks"
}

export function StaffReviewReport({
  examTitle,
  snapshot,
}: {
  examTitle: string
  snapshot: StaffAttemptReview
}) {
  const [showKeys, setShowKeys] = useState(true)
  const name = [snapshot.candidate.first_name, snapshot.candidate.last_name].filter(Boolean).join(" ")
  const points = snapshot.result
    ? `${snapshot.result.earned_points} / ${snapshot.result.total_points}`
    : "Not finalized"

  const questions = snapshot.questions.map(q => showKeys ? q : ({
    ...q,
    options: q.options.map(opt => ({ ...opt, correct: false })),
    explanation: null,
  }))

  return (
    <>
      <div className="staff-review-toolbar flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div className="text-sm">
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">
            {snapshot.candidate.candidate_code ?? "No candidate code"} · {snapshot.questions.length} questions · {points} marks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showKeys} onChange={e => setShowKeys(e.target.checked)} />
            Show correct answers
          </label>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>
      {!snapshot.result && (
        <p className="staff-review-toolbar rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          Official result is not finalized. Any displayed question marks are provisional; ungraded written answers remain pending.
        </p>
      )}
      <div className="staff-review-interactive">
        <ExamReview questions={questions} audience="staff" />
      </div>
      <div className="staff-review-print hidden">
        <header className="mb-5 border-b-2 border-black pb-3">
          <h1 className="text-xl font-bold">{examTitle}</h1>
          <p className="text-sm font-semibold">Examination question review</p>
          <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
            <p><strong>{snapshot.isSchool ? "Student" : "Candidate"}:</strong> {name}</p>
            <p><strong>Code:</strong> {snapshot.candidate.candidate_code ?? "—"}</p>
            <p><strong>Attempt:</strong> #{snapshot.attempt_number}</p>
            <p><strong>Revision:</strong> {snapshot.revision}</p>
            <p><strong>Submitted:</strong> {printedDate(snapshot.submitted_at ?? snapshot.closed_at)}</p>
            <p><strong>Result:</strong> {points}</p>
          </div>
          {!snapshot.result && <p className="mt-2 font-semibold">PROVISIONAL — NOT FINALIZED</p>}
        </header>
        {questions.map(question => (
          <section key={question.id} className="staff-review-print-question mb-4 break-inside-avoid border-b pb-3 text-sm">
            <div className="mb-1 flex justify-between gap-4 font-semibold">
              <span>Question {question.number}{question.section ? ` · ${question.section}` : ""}</span>
              <span>{question.awarded_points ?? "Pending"} / {question.max_points}</span>
            </div>
            <p className="mb-2 whitespace-pre-wrap">{question.prompt}</p>
            {question.type === "free_text" ? (
              <div className="rounded border p-2">
                <strong>Submitted answer:</strong>
                <p className="whitespace-pre-wrap">{question.answer_text || "No response"}</p>
              </div>
            ) : (
              <ol className="space-y-1">
                {question.options.map(o => (
                  <li key={o.id} className="flex gap-2">
                    <span className="w-6 shrink-0">{o.number}.</span>
                    <span className="flex-1">{o.text}</span>
                    {o.selected && <span className="font-semibold">Selected</span>}
                    {showKeys && o.correct && <span className="font-semibold">Correct</span>}
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-xs">{answerStatus(question)}</p>
            {showKeys && question.explanation && (
              <p className="mt-2 border-l-2 pl-2"><strong>Explanation:</strong> {question.explanation}</p>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
