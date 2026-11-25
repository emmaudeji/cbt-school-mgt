
import { redirect } from "next/navigation"
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
  getCurrentExamSession,
  normalizeExamEntryCode,
} from "@/features/exams/public/services/exam-entry-access"
import { StartExamButton } from "@/features/exams/attempts/components/StartExamButton"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ code: string }>
}

export default async function ExamReadyPage({ params }: Props) {
  const { code: rawCode } = await params
  const code = normalizeExamEntryCode(rawCode)

  const session = await getCurrentExamSession(code)

  if (!session) {
    redirect(`/take/${code}`)
  }

  const candidateName = [
    session.first_name,
    session.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <Card className="w-full max-w-lg gap-0 py-0 shadow-none">
        <CardContent className="space-y-  p-5 text-center sm:p-8">

          {/* Access confirmation */}
          <div className="space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-7" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">
                Examination Access Confirmed
              </h1>

              <p className="text-sm font-medium text-foreground">
                Please confirm your identity before continuing.
              </p>
            </div>
          </div>

          {/* Candidate identity */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-6">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Candidate Name
            </p>

            <h2 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {candidateName}
            </h2>
          </div>

          {/* Identity confirmation */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-left">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />

            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">
                Is this your name?
              </p>

              <p className="text-sm font-medium leading-6 text-foreground">
                Confirm that the name displayed above is yours
                before starting the examination.
              </p>

              <p className="text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">
                If this is not your name, do not continue.
                Report immediately to your teacher or examination supervisor.
              </p>
            </div>
          </div>

          {/* Session information */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
            <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />

            <p className="text-sm font-semibold text-foreground">
              Your examination session is active.
            </p>
          </div>

           <StartExamButton code={code} />
 

        </CardContent>
      </Card>
    </main>
  )
}






// import { redirect } from "next/navigation"
// import { CheckCircle2, ShieldCheck } from "lucide-react"

// import {
//   Card,
//   CardContent,
// } from "@/components/ui/card"
// import { getCurrentPublicExamSession } from "@/features/exams/public/services/public-exam-access"
// import { StartExamButton } from "@/features/exams/attempts/components/StartExamButton"

// export const dynamic = "force-dynamic"

// type Props = {
//   params: Promise<{ code: string }>
// }

// export default async function PublicExamReadyPage({
//   params,
// }: Props) {
//   const { code: rawCode } = await params
//   const code = rawCode.toUpperCase()

//   const session = await getCurrentPublicExamSession(code)

//   if (!session) {
//     redirect(`/take/${code}`)
//   }

//   return (
//     <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
//       <Card className="w-full max-w-md shadow-none">
//         <CardContent className="space-y-5 py-10 text-center">
//           <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
//             <CheckCircle2 className="size-7 text-primary" />
//           </div>

//           <div className="space-y-2">
//             <h1 className="text-xl font-semibold">
//               Registration Successful
//             </h1>

//             <p className="text-sm ">
//               Welcome, {session.first_name}{" "}
//               {session.last_name}.
//             </p>
//           </div>

//           <div className="flex items-center justify-center gap-2 rounded-lg border p-4 text-sm">
//             <ShieldCheck className="size-4 text-primary" />
//             Your examination access session is active.
//           </div>

//           <div className="space-y-4">
//             <p className="text-sm leading-6 ">
//               Your examination session is active. When you begin,
//               the system will create your attempt and start your
//               examination timer.
//             </p>

//             <StartExamButton code={code} />

//             <p className="text-xs ">
//               Your examination time begins when you select
//               Start Examination.
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </main>
//   )
// }
