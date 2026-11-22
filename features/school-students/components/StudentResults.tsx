
import {
  BookOpenCheck,
  FileText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  StudentReportCard,
} from "@/types/students"

type Props = {
  reportCards: StudentReportCard[]
}

function formatScore(score: number | null) {
  if (score == null) return "—"
  return Number(score).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })
}

export default function StudentResults({
  reportCards,
}: Props) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4 sm:px-5">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="size-4 text-primary" />
          <CardTitle className="text-base">
            Academic Results
          </CardTitle>
        </div>

        <Badge variant="secondary">
          {reportCards.length} reports
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {reportCards.length === 0 ? (
          <div className="space-y-2 py-8 text-center">
            <FileText className="mx-auto size-9 text-muted-foreground" />

            <p className="text-sm font-medium">
              No accessible reports
            </p>

            <p className="text-xs text-muted-foreground">
              Available term results will appear here
              when recorded and authorized for viewing.
            </p>
          </div>
        ) : (
          reportCards.map((report) => (
            <details
              key={report.id}
              className="group overflow-hidden rounded-xl border border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {report.term?.session?.name ??
                      "Academic Session"}
                    {" · "}
                    {report.term?.name ?? "Term"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.class?.name ?? "Class"}
                    {" · "}
                    {report.subjects.length} subject records
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      report.status === "published"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {report.status}
                  </Badge>

                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </div>
              </summary>

              <div className="border-t border-border p-4">
                {report.subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] text-left text-sm">
                      <thead className="border-b text-xs text-muted-foreground">
                        <tr>
                          <th className="pb-3 pr-3 font-medium">
                            Subject
                          </th>
                          <th className="pb-3 pr-3 text-right font-medium">
                            Score
                          </th>
                          <th className="pb-3 text-right font-medium">
                            Grade
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {report.subjects.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 pr-3">
                              <p className="font-medium">
                                {item.offering?.subject?.name ??
                                  "Subject"}
                              </p>

                              {item.remark && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.remark}
                                </p>
                              )}
                            </td>

                            <td className="py-3 pr-3 text-right tabular-nums">
                              {formatScore(item.total_score)}
                            </td>

                            <td className="py-3 text-right font-medium">
                              {item.grade ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No subject results available.
                  </p>
                )}

                {(report.teacher_comment ||
                  report.principal_comment) && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {report.teacher_comment && (
                      <div>
                        <p className="text-xs font-semibold">
                          Teacher's Comment
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.teacher_comment}
                        </p>
                      </div>
                    )}

                    {report.principal_comment && (
                      <div>
                        <p className="text-xs font-semibold">
                          Principal's Comment
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.principal_comment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  )
}
