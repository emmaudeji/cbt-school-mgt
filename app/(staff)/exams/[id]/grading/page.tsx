
import Link from "next/link"
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Info,
  LockKeyhole,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  params: Promise<{ id: string }>
}

const workflow = [
  {
    title: "Identify written questions",
    description:
      "The system identifies free-text questions requiring examiner marks.",
    icon: FileText,
  },
  {
    title: "Review submitted answers",
    description:
      "Teachers see the student's answer and the marking guide.",
    icon: BookOpenCheck,
  },
  {
    title: "Award marks",
    description:
      "Teachers enter valid marks and optional feedback.",
    icon: ClipboardCheck,
  },
  {
    title: "Finalize results",
    description:
      "Once all questions are graded, the official result is recorded.",
    icon: CheckCircle2,
  },
]

export default async function ManualGradingPage({
  params,
}: Props) {
  const { id } = await params

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/exams/${encodeURIComponent(id)}/results`}>
              <ArrowLeft className="size-4" />
              Back to Results
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-6" />
            <h1 className="text-2xl font-semibold">
              Manual Grading
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Review written responses, award marks,
            and finalize examination results.
          </p>
        </div>

        <Badge variant="secondary" className="gap-1.5">
          <Clock3 className="size-3.5" />
          Future Implementation
        </Badge>
      </header>

      <section className="rounded-xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />

          <div className="space-y-1">
            <h2 className="font-semibold">
              Manual Grading is Coming Soon
            </h2>

            <p className="text-sm leading-6 text-muted-foreground">
              This feature is planned for a future release.
              Authorized teachers and examiners will be able
              to review essay and written answers, assign
              marks, provide feedback, and finalize results.
            </p>

            <p className="text-xs text-muted-foreground">
              The interface below is a demonstration only.
              No grades can be saved or changed here.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {workflow.map((step, index) => {
          const Icon = step.icon

          return (
            <Card key={step.title} className="shadow-none">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" />

                  <span className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>

                <h3 className="text-sm font-semibold">
                  {step.title}
                </h3>

                <p className="text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              Grading Workspace Preview
            </h2>

            <p className="text-xs text-muted-foreground">
              Illustrative student, question and marks.
            </p>
          </div>

          <Badge variant="outline">
            Read-only Demo
          </Badge>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">
                Student Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="size-5" />
                </div>

                <div>
                  <p className="font-medium">
                    Sample Student
                  </p>
                  <p className="text-xs text-muted-foreground">
                    DEMO001
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    Assessment
                  </span>
                  <span>Sample Examination</span>
                </div>

                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    Question
                  </span>
                  <span>3 of 5</span>
                </div>

                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    Status
                  </span>
                  <span>Preview only</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Available after implementation
                </p>

                <p className="mt-1 text-sm">
                  Candidate queue, grading progress,
                  and student filters.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  Question 3
                </CardTitle>

                <Badge variant="outline">
                  10 Marks
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Examination Question
                </p>

                <p className="text-sm leading-7">
                  Explain three causes of soil erosion
                  and suggest two methods of prevention.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold">
                  Student's Answer
                </h3>

                <p className="whitespace-pre-wrap text-sm leading-7">
                  Soil erosion is caused by deforestation,
                  overgrazing, and heavy rainfall.
                  It can be prevented through planting
                  trees and using cover crops.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    Examiner Marking Guide
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Three valid causes: 6 marks.
                  Two prevention methods: 4 marks.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="demo-marks"
                    className="text-sm font-medium"
                  >
                    Awarded Marks
                  </label>

                  <Input
                    id="demo-marks"
                    value="8 / 10"
                    disabled
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Grading Status
                  </p>

                  <div className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
                    Not available
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="demo-feedback"
                  className="text-sm font-medium"
                >
                  Examiner Feedback
                </label>

                <Textarea
                  id="demo-feedback"
                  value="Well explained. Add more detail to the prevention methods."
                  disabled
                  readOnly
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <Button variant="outline" disabled>
                  Previous Question
                </Button>

                <Button disabled>
                  Save & Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Manual grading is not yet available.
        This page is reserved for future implementation.
      </p>
    </main>
  )
}
