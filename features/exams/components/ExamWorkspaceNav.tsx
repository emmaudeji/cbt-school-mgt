
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { urls } from "@/constants"
import { cn } from "@/lib/utils"

export function ExamWorkspaceNav({
  slug,
}: {
  slug: string
}) {
  const pathname = usePathname()

  const tabs = [
    { title: "Questions", href: urls.examDetails(slug) },
    { title: "Settings", href: urls.examSettings(slug) },
    { title: "Publish Exam", href: urls.examPublish(slug) },
    { title: "Candidates", href: urls.examCandidates(slug) },
    { title: "Assessment Integration", href: urls.examAssessmentIntegration(slug) },
    { title: "Results", href: urls.examResults(slug) },
    { title: "Sync Results", href: urls.examResultsImport(slug) },
    { title: "Manual Grading", href: urls.examManualGrading(slug) },
    { title: "Monitor", href: urls.examMonitor(slug) },
  ]

  return (
    <nav
      aria-label="Examination workspace"
      className="flex gap-1 overflow-x-auto border-b"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === `/exams/${slug}`
            ? pathname === tab.href ||
              pathname.startsWith(`${tab.href}/questions`)
            : pathname === tab.href ||
              pathname.startsWith(`${tab.href}/`)
        //   ||
        //   pathname.startsWith(`${tab.href}`)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm transition-colors",
              active
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.title}
          </Link>
        )
      })}
    </nav>
  )
}
