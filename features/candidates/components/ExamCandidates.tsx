import Link from "next/link"
import { ArrowRight, BookUser, KeyRound, Link2, LockKeyhole, UserRoundPlus, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CandidateManagementData } from "@/types/candidate-management"
import { CandidateOverviewStats } from "./CandidateOverviewStats"
import { CandidateAssignmentWorkspace } from "./CandidateAssignmentWorkspace"
import { ExamCandidateRoster } from "./ExamCandidateRoster"
import { candidateBasePath } from "../services/candidate-ui"

type Props = { data: CandidateManagementData }

export function ExamCandidates({ data }: Props) {
  const base = candidateBasePath(data.exam.slug)
  const isRegistered = data.accessMode === "registered"
  const isPublic = data.accessMode === "open_link"
  const methods = [
    { title: "Access options", description: "Review public links, registered access and private codes.", icon: KeyRound, href: `${base}/access`, style: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
    { title: "Candidate directory", description: "Reusable candidate records, forms and imports.", icon: BookUser, href: "/candidates", style: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
    { title: "Add or import", description: "Register candidates manually or upload in bulk.", icon: UserRoundPlus, href: "/candidates/import", style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  ]

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary"><UsersRound className="size-5" /><span className="text-xs font-semibold uppercase tracking-wider">Examination management</span></div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Candidates</h1>
          <p className="text-sm ">Manage participation in <span className="font-medium text-foreground">{data.exam.title}</span></p>
          <div className="flex flex-wrap gap-2">
            {data.publication && <Badge variant="outline">Revision {data.publication.revision}</Badge>}
            <Badge variant="secondary" className="capitalize">{data.accessMode?.replaceAll("_", " ") ?? "Not published"}</Badge>
          </div>
        </div>
        <Button asChild size="sm"><Link href={`${base}/access`}><KeyRound className="size-4" /> Access Options <ArrowRight className="size-4" /></Link></Button>
      </header>

      {!data.publication ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-6 text-center">
          <LockKeyhole className="mx-auto mb-3 size-7 text-amber-700 dark:text-amber-300" />
          <h2 className="font-semibold">Publish this examination first</h2>
          <p className="mx-auto mt-2 max-w-md text-sm ">Candidate access and assignments require a sealed examination revision.</p>
          <Button asChild variant="outline" className="mt-4"><Link href={`/exams/${encodeURIComponent(data.exam.slug)}/settings`}>Examination Settings</Link></Button>
        </div>
      ) : (
        <>
          <CandidateOverviewStats data={data} />
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Candidate management</h2>
              <p className="text-xs ">Choose how to add or manage participants. Use your directory or school register to assign candidates in batches.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {methods.map(method => (
                <div key={method.title} className="flex min-h-44 flex-col rounded-xl border border-primary/20 bg-background p-4 transition-colors hover:border-primary/40">
                  <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${method.style}`}><method.icon className="size-5" /></div>
                  <p className="text-sm font-semibold">{method.title}</p>
                  <p className="mt-1 flex-1 text-xs leading-5 ">{method.description}</p>
                  {method.href ? <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link href={method.href}>Open <ArrowRight className="size-3.5" /></Link></Button> : <Badge variant="secondary" className="mt-4 w-fit">Next stage</Badge>}
                </div>
              ))}
            </div>
          </section>
          {isRegistered ? (
            <CandidateAssignmentWorkspace data={data} />
          ) : isPublic ? (
            <ExamCandidateRoster data={data} />
          ) : (
            <div className="rounded-xl border border-primary/20 bg-background p-5">
              <h2 className="font-semibold">{data.accessMode?.replaceAll("_", " ") ?? "Candidate"} access</h2>
              <p className="mt-2 text-sm ">This access mode does not have a candidate-management workflow yet. Existing publication and access settings are unchanged.</p>
              <Button asChild variant="outline" className="mt-4"><Link href={`${base}/access`}>Review access options <ArrowRight className="size-4" /></Link></Button>
            </div>
          )}
          
          {isPublic && (
            <div className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4">
              <Link2 className="mt-0.5 size-5 shrink-0 text-sky-700 dark:text-sky-300" />
              <div className="flex-1"><p className="text-sm font-semibold">Your public link is still available</p><p className="mt-1 text-xs ">Link management has moved to the Access Options page. Candidate participation remains here.</p></div>
              <Button asChild variant="outline" size="sm"><Link href={`${base}/access`}>View link</Link></Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
