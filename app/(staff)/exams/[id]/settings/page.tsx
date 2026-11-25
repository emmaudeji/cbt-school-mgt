
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft, GraduationCap } from "lucide-react"

import { urls } from "@/constants"
import PageLoader from "@/components/common/PageLoader"
import { Badge } from "@/components/ui/badge"
import { ExamSettingsForm } from "@/features/exams/components/ExamSettingsForm"
import { ExamPublishPanel } from "@/features/exams/components/publish/ExamPublishPanel"

import {
  getExamSettings,
  getExamPublicationOverview,
  getExamResultSettings,
  getSchoolExamSummary,
} from "@/features/exams/services/queries"

type Props = { params: Promise<{ id: string }> }

export default function ExamSettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamSettingsContent params={params} />
    </Suspense>
  )
}

async function ExamSettingsContent({ params }: Props) {
  const { id: slug } = await params
  const exam = await getExamSettings(slug)

  const [overview, resultSettings, schoolSummary] = await Promise.all([
    getExamPublicationOverview(exam.id),
    getExamResultSettings(exam.id),
    getSchoolExamSummary(exam.id),
  ])

  const isSchoolExam = schoolSummary !== null

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={urls.examDetails(exam.slug)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary">
          <ArrowLeft className="size-4" />
          Back to Questions
        </Link>
        <Badge variant="outline"
          className={isSchoolExam
            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"}>
          {isSchoolExam ? "School Examination" : "Independent Test"}
        </Badge>
      </div>

      <header className="rounded-xl border bg-card p-4">
        <h1 className="text-xl font-bold tracking-tight">
          {isSchoolExam ? "Examination Settings" : "Test Settings"}
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground/80">{exam.title}</p>

        {schoolSummary && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <GraduationCap className="size-4 text-blue-600" />
              {[schoolSummary.sessionName, schoolSummary.termName,
                schoolSummary.levelName, schoolSummary.subjectName].map(item => (
                <span key={item} className="rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-1">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {schoolSummary.classNames.map(name => (
                <Badge key={name} variant="secondary">{name}</Badge>
              ))}
              <span className="self-center text-xs text-foreground/75">
                · {schoolSummary.assignmentScope === "class"
                  ? "All eligible students" : "Selected students"}
              </span>
            </div>
          </div>
        )}
      </header>

      <ExamSettingsForm
        key={exam.id}
        exam={exam}
        resultSettings={resultSettings}
        isSchoolExam={isSchoolExam}
      />

      <section id="publication" className="scroll-mt-5">
        <ExamPublishPanel
          exam={exam}
          overview={overview}
          // schoolSummary={schoolSummary}
        />      
      </section>
    </main>
  )
}
