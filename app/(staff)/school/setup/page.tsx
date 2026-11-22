
import { AcademicReviewStep } from "@/features/school-academic-setup/components/AcademicReviewStep"
import { AcademicSetupStart } from "@/features/school-academic-setup/components/AcademicSetupStart"
import { AcademicYearStep } from "@/features/school-academic-setup/components/AcademicYearStep"
import { AssessmentStep } from "@/features/school-academic-setup/components/AssessmentStep"
import { ClassSubjectStep } from "@/features/school-academic-setup/components/ClassSubjectStep"

import { getAssessmentSetupData } from "@/features/school-academic-setup/services/assessment-queries"
import { getClassSubjectSetupData } from "@/features/school-academic-setup/services/class-subject-queries"
import { getAcademicSetupData } from "@/features/school-academic-setup/services/queries"

export const dynamic = "force-dynamic"

type SetupStep = "0" | "1" | "2" | "3" | "4"

type Props = {
  searchParams: Promise<{
    session?: string
    term?: string
    step?: string
  }>
}

function SetupMessage({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h1 className="text-base font-semibold">
          {title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    </main>
  )
}

function SetupContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6">
      {children}
    </main>
  )
}

export default async function AcademicSetupPage({
  searchParams,
}: Props) {
  const [data, query] = await Promise.all([
    getAcademicSetupData(),
    searchParams,
  ])

  if (!data) {
    return (
      <SetupMessage
        title="Academic setup unavailable"
        message="School information could not be loaded. Please check your school access and try again."
      />
    )
  }

  // Step 0 is the default landing page.
  const validSteps: SetupStep[] = [
    "0",
    "1",
    "2",
    "3",
    "4",
  ]

  const requestedStep = query.step ?? "0"

  const step: SetupStep = validSteps.includes(
    requestedStep as SetupStep
  )
    ? (requestedStep as SetupStep)
    : "0"

  // Resolve the selected academic session.
  const selectedSession =
    data.sessions.find(
      (session) => session.id === query.session
    ) ??
    data.sessions.find(
      (session) => session.is_current
    ) ??
    data.sessions[0]

  const sessionId = selectedSession?.id ?? ""

  // Terms must belong to the selected session.
  const availableTerms = data.terms.filter(
    (term) => term.session_id === sessionId
  )

  const selectedTerm =
    availableTerms.find(
      (term) => term.id === query.term
    ) ??
    availableTerms.find(
      (term) => term.is_current
    ) ??
    availableTerms[0]

  const termId = selectedTerm?.id ?? ""

  // If no academic period has been configured,
  // open Step 1 so staff can create it.
  if (!selectedSession || !selectedTerm) {
    return (
      <SetupContainer>
        <AcademicYearStep
          data={data}
          initialSessionId={sessionId}
          initialTermId={termId}
        />
      </SetupContainer>
    )
  }

  // STEP 0: Getting started / CSV template.
  if (step === "0") {
    return (
      <SetupContainer>
        <AcademicSetupStart
          schoolName={data.school.name}
          sessionId={sessionId}
          termId={termId}
          sessionName={selectedSession.name}
          termName={selectedTerm.name}
        />
      </SetupContainer>
    )
  }

  // STEP 1: Academic session and term.
  if (step === "1") {
    return (
      <SetupContainer>
        <AcademicYearStep
          data={data}
          initialSessionId={sessionId}
          initialTermId={termId}
        />
      </SetupContainer>
    )
  }

  // STEP 2: Classes and subject offerings.
  if (step === "2") {
    const classSubjectData =
      await getClassSubjectSetupData(
        sessionId,
        termId
      )

    if (!classSubjectData) {
      return (
        <SetupMessage
          title="Class and subject setup unavailable"
          message="Unable to load class and subject information for the selected academic period."
        />
      )
    }

    return (
      <SetupContainer>
        <ClassSubjectStep
          data={classSubjectData}
          sessionId={sessionId}
          termId={termId}
          sessionName={selectedSession.name}
          termName={selectedTerm.name}
        />
      </SetupContainer>
    )
  }

  // STEP 3 AND 4: Share the same assessment query.
  const assessmentData =
    await getAssessmentSetupData(
      sessionId,
      termId
    )

  if (!assessmentData) {
    return (
      <SetupMessage
        title={
          step === "3"
            ? "Assessment setup unavailable"
            : "Academic review unavailable"
        }
        message="Unable to load assessment information for the selected academic period. Please check your school access and try again."
      />
    )
  }

  // STEP 3: Apply assessment structures.
  if (step === "3") {
    return (
      <SetupContainer>
        <AssessmentStep
          data={assessmentData}
          sessionId={sessionId}
          termId={termId}
          sessionName={selectedSession.name}
          termName={selectedTerm.name}
        />
      </SetupContainer>
    )
  }

  // STEP 4: Review academic readiness.
  return (
    <SetupContainer>
      <AcademicReviewStep
        data={assessmentData}
        sessionId={sessionId}
        termId={termId}
        sessionName={selectedSession.name}
        termName={selectedTerm.name}
      />
    </SetupContainer>
  )
}
