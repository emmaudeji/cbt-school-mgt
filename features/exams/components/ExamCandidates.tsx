
"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  ArrowLeft, ArrowRight, CalendarClock, CheckCircle2,
  ClipboardList, FileUp, GraduationCap, KeyRound,
  Link2, Settings2, ShieldCheck, Users,
  UserRoundPlus, UserX,
  ExternalLink,
} from "lucide-react"

import { urls } from "@/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import type { CandidateManagementData } from "@/types/candidate-management"
import type { ExamCandidateStats } from "../services/exam-candidate-roster"
import type { SchoolExamSummary } from "../services/queries"
import { PublicExamLinkManager } from "./PublicExamLinkManager"
import { LinkButton } from "@/components/shared/LinkButton"

type Props = {
  data: CandidateManagementData
  stats?: ExamCandidateStats
  schoolSummary?: SchoolExamSummary | null
  candidateList?: ReactNode
}

const accessLabels: Record<string, string> = {
  access_code: "Exam Number",
  registered: "Account Sign-in",
  open_link: "Public Link",
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not configured"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date)
}


type MetricTone = "blue" | "emerald" | "violet" | "rose"

const metricColors: Record<MetricTone, string> = {
  blue: "border-blue-500/25 bg-blue-500/5 text-blue-800 dark:text-blue-300",
  emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
  violet: "border-violet-500/25 bg-violet-500/5 text-violet-800 dark:text-violet-300",
  rose: "border-rose-500/25 bg-rose-500/5 text-rose-800 dark:text-rose-300",
}

