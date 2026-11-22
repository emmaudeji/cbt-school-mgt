import { Suspense } from "react"
import { notFound } from "next/navigation"

import PageLoader from "@/components/common/PageLoader"
import { SchoolAssignmentWorkspace } from "@/features/exams/components/school/SchoolAssignmentWorkspace"
import { getExamAssignmentContext } from "@/features/exams/services/assignment/queries.assignment-context"
import { getExamCredentialSummary } from "@/features/exams/services/assignment/queries.credentials"

type Props = { params: Promise<{ id: string }> }

export default function SchoolAssignmentPage({ params }: Props) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Wrapper params={params} />
    </Suspense>
  )
}

async function Wrapper({ params }: Props) {
  const { id: slug } = await params
  const data = await getExamAssignmentContext(slug)
  if (!data.exam) notFound()

  // Never fetch the summary without a sealed publication.
  // Do not replace query errors with zero counts: that would be misleading.
  const credentialSummary = data.publication
    ? await getExamCredentialSummary(data.publication.id)
    : null

  return (
    <SchoolAssignmentWorkspace
      exam={data.exam}
      publication={data.publication}
      accessMode={data.accessMode}
      credentialSummary={credentialSummary}
    />
  )
}
