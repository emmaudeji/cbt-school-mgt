"use client"

import { useEffect, useState, useTransition } from "react"
import { Settings2, RefreshCw } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { previewCandidateCodesAction, saveCandidateCodeSettingsAction } from "../../services/import/actions"
import type { CodePreview } from "../../services/import/types"

export function CandidateCodeSettings({ preview, onSaved }: { preview: CodePreview | null; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [prefix, setPrefix] = useState(preview?.prefix ?? "CBT")
  const [padding, setPadding] = useState(preview?.padding ?? 4)
  const [pending, start] = useTransition()
  useEffect(() => {
    if (!open && preview) { setPrefix(preview.prefix); setPadding(preview.padding) }
  }, [preview, open])
  return <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">Candidate code format</p>
        <p className="text-xs text-muted-foreground">{preview ? `${preview.prefix} + ${preview.padding}-digit serial · next ${preview.nextNumber}` : "Load numbering settings to preview codes"}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(value => !value)}><Settings2 className="size-4" /> {open ? "Close settings" : "Configure"}</Button>
    </div>
    {open && <div className="mt-3 grid gap-3 border-t border-primary/20 pt-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">
      <label className="space-y-1 text-xs font-medium">Prefix <Input value={prefix} maxLength={40} onChange={event => setPrefix(event.target.value.toUpperCase())} placeholder="GCE2026" /></label>
      <label className="space-y-1 text-xs font-medium">Serial digits <Input type="number" min={1} max={12} value={padding} onChange={event => setPadding(Number(event.target.value))} /></label>
      <Button disabled={pending || !/^[A-Z0-9_-]{2,40}$/.test(prefix) || !Number.isInteger(padding) || padding < 1 || padding > 12} onClick={() => start(async () => {
        const reply = await saveCandidateCodeSettingsAction(prefix, padding)
        if (!reply.success) return toast.error(reply.error ?? "Unable to save format")
        toast.success("Candidate code format updated")
        setOpen(false)
        onSaved()
      })}>{pending ? <RefreshCw className="size-4 animate-spin" /> : <Settings2 className="size-4" />} Save format</Button>
    </div>}
    <p className="mt-2 text-xs text-muted-foreground">Codes are permanent identifiers, not examination access PINs. Preview numbers are provisional until import.</p>
  </div>
}