function Metric({
  label, value, icon: Icon, tone,
}: {
  label: string
  value: number | string
  icon: typeof Users
  tone: MetricTone
}) {
  return (
    <div className={`rounded-xl border p-3.5 shadow-none ${metricColors[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  )
}



type ActionTone = "amber" | "blue" | "violet"

const actionColors: Record<ActionTone, string> = {
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

function ActionLink({
  href, icon: Icon, title, detail, tone,
}: {
  href: string
  icon: typeof Users
  title: string
  detail: string
  tone: ActionTone
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${actionColors[tone]}`}>
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-foreground/75">
          {detail}
        </span>
      </span>

      <ArrowRight className="size-4 shrink-0 text-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}


export function ExamCandidates({
  data,
  stats,
  schoolSummary = null,
  candidateList,
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false)

  const publication = data.publication
  const isSchoolExam = schoolSummary !== null
  const isCode = data.accessMode === "access_code"
  const isRegistered = data.accessMode === "registered"
  const isPublic = data.accessMode === "open_link"

  const slug = encodeURIComponent(data.exam.slug)
  const candidateUrl = `/exams/${slug}/candidates`
  const examTakeLink = data.examEntryCode ? urls.takeExam(data.examEntryCode) : null
  const assigned = stats?.candidates ??
    data.assignments.filter(a => a.status === "assigned").length

  const revoked = stats?.revoked ??
    data.assignments.filter(a => a.status === "revoked").length

  const started = stats?.started
  const notStarted = stats?.notStarted ??
    (started === undefined ? "—" : Math.max(0, assigned - started))

  const candidateNoun = isSchoolExam ? "Students" : "Candidates"

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={urls.examDetails(data.exam.slug)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/75 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Exam Details
        </Link>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {isSchoolExam ? "School Examination" : "Independent Test"}
          </Badge>
          {publication && (
            <Badge variant="outline">
              Revision {publication.revision}
            </Badge>
          )}
        </div>
      </div>
      
      <header className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />

              <h1 className="text-xl font-bold tracking-tight">
                {isSchoolExam
                  ? "Examination Students"
                  : "Examination Candidates"}
              </h1>
            </div>
 
          </div>

          {/* ACTUAL EXAMINATION ENTRY LINK */}
          {examTakeLink && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 shadow-none hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              <a
                href={examTakeLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                  Exam Link
              </a>
            </Button>
          )}
        </div>

        {schoolSummary && (
          <div className="  flex flex-wrap items-center gap-x-4 gap-y-2    ">
            <span className="text-sm font-semibold">
              {schoolSummary.levelName} · {schoolSummary.subjectName}
            </span>

            <span className="text-xs text-foreground/75">
              {schoolSummary.sessionName} · {schoolSummary.termName}
            </span>

            <div className="flex flex-wrap gap-1">
              {schoolSummary.classNames.map(name => (
                <Badge
                  key={name}
                  variant="outline"
                  className="border-blue-500/25 bg-background"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {publication && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-blue-500/15 pt-3 text-xs">
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 text-emerald-600" />
              Opens:
              <strong>{formatDate(publication.available_from)}</strong>
            </span>

            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 text-amber-600" />
              Closes:
              <strong>{formatDate(publication.available_until)}</strong>
            </span>
          </div>
        )}
      </header>

      {!publication ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              Publish the examination first
            </p>
            <p className="mt-1 text-xs text-foreground/75">
              Student assignments are linked to a published revision.
            </p>
          </div>

          <Button asChild size="sm" className="shadow-none">
            <Link href={urls.examPublish(data.exam.slug)}>
              Go to Publication
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3">
            <section className="rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h2 className="text-sm font-bold">Examination Access</h2>
              </div>

              <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-bold">
                  {accessLabels[data.accessMode ?? ""] ??
                    "Not configured"}
                </p>

                <p className="mt-1 text-xs leading-5 text-foreground/75">
                  {isCode
                    ? "Assigned candidates use their personal examination credentials."
                    : isRegistered
                      ? "Assigned candidates sign in with registered accounts."
                      : "Participants use the published public entry link."}
                </p>
              </div>

              <LinkButton href={urls.examPublish(data.exam.slug)}
                // variant="outline"
                size="sm"
                className="mt-3 w-full justify-between shadow-none"
              >
                  <span className="flex items-center gap-2">
                    <Settings2 className="size-4" />
                    Access & Publication
                  </span>
                  <ArrowRight className="size-4" />
              </LinkButton>
            </section>

             

            <section className="rounded-xl border bg-card p-3">
              <h2 className="text-sm font-bold">
                Manage Candidates
              </h2>

              <div className="mt-3 space-y-2">
                {isSchoolExam && (isCode || isRegistered) && (
                  <ActionLink
                    href={`${candidateUrl}/assign`}
                    icon={UserRoundPlus}
                    title="Assign School Students"
                    detail="Choose any student, class level or arm."
                    tone="amber"
                  />
                )}

                {!isPublic && (
                  <>
                    <ActionLink
                      href={`/candidates?exam=${slug}`}
                      icon={Users}
                      title="Candidate Directory"
                      detail="Assign existing CBT candidates."
                      tone="blue"
                    />

                    <ActionLink
                      href={`/candidates/import?exam=${slug}`}
                      icon={FileUp}
                      title="Add or Import Candidates"
                      detail="Create or import candidate records."
                      tone="violet"
                    />
                  </>
                )}

                {isPublic && (
                  <button
                    type="button"
                    onClick={() => setLinkOpen(true)}
                    className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Link2 className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        Public Examination Link
                      </span>
                      <span className="block text-xs text-foreground/75">
                        View and share the current link.
                      </span>
                    </span>

                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </section>
          </aside>

          <article className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">
                  Assigned {candidateNoun}
                </h2>
                <p className="mt-1 text-xs text-foreground/75">
                  The roster reflects actual assignments
                  for revision {publication.revision}.
                </p>
              </div>

              <Badge variant="outline">
                {assigned} assigned
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <Metric
                label="Assigned"
                value={assigned}
                icon={Users}
                tone="blue"
              />
              <Metric
                label="Started"
                value={started ?? "—"}
                icon={CheckCircle2}
                tone="violet"
              />
              <Metric
                label="Not Started"
                value={notStarted}
                icon={ClipboardList}
                tone="rose"
              />
              <Metric
                label="Revoked"
                value={revoked}
                icon={UserX}
                tone="emerald"
              />
            </div>

            {candidateList ?? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm">
                No candidate roster loaded.
              </div>
            )}

            <p className="text-xs leading-5 text-foreground/70">
              A student's class level does not restrict assignment.
              Completed attempts remain linked to their original
              publication revision.
            </p>
          </article>
        </div>
      )}

      {publication && isPublic && (
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto shadow-none">
            <DialogHeader>
              <DialogTitle>Public Examination Link</DialogTitle>
              <DialogDescription>
                Share the entry link for this publication.
              </DialogDescription>
            </DialogHeader>

            <PublicExamLinkManager
              examId={data.exam.id}
              slug={data.exam.slug}
              accessMode={data.accessMode}
              entryCode={data.publicLinkCode}
              availableFrom={publication.available_from}
              availableUntil={publication.available_until}
            />
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}













// "use client"

// import Link from "next/link"
// import { useState, type ReactNode } from "react"
// import {
//   ArrowLeft, ArrowRight, CalendarClock, CheckCircle2,
//   ClipboardList, FileUp, GraduationCap, KeyRound,
//   Link2, LockKeyhole, Settings2, ShieldCheck,
//   Users, UserRoundPlus, UserX,
// } from "lucide-react"

// import { urls } from "@/constants"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import {
//   Dialog, DialogContent, DialogDescription,
//   DialogHeader, DialogTitle,
// } from "@/components/ui/dialog"

// import type { CandidateManagementData } from "@/types/candidate-management"
// import type { ExamCandidateStats } from "../services/exam-candidate-roster"
// import { PublicExamLinkManager } from "./PublicExamLinkManager"
// import { SchoolExamSummary } from "../services/queries"

// type Props = {
//   data: CandidateManagementData
//   stats?: ExamCandidateStats
//   schoolSummary?: SchoolExamSummary | null
//   candidateList?: ReactNode
// }

// const accessLabels: Record<string, string> = {
//   access_code: "Exam Number",
//   registered: "Account Sign-in",
//   open_link: "Public Link",
// }

// function formatDate(value: string | null | undefined) {
//   if (!value) return "Not configured"
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return "Invalid date"
//   return new Intl.DateTimeFormat("en-NG", {
//     dateStyle: "medium", timeStyle: "short",
//     timeZone: "Africa/Lagos",
//   }).format(date)
// }

// function Metric({
//   label, value, icon: Icon, tone,
// }: {
//   label: string
//   value: number | string
//   icon: typeof Users
//   tone: string
// }) {
//   return (
//     <div className={`rounded-lg border p-3 ${tone}`}>
//       <div className="flex items-center justify-between gap-2 text-xs font-semibold">
//         <span>{label}</span>
//         <Icon className="size-4 shrink-0" />
//       </div>
//       <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
//     </div>
//   )
// }

// function ActionLink({
//   href, icon: Icon, title, detail, tone,
// }: {
//   href: string
//   icon: typeof Users
//   title: string
//   detail: string
//   tone: string
// }) {
//   return (
//     <Link href={href}
//       className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5">
//       <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
//         <Icon className="size-4" />
//       </span>
//       <span className="min-w-0 flex-1">
//         <span className="block text-sm font-semibold">{title}</span>
//         <span className="mt-0.5 block text-xs leading-4 text-foreground/75">{detail}</span>
//       </span>
//       <ArrowRight className="size-4 shrink-0 text-foreground/55" />
//     </Link>
//   )
// }

// export function ExamCandidates({
//   data, stats, schoolSummary = null, candidateList,
// }: Props) {
//   const [linkOpen, setLinkOpen] = useState(false)
//   const publication = data.publication
//   const slug = encodeURIComponent(data.exam.slug)
//   const isSchoolExam = schoolSummary !== null
//   const isCode = data.accessMode === "access_code"
//   const isRegistered = data.accessMode === "registered"
//   const isPublic = data.accessMode === "open_link"
//   const noun = isSchoolExam ? "Students" : "Candidates"

//   const assigned = stats?.candidates ??
//     data.assignments.filter(a => a.status === "assigned").length
//   const revoked = stats?.revoked ??
//     data.assignments.filter(a => a.status === "revoked").length
//   const started = stats?.started
//   const notStarted = stats?.notStarted ??
//     (started === undefined ? "—" : Math.max(0, assigned - started))

//   const candidatesUrl = `/exams/${slug}/candidates`
//   const assignmentUrl = `${candidatesUrl}/assign`
//   const directoryUrl = `/candidates?exam=${slug}`
//   const importUrl = `/candidates/import?exam=${slug}`

//   return (
//     <section className="space-y-4">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <Link href={urls.examDetails(data.exam.slug)}
//           className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary">
//           <ArrowLeft className="size-4" />
//           Exam Details
//         </Link>
//         <div className="flex flex-wrap items-center gap-2">
//           <Badge variant="outline" className={isSchoolExam
//             ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
//             : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"}>
//             {isSchoolExam ? "School Examination" : "Independent Test"}
//           </Badge>
//           {publication && (
//             <Badge variant="outline" className="font-semibold">
//               Revision {publication.revision}
//             </Badge>
//           )}
//         </div>
//       </div>

//       <header className="rounded-xl border bg-card p-4">
//         <h1 className="text-xl font-bold tracking-tight">
//           {isSchoolExam ? "Examination Students & Access" : "Candidates & Access"}
//         </h1>
//         <p className="mt-1 text-sm font-semibold text-foreground/85">{data.exam.title}</p>

//         {publication && (
//           <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs">
//             <span className="flex items-center gap-2">
//               <CalendarClock className="size-4 text-blue-600" />
//               Opens: <strong>{formatDate(publication.available_from)}</strong>
//             </span>
//             <span className="flex items-center gap-2">
//               <CalendarClock className="size-4 text-blue-600" />
//               Closes: <strong>{formatDate(publication.available_until)}</strong>
//             </span>
//           </div>
//         )}
//       </header>

//       {!publication ? (
//         <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
//           <LockKeyhole className="size-5 text-amber-600" />
//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-bold">Publish the examination first</p>
//             <p className="text-xs text-foreground/80">
//               Candidate access and assignment require a published revision.
//             </p>
//           </div>
//           <Button asChild size="sm" className="shadow-none">
//             <Link href={urls.examPublish(data.exam.slug)}>Go to Publication</Link>
//           </Button>
//         </div>
//       ) : (
//         <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[285px_minmax(0,1fr)]">
//           {/* SIDEBAR */}
//           <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pr-1">
//             <div className="rounded-xl border bg-card p-3">
//               <div className="mb-3 flex items-center gap-2">
//                 <ShieldCheck className="size-4 text-emerald-600" />
//                 <h2 className="text-sm font-bold">Current Access</h2>
//               </div>
//               <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
//                 <p className="text-sm font-bold">
//                   {accessLabels[data.accessMode ?? ""] ?? "Access configured"}
//                 </p>
//                 <p className="mt-1 text-xs leading-5 text-foreground/80">
//                   {isCode
//                     ? "Participants use individual Exam Numbers."
//                     : isRegistered
//                       ? "Eligible account holders sign in."
//                       : "Participants enter through the shared public link."}
//                 </p>
//               </div>
//               <Button asChild variant="outline" size="sm"
//                 className="mt-3 w-full justify-between shadow-none">
//                 <Link href={urls.examPublish(data.exam.slug)}>
//                   <span className="flex items-center gap-2">
//                     <Settings2 className="size-4" /> Change Access Method
//                   </span>
//                   <ArrowRight className="size-4" />
//                 </Link>
//               </Button>
//               <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
//                  Access can be changed for the current publication.
//                 Review existing assignments and Exam Numbers before switching.
//                 You may also publish a new revision
//                 {/* Changing the access method publishes a new revision.
//                 Existing attempts remain on their original revision. */}
//               </p>
//             </div>

//             {schoolSummary && (
//               <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3">
//                 <div className="mb-2 flex items-center gap-2">
//                   <GraduationCap className="size-4 text-blue-600" />
//                   <h2 className="text-sm font-bold">Academic Coverage</h2>
//                 </div>
//                 <p className="text-sm font-semibold">
//                   {schoolSummary.levelName} · {schoolSummary.subjectName}
//                 </p>
//                 <p className="mt-1 text-xs text-foreground/80">
//                   {schoolSummary.sessionName} · {schoolSummary.termName}
//                 </p>
//                 <div className="mt-2 flex flex-wrap gap-1">
//                   {schoolSummary.classNames.map(name => (
//                     <Badge key={name} variant="outline"
//                       className="border-blue-500/25 bg-background">{name}</Badge>
//                   ))}
//                 </div>
//                 <p className="mt-2 text-xs font-medium text-foreground/80">
//                   Assignment plan: {schoolSummary.assignmentScope === "class"
//                     ? "All eligible students" : "Selected students"}
//                 </p>
//               </div>
//             )}

//             <div className="rounded-xl border bg-card p-3">
//               <div className="mb-3 flex items-center gap-2">
//                 <UserRoundPlus className="size-4 text-violet-600" />
//                 <h2 className="text-sm font-bold">Assignment Actions</h2>
//               </div>
//               <div className="space-y-2">
//                 {isSchoolExam && (isCode || isRegistered) && (
//                    <ActionLink
//                     href={assignmentUrl}
//                     icon={GraduationCap}
//                     title="Assign School Students"
//                     detail="Select students from any class level or arm."
//                     tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
//                   />
                  
//                   // <ActionLink
//                   //   href={assignmentUrl}
//                   //   icon={GraduationCap}
//                   //   title="Assign School Students"
//                   //   detail={isCode
//                   //     ? "Choose covered classes and give students Exam Numbers."
//                   //     : "Choose students from the covered classes."}
//                   //   tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
//                   // />
//                 )}
//                 {!isPublic && (
//                   <>
//                     <ActionLink href={directoryUrl} icon={Users}
//                       title="Candidate Directory"
//                       detail="Select existing CBT candidates."
//                       tone="bg-sky-500/10 text-sky-700 dark:text-sky-300" />
//                     <ActionLink href={importUrl} icon={FileUp}
//                       title="Add / Import Candidates"
//                       detail="Create or import candidates."
//                       tone="bg-violet-500/10 text-violet-700 dark:text-violet-300" />
//                   </>
//                 )}
//                 <button type="button" onClick={() => setLinkOpen(true)}
//                   className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left hover:border-primary/50 hover:bg-primary/5">
//                   <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
//                     <Link2 className="size-4" />
//                   </span>
//                   <span className="min-w-0 flex-1">
//                     <span className="block text-sm font-semibold">Public Exam Link</span>
//                     <span className="block text-xs text-foreground/75">
//                       {isPublic ? "View and share the active link." : "Check link availability."}
//                     </span>
//                   </span>
//                   <ArrowRight className="size-4 text-foreground/55" />
//                 </button>
//               </div>
//               {isSchoolExam && isRegistered && (
//                 <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs leading-5">
//                   Registered student assignment must be supported by the assignment service.
//                   Account access alone is insufficient.
//                 </p>
//               )}
//             </div>
//           </aside>

//           {/* ARTICLE */}
//           <article className="min-w-0 space-y-3">
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <div>
//                 <h2 className="text-base font-bold">Assigned {noun}</h2>
//                 <p className="text-xs text-foreground/75">
//                   Monitor examination participation and access.
//                 </p>
//               </div>
//               <Badge variant="outline">{assigned} assigned</Badge>
//             </div>

//             <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
//               <Metric label="Assigned" value={assigned} icon={Users}
//                 tone="border-sky-500/25 bg-sky-500/5 text-sky-800 dark:text-sky-300" />
//               <Metric label="Started" value={started ?? "—"} icon={CheckCircle2}
//                 tone="border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300" />
//               <Metric label="Not Started" value={notStarted} icon={ClipboardList}
//                 tone="border-violet-500/25 bg-violet-500/5 text-violet-800 dark:text-violet-300" />
//               <Metric label="Revoked" value={revoked} icon={UserX}
//                 tone="border-rose-500/25 bg-rose-500/5 text-rose-800 dark:text-rose-300" />
//             </div>

//             {candidateList ?? (
//               <div className="rounded-xl border border-dashed p-8 text-center">
//                 <Users className="mx-auto size-7 text-primary" />
//                 <p className="mt-2 text-sm font-semibold">No roster loaded</p>
//               </div>
//             )}

//             {isSchoolExam && (
//               <p className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs leading-5 text-foreground/80">
//                 This examination covers the class arms shown on the left.
//                 The assignment workflow must enforce that coverage before saving
//                 new student assignments.
//               </p>
//             )}
//           </article>
//         </div>
//       )}

//       <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
//         <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto shadow-none">
//           <DialogHeader>
//             <DialogTitle>Public Examination Link</DialogTitle>
//             <DialogDescription>
//               Link access follows the policy of the current published revision.
//             </DialogDescription>
//           </DialogHeader>
//           {publication && (
//             <PublicExamLinkManager
//               examId={data.exam.id}
//               slug={data.exam.slug}
//               accessMode={data.accessMode}
//               entryCode={data.publicLinkCode}
//               availableFrom={publication.available_from}
//               availableUntil={publication.available_until}
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </section>
//   )
// }

 