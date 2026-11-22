"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ReviewQuestion } from "../services/candidate-review-snapshot"

type Filter = "all" | "correct" | "improve" | "unanswered"

function hasAnswer(q: ReviewQuestion) {
  return q.type === "free_text"
    ? Boolean(q.answer_text.trim())
    : q.options.some(option => option.selected)
}

function isCorrect(q: ReviewQuestion) {
  return hasAnswer(q) && q.awarded_points !== null && q.awarded_points === q.max_points
}

export function ExamReview({
  questions,
  audience = "candidate",
}: {
  questions: ReviewQuestion[]
  audience?: "candidate" | "staff"
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [activeId, setActiveId] = useState(questions[0]?.id ?? "")
  const isStaff = audience === "staff"

  const filtered = useMemo(() => questions.filter(q => {
    if (filter === "unanswered") return !hasAnswer(q)
    if (filter === "correct") return isCorrect(q)
    if (filter === "improve") return hasAnswer(q) && !isCorrect(q)
    return true
  }), [filter, questions])

  const index = Math.max(0, filtered.findIndex(q => q.id === activeId))
  const current = filtered[index]
  const answered = questions.filter(hasAnswer).length
  const correct = questions.filter(isCorrect).length
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: `All ${questions.length}` },
    { id: "correct", label: `Correct ${correct}` },
    { id: "improve", label: `Needs work ${answered - correct}` },
    { id: "unanswered", label: `Skipped ${questions.length - answered}` },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <Button key={tab.id} type="button" size="sm"
            variant={filter === tab.id ? "default" : "outline"}
            onClick={() => {
              const first = questions.find(q => {
                if (tab.id === "unanswered") return !hasAnswer(q)
                if (tab.id === "correct") return isCorrect(q)
                if (tab.id === "improve") return hasAnswer(q) && !isCorrect(q)
                return true
              })
              setFilter(tab.id)
              setActiveId(first?.id ?? "")
            }}>
            {tab.label}
          </Button>
        ))}
      </div>

      {!current ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No questions in this group.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Question {current.number}</h2>
                <Badge variant="outline">
                  {current.awarded_points ?? "Pending"} / {current.max_points} points
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">{current.prompt}</p>
              {current.type === "free_text" ? (
                <div className="space-y-1 rounded-lg border p-3 text-sm">
                  <p className="font-medium">{isStaff ? "Submitted response" : "Your response"}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {current.answer_text || "No response"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {current.options.map(option => (
                    <div key={option.id} className={[
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                      option.correct ? "border-emerald-500/50 bg-emerald-500/5" :
                        option.selected ? "border-destructive/40 bg-destructive/5" : "",
                    ].join(" ")}>
                      {option.correct
                        ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        : option.selected
                          ? <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                          : <span className="mt-1 size-3 shrink-0 rounded-full border" />}
                      <span className="min-w-0 flex-1">{option.text}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.correct && option.selected
                          ? `${isStaff ? "Candidate's answer" : "Your answer"} · Correct`
                          : option.correct ? "Correct answer"
                          : option.selected ? isStaff ? "Candidate's answer" : "Your answer" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {current.explanation && (
                <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Why this is the answer</p>
                  <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                    {current.explanation}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-4">
                <Button type="button" variant="outline" size="sm" disabled={index === 0}
                  onClick={() => setActiveId(filtered[index - 1].id)}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">{index + 1} of {filtered.length}</span>
                <Button type="button" variant="outline" size="sm"
                  disabled={index === filtered.length - 1}
                  onClick={() => setActiveId(filtered[index + 1].id)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <aside className="h-fit rounded-lg border p-3">
            <p className="mb-3 text-sm font-medium">Jump to question</p>
            <div className="grid grid-cols-6 gap-2 lg:grid-cols-4">
              {filtered.map(q => (
                <Button key={q.id} type="button" size="sm"
                  variant={q.id === current.id ? "default" : "outline"}
                  className="h-9 px-0" onClick={() => setActiveId(q.id)}>
                  {q.number}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Read-only review. {isStaff ? "Submitted answers cannot be changed here." : "Your submitted answers cannot be changed."}
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}









// "use client"

// import { useMemo, useState } from "react"
// import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import type { ReviewQuestion } from "../services/candidate-review-snapshot"

// type Filter = "all" | "correct" | "improve" | "unanswered"

// function hasAnswer(q: ReviewQuestion) {
//   return q.type === "free_text"
//     ? Boolean(q.answer_text.trim())
//     : q.options.some((option) => option.selected)
// }

// function isCorrect(q: ReviewQuestion) {
//   return hasAnswer(q) && q.awarded_points !== null && q.awarded_points === q.max_points
// }

// export function ExamReview({ questions }: { questions: ReviewQuestion[] }) {
//   const [filter, setFilter] = useState<Filter>("all")
//   const [activeId, setActiveId] = useState(questions[0]?.id ?? "")

//   const filtered = useMemo(() => questions.filter((q) => {
//     if (filter === "unanswered") return !hasAnswer(q)
//     if (filter === "correct") return isCorrect(q)
//     if (filter === "improve") return hasAnswer(q) && !isCorrect(q)
//     return true
//   }), [filter, questions])

//   const index = Math.max(0, filtered.findIndex((q) => q.id === activeId))
//   const current = filtered[index]
//   const answered = questions.filter(hasAnswer).length
//   const correct = questions.filter(isCorrect).length

//   const tabs: { id: Filter, label: string }[] = [
//     { id: "all", label: `All ${questions.length}` },
//     { id: "correct", label: `Correct ${correct}` },
//     { id: "improve", label: `Needs work ${answered - correct}` },
//     { id: "unanswered", label: `Skipped ${questions.length - answered}` },
//   ]

//   return (
//     <div className="space-y-3">
//       <div className="flex flex-wrap gap-2">
//         {tabs.map((tab) => (
//           <Button
//             key={tab.id}
//             type="button"
//             size="sm"
//             variant={filter === tab.id ? "default" : "outline"}
//             onClick={() => {
//               const first = questions.find((q) => {
//                 if (tab.id === "unanswered") return !hasAnswer(q)
//                 if (tab.id === "correct") return isCorrect(q)
//                 if (tab.id === "improve") return hasAnswer(q) && !isCorrect(q)
//                 return true
//               })
//               setFilter(tab.id)
//               setActiveId(first?.id ?? "")
//             }}
//           >
//             {tab.label}
//           </Button>
//         ))}
//       </div>

//       {!current ? (
//         <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
//           No questions in this group.
//         </div>
//       ) : (
//         <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
//           <Card className="gap-0 py-0 shadow-none">
//             <CardContent className="space-y-4 p-4 sm:p-5">
//               <div className="flex flex-wrap items-center justify-between gap-2">
//                 <h2 className="font-semibold">Question {current.number}</h2>
//                 <Badge variant="outline">
//                   {current.awarded_points ?? "—"} / {current.max_points} points
//                 </Badge>
//               </div>
//               <p className="whitespace-pre-wrap text-sm leading-6">{current.prompt}</p>

//               {current.type === "free_text" ? (
//                 <div className="space-y-1 rounded-lg border p-3 text-sm">
//                   <p className="font-medium">Your response</p>
//                   <p className="whitespace-pre-wrap text-muted-foreground">
//                     {current.answer_text || "No response"}
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {current.options.map((option) => (
//                     <div
//                       key={option.id}
//                       className={[
//                         "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
//                         option.correct ? "border-emerald-500/50 bg-emerald-500/5" :
//                           option.selected ? "border-destructive/40 bg-destructive/5" : "",
//                       ].join(" ")}
//                     >
//                       {option.correct
//                         ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
//                         : option.selected
//                           ? <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
//                           : <span className="mt-1 size-3 shrink-0 rounded-full border" />}
//                       <span className="min-w-0 flex-1">{option.text}</span>
//                       <span className="text-xs text-muted-foreground">
//                         {option.correct && option.selected ? "Your answer · Correct" :
//                           option.correct ? "Correct answer" :
//                             option.selected ? "Your answer" : ""}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {current.explanation && (
//                 <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
//                   <p className="font-medium">Why this is the answer</p>
//                   <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
//                     {current.explanation}
//                   </p>
//                 </div>
//               )}

//               <div className="flex items-center justify-between border-t pt-4">
//                 <Button
//                   type="button" variant="outline" size="sm" disabled={index === 0}
//                   onClick={() => setActiveId(filtered[index - 1].id)}
//                 >
//                   <ChevronLeft className="size-4" /> Previous
//                 </Button>
//                 <span className="text-xs text-muted-foreground">
//                   {index + 1} of {filtered.length}
//                 </span>
//                 <Button
//                   type="button" variant="outline" size="sm"
//                   disabled={index === filtered.length - 1}
//                   onClick={() => setActiveId(filtered[index + 1].id)}
//                 >
//                   Next <ChevronRight className="size-4" />
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//           <aside className="h-fit rounded-lg border p-3">
//             <p className="mb-3 text-sm font-medium">Jump to question</p>
//             <div className="grid grid-cols-6 gap-2 lg:grid-cols-4">
//               {filtered.map((q) => (
//                 <Button
//                   key={q.id} type="button" size="sm"
//                   variant={q.id === current.id ? "default" : "outline"}
//                   className="h-9 px-0"
//                   onClick={() => setActiveId(q.id)}
//                 >
//                   {q.number}
//                 </Button>
//               ))}
//             </div>
//             <p className="mt-3 text-xs text-muted-foreground">
//               Read-only review. Your submitted answers cannot be changed.
//             </p>
//           </aside>
//         </div>
//       )}
//     </div>
//   )
// }
