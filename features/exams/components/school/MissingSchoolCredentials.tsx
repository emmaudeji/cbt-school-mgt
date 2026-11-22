"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { repairMissingExamCredentialsBatchAction } from "../../services/assignment/repair-missing-credentials"

type Props = {
  publicationId: string
  examSlug: string
  missingCount: number
  onCompleted?: () => void
}

/** Repair is explicit because reissuing legacy credentials invalidates the old codes. */
export function MissingSchoolCredentials({ publicationId, examSlug, missingCount, onCompleted }: Props) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [repaired, setRepaired] = useState(0)

  if (missingCount <= 0) return null

  async function repair() {
    if (working) return
    setWorking(true)
    let count = 0
    try {
      // Each invocation is short and bounded. The UI offers one action to the teacher.
      for (let batch = 0; batch < 1000; batch++) {
        const result = await repairMissingExamCredentialsBatchAction(publicationId, examSlug)
        if (!result.success) {
          toast.error(`${result.error}${count ? ` (${count} prepared before the error)` : ""}`)
          break
        }
        count += result.repaired
        setRepaired(count)
        if (!result.hasMore) {
          toast.success(`${count} existing candidate access code${count === 1 ? "" : "s"} prepared.`)
          break
        }
        if (batch === 999) toast.info("Batch limit reached. Run again to finish remaining candidates.")
      }
    } finally {
      setWorking(false)
      router.refresh()
      onCompleted?.()
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-none">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{missingCount} assigned candidate{missingCount === 1 ? "" : "s"} need downloadable codes</p>
          <p className="text-sm text-foreground/80">
            Prepare their personal access codes without assigning them again.
            Any older codes without a recoverable copy will be replaced, so distribute the updated credentials to those students.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void repair()} disabled={working} className="shadow-none">
          {working ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {working ? `Preparing codes… ${repaired} done` : `Prepare ${missingCount} missing codes`}
        </Button>
        {working && <span role="status" aria-live="polite" className="text-xs text-muted-foreground">Working in batches</span>}
      </div>
    </div>
  )
}
