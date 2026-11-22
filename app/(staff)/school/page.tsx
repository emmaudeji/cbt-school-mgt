import ErrorState from "@/components/common/ErrorState"
import PageLoader from "@/components/common/PageLoader"
import { PageShell } from "@/components/layout/PageShell"
import SchoolInformation from "@/features/school-information/components/SchoolInformation"
import { getSchool } from "@/features/school-information/services"
 
import { Suspense } from "react"

export default function SchoolInformationPage() {
  return (
    <PageShell className="max-w-4xl">
      <Suspense fallback={<PageLoader text="Loading school information..." />}>
        <Wrapper />
      </Suspense>
    </PageShell>
  )
}

async function Wrapper() {
  const { data, error } = await getSchool()

  if (error || !data) {
    return (
      <ErrorState
        header="School information unavailable"
        text={error || "School information could not be found."}
      />
    )
  }

  return <SchoolInformation school={data} />
}