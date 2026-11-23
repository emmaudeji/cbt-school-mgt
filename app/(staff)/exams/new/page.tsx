
import Link from "next/link"
import { Suspense } from "react"
import {
  ArrowLeft,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react"

import { urls } from "@/constants"
import { PageShell } from "@/components/layout/PageShell"
import PageLoader from "@/components/common/PageLoader"
import ErrorState from "@/components/common/ErrorState"

import NewExamForm from
  "@/features/exams/components/NewExamForm"

import {
  getExamSetupOptions,
  getSchoolExamSetupOptions,
} from "@/features/exams/services/action"

const isSchool = true

export default function NewExamPage() {
  return (
    <PageShell className="max-w-5xl space-y-4">
      <div className="space-y-3">
        <Link
          href={urls.exams}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Examinations
        </Link>

        <header className="flex items-start gap-3">
          <div
            className={
              isSchool
                ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
                : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"
            }
          >
            {isSchool ? (
              <GraduationCap className="size-6" />
            ) : (
              <ClipboardCheck className="size-6" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSchool
                ? "Create School Examination"
                : "Create New Test"}
            </h1>

            <p className="mt-1 text-sm text-foreground/75">
              {isSchool
                ? "Set the academic details, choose a question bank and save your examination draft."
                : "Name your test, organize its questions and save a draft."}
            </p>
          </div>
        </header>
      </div>

      <Suspense fallback={<PageLoader />}>
        <Wrapper />
      </Suspense>
    </PageShell>
  )
}

async function Wrapper() {
  const [cbt, school] = await Promise.all([
    getExamSetupOptions(),
    isSchool
      ? getSchoolExamSetupOptions()
      : Promise.resolve(null),
  ])

  if (cbt.error || school?.error) {
    return (
      <ErrorState
        header="Unable to load examination setup"
        text={
          cbt.error ||
          school?.error ||
          "Please try again."
        }
      />
    )
  }

  return (
    <NewExamForm
      banks={cbt.banks}
      categories={cbt.categories}
      isSchool={isSchool}
      schoolOptions={school?.options}
    />
  )
}
