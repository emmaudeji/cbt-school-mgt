
import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  FileUp,
  PenLine,
} from "lucide-react"

import { urls } from "@/constants"
import { Badge } from "@/components/ui/badge"

type Props = {
  slug: string
}

const upcomingActions = [
  {
    title: "Question Bank",
    description:
      "Find and reuse questions already available in your organization.",
    icon: BookOpen,
  },
]

export function QuestionActions({ slug }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">
          Add Questions
        </h3>
        <p className="mt-1 text-sm ">
          Choose how you want to build your examination.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link
          href={urls.examAddQuestion(slug)}
          className="group flex flex-col rounded-xl border border-primary/25 bg-primary/5 p-4 transition-colors hover:border-primary/60 hover:bg-primary/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PenLine className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>

          <h4 className="mt-4 text-sm font-semibold">
            Write Question
          </h4>
          <p className="mt-1 text-xs leading-5 ">
            Create questions with answer choices, correct
            answers and explanations.
          </p>
        </Link>

        <Link
            href={urls.uploadExamQuestions(encodeURIComponent(slug)) }
            className="group flex flex-col rounded-xl border border-green-600/25 bg-green-600/5 p-4 transition-colors hover:border-green-600/50 hover:bg-green-600/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
                <FileUp className="size-5" />
              </div>
              <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>

            <h4 className="mt-4  text-sm font-semibold">Upload Document / Copy & Paste</h4>

            <p className="mt-1 text-xs leading-5 ">
                Import questions from a Word document and review them
                before adding them to this examination.
            </p>
        </Link>

        {upcomingActions.map((action) => {
          const Icon = action.icon

          return (
            <div
              key={action.title}
              className="flex flex-col rounded-xl border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted ">
                  <Icon className="size-5" />
                </div>

                <Badge variant="secondary" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>

              <h4 className="mt-4 text-sm font-semibold">
                {action.title}
              </h4>
              <p className="mt-1 text-xs leading-5 ">
                {action.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
