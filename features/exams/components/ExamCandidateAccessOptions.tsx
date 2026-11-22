import Link from "next/link"
import { ArrowLeft, CalendarClock, GraduationCap, KeyRound, Link2, LockKeyhole, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CandidateManagementData } from "@/types/candidate-management"
import { PublicExamLinkManager } from "@/features/exams/components/PublicExamLinkManager"
import { CandidateAccessMethodCard } from "./CandidateAccessMethodCard"
import { candidateBasePath, formatCandidateDate } from "../services/candidate-ui"

type Props = { data: CandidateManagementData }

export function ExamCandidateAccessOptions({ data }: Props) {
  const base = candidateBasePath(data.exam.slug)
  const methods = [
    { id: "open_link", title: "Public Link", description: "Candidates join using a shared examination link. Review or generate a link below.", icon: Link2, available: true, tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300", href: "#public-link" },
    { id: "registered", title: "Registered Candidates", description: "Assign eligible registered organization candidates and manage revoked access.", icon: UsersRound, available: data.accessMode === "registered", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", href: `${base}#candidate-assignments` },
    { id: "access_code", title: "Private Access Codes", description: "Assign school students or directory candidates without requiring login accounts.", icon: KeyRound, available: data.accessMode === "access_code", href: `${base}#candidate-private-codes`, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
    { id: "directory", title: "Candidate Directory", description: "Manage reusable candidates and bulk imports in the organization directory.", icon: GraduationCap, available: true, href: "/candidates", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  ]

  return (
    <main className="space-y-6">
      <header className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3"><Link href={base}><ArrowLeft className="size-4" /> Back to Candidates</Link></Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-xl font-bold sm:text-2xl">Candidate Access Options</h1><p className="mt-1 text-sm text-muted-foreground">{data.exam.title}</p></div>
          {data.publication && <div className="flex gap-2"><Badge variant="outline">Revision {data.publication.revision}</Badge><Badge variant="secondary" className="capitalize">{data.accessMode?.replaceAll("_", " ") ?? "Unknown"}</Badge></div>}
        </div>
      </header>
      {!data.publication ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-6"><LockKeyhole className="size-6 text-amber-700 dark:text-amber-300" /><h2 className="mt-3 font-semibold">Publish the examination first</h2><p className="mt-2 text-sm text-muted-foreground">A sealed publication is required before managing candidate access.</p></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-background p-4 text-xs text-muted-foreground">
            <CalendarClock className="size-4 text-primary" /><span className="font-medium text-foreground">Published availability:</span>
            <span>{formatCandidateDate(data.publication.available_from)} to {formatCandidateDate(data.publication.available_until)}</span>
            <span className="ml-auto">Access policy is sealed to this revision</span>
          </div>
          <div><h2 className="text-base font-semibold">How candidates enter</h2><p className="mt-1 text-xs text-muted-foreground">These cards show the current publication policy. They do not change its access mode.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {methods.map(method => <CandidateAccessMethodCard key={method.id} title={method.title} description={method.description} icon={method.icon} current={data.accessMode === method.id} available={method.available} href={method.href} tone={method.tone} />)}
          </div>
          <section id="public-link" className="scroll-mt-5">
            <PublicExamLinkManager
              examId={data.exam.id}
              slug={data.exam.slug}
              accessMode={data.accessMode}
              entryCode={data.publicLinkCode}
              availableFrom={data.publication.available_from}
              availableUntil={data.publication.available_until}
            />
          </section>
        </>
      )}
    </main>
  )
}
