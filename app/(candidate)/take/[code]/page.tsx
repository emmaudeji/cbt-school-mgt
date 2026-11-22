import { notFound, redirect } from "next/navigation"
import { CalendarClock, ClipboardList, Clock3, Globe2, KeyRound, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicExamJoinForm } from "@/features/exams/components/PublicExamJoinForm"
import { ExamNumberLoginForm } from "@/features/exams/components/ExamNumberLoginForm"
import {
  getExamEntryPreview,
  getCurrentExamSession,
  normalizeExamEntryCode,
} from "@/features/exams/public/services/exam-entry-access"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ code: string }> }

export default async function TakeExamPage({ params }: Props) {
  const { code: rawCode } = await params
  const code = normalizeExamEntryCode(rawCode)
  const exam = await getExamEntryPreview(code)

  if (!exam.found || !exam.available_from || !exam.available_until || !exam.mode) {
    notFound()
  }

  const existingSession = await getCurrentExamSession(code)
  if (existingSession) redirect(`/take/${code}/ready`)

  const now = Date.now()
  const begins = Date.parse(exam.available_from)
  const ends = Date.parse(exam.available_until)
  const upcoming = now < begins
  const closed = now >= ends
  const available = !upcoming && !closed
  const durationMinutes = Math.round((exam.duration_seconds ?? 3600) / 60)
  const isPublic = exam.mode === "open_link"
  const isPrivate = exam.mode === "access_code"

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-xl space-y-5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="size-6 text-primary" />
          </div>
          <Badge variant="secondary" className="gap-1">
            {isPublic ? <Globe2 className="size-3" /> :
              isPrivate ? <KeyRound className="size-3" /> :
              <UserRound className="size-3" />}
            {isPublic ? "Public Examination" : isPrivate ? "Exam Number" : "Registered candidates"}
          </Badge>
          <h1 className="text-2xl font-semibold">{exam.title}</h1>
          {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
        </div>

        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-base">Examination information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground" />{durationMinutes} minutes</div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                {available ? "Entry open" : upcoming ? "Not yet available" : "Examination closed"}
              </div>
            </div>

            {exam.instructions && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Instructions</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{exam.instructions}</p>
              </div>
            )}

            {available ? (
              <div className="space-y-4 border-t pt-5">
                <h2 className="font-semibold">
                  {isPublic ? "Enter your details" : isPrivate ? "Enter your Exam Number" : "Sign in to continue"}
                </h2>
                {isPublic ? <PublicExamJoinForm code={code} /> :
                  isPrivate ? <ExamNumberLoginForm code={code} /> :
                  <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    This exam requires a registered account. Use the account sign-in flow provided by your organization.
                  </p>}
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {upcoming
                  ? `This examination opens on ${new Date(exam.available_from).toLocaleString("en-GB", {
                      dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
                    })} (Lagos time).`
                  : "The examination availability period has ended."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}



// import { notFound, redirect } from "next/navigation"
// import { CalendarClock, ClipboardList, Clock3, Globe2, KeyRound, UserRound } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { PublicExamJoinForm } from "@/features/exams/components/PublicExamJoinForm"
// import { PrivateExamLoginForm } from "@/features/exams/components/PrivateExamLoginForm"
// import { getCurrentExamSession, getExamEntryPreview, normalizeExamEntryCode } from "@/features/exams/public/services/exam-entry-access"

// export const dynamic = "force-dynamic"
// type Props = { params: Promise<{ code: string }> }

// export default async function TakeExamPage({ params }: Props) {
//   const { code: rawCode } = await params
//   const code = normalizeExamEntryCode(rawCode)
//   const exam = await getExamEntryPreview(code)
//   if (!exam.found || !exam.mode || !exam.available_from || !exam.available_until) notFound()

//   const session = await getCurrentExamSession(code)
//   if (session) redirect(`/take/${code}/ready`)

//   const now = Date.now()
//   const begins = Date.parse(exam.available_from)
//   const ends = Date.parse(exam.available_until)
//   const upcoming = now < begins
//   const closed = now >= ends
//   const available = !upcoming && !closed
//   const duration = Math.round((exam.duration_seconds ?? 3600) / 60)
//   const modeLabels = {
//     open_link: "Public examination",
//     access_code: "Personal access codes",
//     registered: "Registered candidates",
//   } as const
//   const ModeIcon = exam.mode === "open_link" ? Globe2 : exam.mode === "access_code" ? KeyRound : UserRound

//   return (
//     <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
//       <div className="w-full max-w-xl space-y-5">
//         <div className="space-y-2 text-center">
//           <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="size-6" /></div>
//           <Badge variant="secondary" className="gap-1"><ModeIcon className="size-3.5" />{modeLabels[exam.mode]}</Badge>
//           <h1 className="text-2xl font-semibold tracking-tight">{exam.title}</h1>
//           {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
//         </div>
//         <Card className="gap-0 py-0 shadow-none">
//           <CardHeader className="border-b py-4"><CardTitle className="text-base">Examination information</CardTitle></CardHeader>
//           <CardContent className="space-y-5 p-5">
//             <div className="grid gap-3 text-sm sm:grid-cols-2">
//               <div className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />{duration} minutes</div>
//               <div className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" />{available ? "Available now" : upcoming ? "Not yet available" : "Examination closed"}</div>
//             </div>
//             {exam.instructions && <div className="space-y-1 border-t pt-4"><p className="text-sm font-semibold">Instructions</p><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{exam.instructions}</p></div>}
//             {!available ? (
//               <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
//                 {upcoming ? `Opens ${new Date(begins).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })} (Lagos time).` : "The examination availability period has ended."}
//               </p>
//             ) : exam.mode === "open_link" ? (
//               <section className="space-y-4 border-t pt-4"><h2 className="font-semibold">Join examination</h2><p className="text-sm text-muted-foreground">Enter your name to register and begin.</p><PublicExamJoinForm code={code} /></section>
//             ) : exam.mode === "access_code" ? (
//               <section className="space-y-4 border-t pt-4"><h2 className="font-semibold">Candidate sign in</h2><p className="text-sm text-muted-foreground">Enter the details provided by your examination organizer.</p><PrivateExamLoginForm code={code} /></section>
//             ) : (
//               <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
//                 <p className="font-semibold">Organization account required</p>
//                 <p className="mt-1 text-muted-foreground">This examination uses registered access. Sign in through your organization's account portal. Registered-account entry is not connected to this page yet.</p>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </main>
//   )
// }










// // import { notFound, redirect } from "next/navigation"
// // import {
// //   CalendarClock,
// //   ClipboardList,
// //   Clock3,
// //   Globe2,
// // } from "lucide-react"

// // import {
// //   Card,
// //   CardContent,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card"
// // import { Badge } from "@/components/ui/badge"

// // import { PublicExamJoinForm } from "@/features/exams/components/PublicExamJoinForm"
// // import { getCurrentPublicExamSession, getPublicExamPreview } from "@/features/exams/public/services/public-exam-access"
 

// // export const dynamic = "force-dynamic"

// // type Props = {
// //   params: Promise<{ code: string }>
// // }

// // export default async function PublicExamPage({ params }: Props) {
// //   const { code: rawCode } = await params
// //   const code = rawCode.toUpperCase()

// //   const exam = await getPublicExamPreview(code)

// //   if (
// //     !exam.found ||
// //     !exam.available_from ||
// //     !exam.available_until
// //   ) {
// //     notFound()
// //   }

// //   const existingSession =
// //     await getCurrentPublicExamSession(code)

// //   if (existingSession) {
// //     redirect(`/take/${code}/ready`)
// //   }

// //   const now = Date.now()
// //   const begins = new Date(exam.available_from).getTime()
// //   const ends = new Date(exam.available_until).getTime()

// //   const upcoming = now < begins
// //   const closed = now >= ends
// //   const available = !upcoming && !closed

// //   const durationMinutes = Math.round(
// //     (exam.duration_seconds ?? 3600) / 60
// //   )

// //   return (
// //     <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
// //       <div className="w-full max-w-xl space-y-6">
// //         <div className="space-y-2 text-center">
// //           <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
// //             <ClipboardList className="size-6 text-primary" />
// //           </div>

// //           <Badge variant="secondary">
// //             <Globe2 className="mr-1 size-3" />
// //             Public Examination
// //           </Badge>

// //           <h1 className="text-2xl font-semibold">
// //             {exam.title}
// //           </h1>

// //           {exam.description && (
// //             <p className="text-sm text-muted-foreground">
// //               {exam.description}
// //             </p>
// //           )}
// //         </div>

// //         <Card className="shadow-none">
// //           <CardHeader>
// //             <CardTitle className="text-base">
// //               Examination Information
// //             </CardTitle>
// //           </CardHeader>

// //           <CardContent className="space-y-5">
// //             <div className="grid gap-3 sm:grid-cols-2">
// //               <div className="flex items-center gap-2 text-sm">
// //                 <Clock3 className="size-4 text-muted-foreground" />
// //                 {durationMinutes} minutes
// //               </div>

// //               <div className="flex items-center gap-2 text-sm">
// //                 <CalendarClock className="size-4 text-muted-foreground" />
// //                 {available
// //                   ? "Registration open"
// //                   : upcoming
// //                     ? "Not yet available"
// //                     : "Examination closed"}
// //               </div>
// //             </div>

// //             {exam.instructions && (
// //               <div className="space-y-2 border-t pt-4">
// //                 <p className="text-sm font-medium">
// //                   Instructions
// //                 </p>

// //                 <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
// //                   {exam.instructions}
// //                 </p>
// //               </div>
// //             )}

// //             {available ? (
// //               <div className="border-t pt-5">
// //                 <h2 className="mb-4 font-semibold">
// //                   Candidate Registration
// //                 </h2>

// //                 <PublicExamJoinForm code={code} />
// //               </div>
// //             ) : (
// //               <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
// //                 {upcoming
// //                   ? `This examination opens on ${new Date(
// //                       exam.available_from
// //                     ).toLocaleString("en-GB", {
// //                       dateStyle: "medium",
// //                       timeStyle: "short",
// //                       timeZone: "Africa/Lagos",
// //                     })} (Lagos time).`
// //                   : "The examination availability period has ended."}
// //               </p>
// //             )}
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </main>
// //   )
// // }
