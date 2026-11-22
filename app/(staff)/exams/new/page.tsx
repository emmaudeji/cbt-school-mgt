
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

import { urls } from "@/constants"
import { PageShell } from "@/components/layout/PageShell"
import PageLoader from "@/components/common/PageLoader"

import NewExamForm from "@/features/exams/components/NewExamForm"
import ErrorState from "@/components/common/ErrorState"
import { getExamSetupOptions } from "@/features/exams/services/action"

export default function NewExamPage() {
  return (
    <PageShell className="max-w-4xl space-y-4">
      <header className="space-y-3">
        <Link
          href={urls.exams}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Examinations
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Set New Test
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Name your test, select a question bank and subject.
            You can add questions and configure the examination next.
          </p>
        </div>
      </header>

      <Suspense fallback={<PageLoader />}>
        <Wrapper />
      </Suspense>
    </PageShell>
  )
}

async function Wrapper() {
  const { banks, categories, error } = await getExamSetupOptions()

  if (error) {
    return (
      <ErrorState header="Something went wrong" text={error}/>
    )
  }

  return (
    <NewExamForm
      banks={banks}
      categories={categories}
    />
  )
}
