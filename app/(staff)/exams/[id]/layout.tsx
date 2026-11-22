
import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

import { urls } from "@/constants"
import { PageShell } from "@/components/layout/PageShell"
import { Badge } from "@/components/ui/badge"

import { getExamBySlug } from "@/features/exams/services/queries"
import { ExamWorkspaceNav } from "@/features/exams/components/ExamWorkspaceNav"
 
type Props = {
  children: ReactNode
  params: Promise<{ id: string }>
}

export default async function ExamLayout({
  children,
  params,
}: Props) {
  const { id:slug } = await params
  const exam = await getExamBySlug(slug)

  return (
    <PageShell className="space-y-6 max-w-7xl ">
      <header className="space-y-4">
        <Link
          href={urls.exams}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Examinations
        </Link>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {exam.title}
            </h1>

            <Badge variant="secondary" className="capitalize">
              {exam.status}
            </Badge>
          </div>

          {exam.description && (
            <p className="text-sm text-muted-foreground">
              {exam.description}
            </p>
          )}
        </div>
      </header>

      <ExamWorkspaceNav slug={exam.slug} />

      {children}
    </PageShell>
  )
}
