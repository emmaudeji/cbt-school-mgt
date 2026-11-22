"use client"

import { Download, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IssuedPrivateCredential } from "../../services/assignment/private-code-actions"

type Props = {
  credentials: IssuedPrivateCredential[]
  entryCode: string
  onClear: () => void
}

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function IssuedSchoolCredentials({ credentials, entryCode, onClear }: Props) {
  function download() {
    const rows = [
      ["First name", "Surname", "Candidate code", "Exam entry code", "Personal access code"],
      ...credentials.map(row => [row.firstName, row.lastName, row.candidateCode, entryCode, row.accessCode])
    ]
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "school-exam-credentials.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
        <ShieldCheck className="size-5" />
        <h3 className="font-semibold">{credentials.length} examination access codes issued</h3>
      </div>
      <p className="text-sm text-foreground/85">
        Download these codes now. Personal access codes cannot be viewed again after leaving this page.
        Keep the complete file private, and give each student only their own code.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}><Download className="size-4" /> Download credentials</Button>
        <Button variant="outline" onClick={onClear}><Trash2 className="size-4" /> Clear codes</Button>
      </div>
    </div>
  )
}
